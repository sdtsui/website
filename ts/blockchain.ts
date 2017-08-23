import * as _ from 'lodash';
import {
    ZeroEx,
    ExchangeEvents,
    SubscriptionOpts,
    IndexedFilterValues,
    ContractEvent,
    ContractEventEmitter,
    LogFillContractEventArgs,
    Token as ZeroExToken,
} from '0x.js';
import * as BigNumber from 'bignumber.js';
import Web3 = require('web3');
import promisify = require('es6-promisify');
import findVersions = require('find-versions');
import compareVersions = require('compare-versions');
import contract = require('truffle-contract');
import ethUtil = require('ethereumjs-util');
import ProviderEngine = require('web3-provider-engine');
import FilterSubprovider = require('web3-provider-engine/subproviders/filters');
import {RedundantRPCSubprovider} from 'ts/subproviders/redundant_rpc_subprovider';
import {InjectedWeb3SubProvider} from 'ts/subproviders/injected_web3_subprovider';
import {ledgerWalletSubproviderFactory} from 'ts/subproviders/ledger_wallet_subprovider_factory';
import {Dispatcher} from 'ts/redux/dispatcher';
import {utils} from 'ts/utils/utils';
import {constants} from 'ts/utils/constants';
import {configs} from 'ts/utils/configs';
import {
    BlockchainErrs,
    Token,
    SignatureData,
    Side,
    ContractResponse,
    BlockchainCallErrs,
    ContractInstance,
    ProviderType,
    LedgerWalletSubprovider,
} from 'ts/types';
import {Web3Wrapper} from 'ts/web3_wrapper';
import {errorReporter} from 'ts/utils/error_reporter';
import {tradeHistoryStorage} from 'ts/local_storage/trade_history_storage';
import {customTokenStorage} from 'ts/local_storage/custom_token_storage';
import * as TokenTransferProxyArtifacts from '../contracts/TokenTransferProxy.json';
import * as TokenRegistryArtifacts from '../contracts/TokenRegistry.json';
import * as TokenArtifacts from '../contracts/Token.json';
import * as MintableArtifacts from '../contracts/Mintable.json';
import * as EtherTokenArtifacts from '../contracts/EtherToken.json';

const ALLOWANCE_TO_ZERO_GAS_AMOUNT = 45730;

export class Blockchain {
    public networkId: number;
    public nodeVersion: string;
    private zeroEx: ZeroEx;
    private dispatcher: Dispatcher;
    private web3Wrapper: Web3Wrapper;
    private exchangeAddress: string;
    private exchangeLogFillEventEmitters: ContractEventEmitter[];
    private tokenTransferProxy: ContractInstance;
    private tokenRegistry: ContractInstance;
    private userAddress: string;
    private cachedProvider: Web3.Provider;
    private ledgerSubProvider: LedgerWalletSubprovider;
    constructor(dispatcher: Dispatcher, isSalePage: boolean = false) {
        this.dispatcher = dispatcher;
        this.userAddress = '';
        this.exchangeLogFillEventEmitters = [];
        this.onPageLoadInitFireAndForgetAsync();
    }
    public async networkIdUpdatedFireAndForgetAsync(newNetworkId: number) {
        const isConnected = !_.isUndefined(newNetworkId);
        if (!isConnected) {
            this.networkId = newNetworkId;
            this.dispatcher.encounteredBlockchainError(BlockchainErrs.DISCONNECTED_FROM_ETHEREUM_NODE);
            this.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
        } else if (this.networkId !== newNetworkId) {
            this.networkId = newNetworkId;
            this.dispatcher.encounteredBlockchainError('');
            await this.instantiateContractsAsync();
            await this.rehydrateStoreWithContractEvents();
        }
    }
    public async userAddressUpdatedFireAndForgetAsync(newUserAddress: string) {
        if (this.userAddress !== newUserAddress) {
            this.userAddress = newUserAddress;
            await this.rehydrateStoreWithContractEvents();
        }
    }
    public async nodeVersionUpdatedFireAndForgetAsync(nodeVersion: string) {
        if (this.nodeVersion !== nodeVersion) {
            this.nodeVersion = nodeVersion;
        }
    }
    public async isAddressInTokenRegistryAsync(tokenAddress: string): Promise<boolean> {
        utils.assert(!_.isUndefined(this.tokenRegistry), 'TokenRegistry must be instantiated');
        const tokenMetadata = await this.tokenRegistry.getTokenMetaData.call(tokenAddress);
        return tokenMetadata[0] !== constants.NULL_ADDRESS;
    }
    public async isSymbolInTokenRegistryAsync(symbol: string): Promise<boolean> {
        utils.assert(!_.isUndefined(this.tokenRegistry), 'TokenRegistry must be instantiated');
        const tokenMetadata = await this.tokenRegistry.getTokenBySymbol.call(symbol);
        return tokenMetadata[0] !== constants.NULL_ADDRESS;
    }
    public getLedgerDerivationPathIfExists(): string {
        if (_.isUndefined(this.ledgerSubProvider)) {
            return undefined;
        }
        const path = this.ledgerSubProvider.getPath();
        return path;
    }
    public updateLedgerDerivationPathIfExists(path: string) {
        if (_.isUndefined(this.ledgerSubProvider)) {
            return; // noop
        }
        this.ledgerSubProvider.setPath(path);
    }
    public updateLedgerDerivationIndex(pathIndex: number) {
        if (_.isUndefined(this.ledgerSubProvider)) {
            return; // noop
        }
        this.ledgerSubProvider.setPathIndex(pathIndex);
    }
    public async providerTypeUpdatedFireAndForgetAsync(providerType: ProviderType) {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        // Should actually be Web3.Provider|ProviderEngine union type but it causes issues
        // later on in the logic.
        let provider;
        switch (providerType) {
            case ProviderType.LEDGER: {
                const isU2FSupported = await utils.isU2FSupportedAsync();
                if (!isU2FSupported) {
                    throw new Error('Cannot update providerType to LEDGER without U2F support');
                }

                // Cache injected provider so that we can switch the user back to it easily
                this.cachedProvider = this.web3Wrapper.getProviderObj();

                this.dispatcher.updateUserAddress(''); // Clear old userAddress

                provider = new ProviderEngine();
                this.ledgerSubProvider = ledgerWalletSubproviderFactory(this.getBlockchainNetworkId.bind(this));
                provider.addProvider(this.ledgerSubProvider);
                provider.addProvider(new FilterSubprovider());
                provider.addProvider(new RedundantRPCSubprovider(
                    constants.PUBLIC_NODE_URLS_BY_NETWORK_ID[constants.MAINNET_NETWORK_ID],
                ));
                provider.start();
                this.web3Wrapper.destroy();
                const shouldPollUserAddress = false;
                this.web3Wrapper = new Web3Wrapper(this.dispatcher, provider, this.networkId, shouldPollUserAddress);
                await this.zeroEx.setProviderAsync(provider);
                await this.postInstantiationOrUpdatingProviderZeroExAsync();
                break;
            }

            case ProviderType.INJECTED: {
                if (_.isUndefined(this.cachedProvider)) {
                    return; // Going from injected to injected, so we noop
                }
                provider = this.cachedProvider;
                const shouldPollUserAddress = true;
                this.web3Wrapper = new Web3Wrapper(this.dispatcher, provider, this.networkId, shouldPollUserAddress);
                await this.zeroEx.setProviderAsync(provider);
                await this.postInstantiationOrUpdatingProviderZeroExAsync();
                delete this.ledgerSubProvider;
                delete this.cachedProvider;
                break;
            }

            default:
                throw utils.spawnSwitchErr('providerType', providerType);
        }

        await this.instantiateContractsAsync();
    }
    public async setProxyAllowanceAsync(token: Token, amountInBaseUnits: BigNumber.BigNumber): Promise<void> {
        utils.assert(this.isValidAddress(token.address), BlockchainCallErrs.TOKEN_ADDRESS_IS_INVALID);
        utils.assert(this.doesUserAddressExist(), BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        const tokenContract = await this.instantiateContractIfExistsAsync(TokenArtifacts, token.address);
        // Hack: for some reason default estimated gas amount causes `base fee exceeds gas limit` exception
        // on testrpc. Probably related to https://github.com/ethereumjs/testrpc/issues/294
        // TODO: Debug issue in testrpc and submit a PR, then remove this hack
        const estimatedGas = await tokenContract.approve.estimateGas(
            this.tokenTransferProxy.address, amountInBaseUnits,
            {
                from: this.userAddress,
            },
        );
        const gas = this.networkId === constants.TESTRPC_NETWORK_ID && amountInBaseUnits.eq(0) ?
                    ALLOWANCE_TO_ZERO_GAS_AMOUNT :
                    estimatedGas;
        await tokenContract.approve(this.tokenTransferProxy.address, amountInBaseUnits, {
            from: this.userAddress,
            gas,
        });
        const allowance = amountInBaseUnits;
        this.dispatcher.replaceTokenAllowanceByAddress(token.address, allowance);
    }
    public async fillOrderAsync(maker: string, taker: string, makerTokenAddress: string,
                                takerTokenAddress: string, makerTokenAmount: BigNumber.BigNumber,
                                takerTokenAmount: BigNumber.BigNumber, makerFee: BigNumber.BigNumber,
                                takerFee: BigNumber.BigNumber, expirationUnixTimestampSec: BigNumber.BigNumber,
                                feeRecipient: string, fillTakerTokenAmount: BigNumber.BigNumber,
                                signatureData: SignatureData, salt: BigNumber.BigNumber): Promise<BigNumber.BigNumber> {
        utils.assert(this.doesUserAddressExist(), BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        taker = taker === '' ? constants.NULL_ADDRESS : taker;
        const ecSignature = signatureData;
        delete ecSignature.hash;
        const exchangeContractAddress = this.getExchangeContractAddressIfExists();
        const signedOrder = {
            ecSignature,
            exchangeContractAddress,
            expirationUnixTimestampSec,
            feeRecipient,
            maker,
            makerFee,
            makerTokenAddress,
            makerTokenAmount,
            salt,
            taker,
            takerFee,
            takerTokenAddress,
            takerTokenAmount,
        };
        const shouldThrowOnInsufficientBalanceOrAllowance = true;

        const amountFilledInTakerTokens = await this.zeroEx.exchange.fillOrderAsync(
            signedOrder, fillTakerTokenAmount, shouldThrowOnInsufficientBalanceOrAllowance, this.userAddress,
        );
        return amountFilledInTakerTokens;
    }
    public async getUnavailableTakerAmountAsync(orderHash: string): Promise<BigNumber.BigNumber> {
        utils.assert(ZeroEx.isValidOrderHash(orderHash), 'Must be valid orderHash');
        const unavailableTakerAmount = await this.zeroEx.exchange.getUnavailableTakerAmountAsync(orderHash);
        return unavailableTakerAmount;
    }
    public getExchangeContractAddressIfExists() {
        return this.exchangeAddress;
    }
    public isValidAddress(address: string): boolean {
        const lowercaseAddress = address.toLowerCase();
        return this.web3Wrapper.isAddress(lowercaseAddress);
    }
    public async signOrderHashAsync(orderHash: string): Promise<SignatureData> {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        const makerAddress = this.userAddress;
        // If makerAddress is undefined, this means they have a web3 instance injected into their browser
        // but no account addresses associated with it.
        if (_.isUndefined(makerAddress)) {
            throw new Error('Tried to send a sign request but user has no associated addresses');
        }
        const ecSignature = await this.zeroEx.signOrderHashAsync(orderHash, makerAddress);
        const signatureData = _.extend({}, ecSignature, {
            hash: orderHash,
        });
        this.dispatcher.updateSignatureData(signatureData);
        return signatureData;
    }
    public async mintTestTokensAsync(token: Token) {
        utils.assert(this.doesUserAddressExist(), BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        const mintableContract = await this.instantiateContractIfExistsAsync(MintableArtifacts, token.address);
        await mintableContract.mint(constants.MINT_AMOUNT, {
            from: this.userAddress,
        });
        const balanceDelta = constants.MINT_AMOUNT;
        this.dispatcher.updateTokenBalanceByAddress(token.address, balanceDelta);
    }
    public async getBalanceInEthAsync(owner: string): Promise<BigNumber.BigNumber> {
        const balance = await this.web3Wrapper.getBalanceInEthAsync(owner);
        return balance;
    }
    public async convertEthToWrappedEthTokensAsync(amount: BigNumber.BigNumber) {
        utils.assert(this.doesUserAddressExist(), BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        const wethContract = await this.instantiateContractIfExistsAsync(EtherTokenArtifacts);
        await wethContract.deposit({
            from: this.userAddress,
            value: amount,
        });
    }
    public async convertWrappedEthTokensToEthAsync(amount: BigNumber.BigNumber) {
        utils.assert(this.doesUserAddressExist(), BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        const wethContract = await this.instantiateContractIfExistsAsync(EtherTokenArtifacts);
        await wethContract.withdraw(amount, {
            from: this.userAddress,
        });
    }
    public async doesContractExistAtAddressAsync(address: string) {
        return await this.web3Wrapper.doesContractExistAtAddressAsync(address);
    }
    public async getCurrentUserTokenBalanceAndAllowanceAsync(tokenAddress: string): Promise<BigNumber.BigNumber[]> {
      return await this.getTokenBalanceAndAllowanceAsync(this.userAddress, tokenAddress);
    }
    public async getTokenBalanceAndAllowanceAsync(ownerAddress: string, tokenAddress: string):
                    Promise<BigNumber.BigNumber[]> {
        if (_.isEmpty(ownerAddress)) {
            const zero = new BigNumber(0);
            return [zero, zero];
        }
        const tokenContract = await this.instantiateContractIfExistsAsync(TokenArtifacts, tokenAddress);
        let balance = new BigNumber(0);
        let allowance = new BigNumber(0);
        if (this.doesUserAddressExist()) {
            balance = await tokenContract.balanceOf.call(ownerAddress);
            allowance = await tokenContract.allowance.call(ownerAddress, this.tokenTransferProxy.address);
            // We rewrap BigNumbers from web3 into our BigNumber because the version that they're using is too old
            balance = new BigNumber(balance);
            allowance = new BigNumber(allowance);
        }
        return [balance, allowance];
    }
    public async updateTokenBalancesAndAllowancesAsync(tokens: Token[]) {
        const updatedTokens = [];
        for (const token of tokens) {
            if (_.isUndefined(token.address)) {
                continue; // Cannot retrieve balance for tokens without an address
            }
            const [balance, allowance] = await this.getTokenBalanceAndAllowanceAsync(this.userAddress, token.address);
            updatedTokens.push(_.assign({}, token, {
                balance,
                allowance,
            }));
        }
        this.dispatcher.updateTokenByAddress(updatedTokens);
    }
    public async getUserAccountsAsync() {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        const userAccountsIfExists = await this.zeroEx.getAvailableAddressesAsync();
        return userAccountsIfExists;
    }
    // HACK: When a user is using a Ledger, we simply dispatch the selected userAddress, which
    // by-passes the web3Wrapper logic for updating the prevUserAddress. We therefore need to
    // manually update it. This should only be called by the LedgerConfigDialog.
    public updateWeb3WrapperPrevUserAddress(newUserAddress: string) {
        this.web3Wrapper.updatePrevUserAddress(newUserAddress);
    }
    public destroy() {
        this.web3Wrapper.destroy();
        this.stopWatchingExchangeLogFillEventsAsync(); // fire and forget
    }
    private doesUserAddressExist(): boolean {
        return this.userAddress !== '';
    }
    private async rehydrateStoreWithContractEvents() {
        // Ensure we are only ever listening to one set of events
        await this.stopWatchingExchangeLogFillEventsAsync();

        if (!this.doesUserAddressExist()) {
            return; // short-circuit
        }

        if (!_.isUndefined(this.zeroEx)) {
            // Since we do not have an index on the `taker` address and want to show
            // transactions where an account is either the `maker` or `taker`, we loop
            // through all fill events, and filter/cache them client-side.
            const filterIndexObj = {};
            await this.startListeningForExchangeLogFillEventsAsync(filterIndexObj);
        }
    }
    private async startListeningForExchangeLogFillEventsAsync(indexFilterValues: IndexedFilterValues): Promise<void> {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        utils.assert(this.doesUserAddressExist(), BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        const fromBlock = tradeHistoryStorage.getFillsLatestBlock(this.userAddress, this.networkId);
        const subscriptionOpts: SubscriptionOpts = {
            fromBlock,
            toBlock: 'latest',
        };
        const exchangeAddress = this.getExchangeContractAddressIfExists();
        const exchangeLogFillEventEmitter = await this.zeroEx.exchange.subscribeAsync(
            ExchangeEvents.LogFill, subscriptionOpts, indexFilterValues, exchangeAddress,
        );
        this.exchangeLogFillEventEmitters.push(exchangeLogFillEventEmitter);
        exchangeLogFillEventEmitter.watch(async (err: Error, event: ContractEvent) => {
            if (err) {
                // Note: it's not entirely clear from the documentation which
                // errors will be thrown by `watch`. For now, let's log the error
                // to rollbar and stop watching when one occurs
                errorReporter.reportAsync(err); // fire and forget
                this.stopWatchingExchangeLogFillEventsAsync(); // fire and forget
                return;
            } else {
                const args = event.args as LogFillContractEventArgs;
                const isBlockPending = _.isNull(event.blockNumber);
                if (!isBlockPending) {
                    // Hack: I've observed the behavior where a client won't register certain fill events
                    // and lowering the cache blockNumber fixes the issue. As a quick fix for now, simply
                    // set the cached blockNumber 50 below the one returned. This way, upon refreshing, a user
                    // would still attempt to re-fetch events from the previous 50 blocks, but won't need to
                    // re-fetch all events in all blocks.
                    // TODO: Debug if this is a race condition, and apply a more precise fix
                    const blockNumberToSet = event.blockNumber - 50 < 0 ? 0 : event.blockNumber - 50;
                    tradeHistoryStorage.setFillsLatestBlock(this.userAddress, this.networkId, blockNumberToSet);
                }
                const isUserMakerOrTaker = args.maker === this.userAddress ||
                                           args.taker === this.userAddress;
                if (!isUserMakerOrTaker) {
                    return; // We aren't interested in the fill event
                }
                const blockTimestamp = await this.web3Wrapper.getBlockTimestampAsync(event.blockHash);
                const fill = {
                    filledTakerTokenAmount: args.filledTakerTokenAmount,
                    filledMakerTokenAmount: args.filledMakerTokenAmount,
                    logIndex: event.logIndex,
                    maker: args.maker,
                    orderHash: args.orderHash,
                    taker: args.taker,
                    makerToken: args.makerToken,
                    takerToken: args.takerToken,
                    paidMakerFee: args.paidMakerFee,
                    paidTakerFee: args.paidTakerFee,
                    transactionHash: event.transactionHash,
                    blockTimestamp,
                };
                tradeHistoryStorage.addFillToUser(this.userAddress, this.networkId, fill);
            }
        });
    }
    private async stopWatchingExchangeLogFillEventsAsync() {
        if (!_.isEmpty(this.exchangeLogFillEventEmitters)) {
            for (const logFillEventEmitter of this.exchangeLogFillEventEmitters) {
                await logFillEventEmitter.stopWatchingAsync();
            }
            this.exchangeLogFillEventEmitters = [];
        }
    }
    private async getTokenRegistryTokensAsync(): Promise<Token[]> {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        const tokenRegistryTokens = await this.zeroEx.tokenRegistry.getTokensAsync();

        const tokenBalanceAllowancePromises: Array<Promise<BigNumber.BigNumber[]>> = _.map(
            tokenRegistryTokens,
            (token: ZeroExToken) => (this.getTokenBalanceAndAllowanceAsync(this.userAddress, token.address)),
        );
        const balancesAndAllowances = await Promise.all(tokenBalanceAllowancePromises);

        const tokens = _.map(tokenRegistryTokens, (t: ZeroExToken, i: number) => {
            const [
                balance,
                allowance,
            ] = balancesAndAllowances[i];
            // HACK: For now we have a hard-coded list of iconUrls for the dummyTokens
            // TODO: Refactor this out and pull the iconUrl directly from the TokenRegistry
            const iconUrl = constants.iconUrlBySymbol[t.symbol];
            const token: Token = {
                iconUrl: !_.isUndefined(iconUrl) ? iconUrl : constants.DEFAULT_TOKEN_ICON_URL,
                address: t.address,
                balance,
                allowance,
                name: t.name,
                symbol: t.symbol,
                decimals: t.decimals,
            };
            return token;
        });
        return tokens;
    }
    private async getCustomTokensAsync() {
        const customTokens = customTokenStorage.getCustomTokens(this.networkId);
        for (const customToken of customTokens) {
            const [
              balance,
              allowance,
            ] = await this.getTokenBalanceAndAllowanceAsync(this.userAddress, customToken.address);
            customToken.balance = balance;
            customToken.allowance = allowance;
        }
        return customTokens;
    }
    private async onPageLoadInitFireAndForgetAsync() {
        await this.onPageLoadAsync(); // wait for page to load

        // Hack: We need to know the networkId the injectedWeb3 is connected to (if it is defined) in
        // order to properly instantiate the web3Wrapper. Since we must use the async call, we cannot
        // retrieve it from within the web3Wrapper constructor. This is and should remain the only
        // call to a web3 instance outside of web3Wrapper in the entire dapp.
        // In addition, if the user has an injectedWeb3 instance that is disconnected from a backing
        // Ethereum node, this call will throw. We need to handle this case gracefully
        const injectedWeb3 = (window as any).web3;
        let networkId: number;
        if (!_.isUndefined(injectedWeb3)) {
            try {
                networkId = _.parseInt(await promisify(injectedWeb3.version.getNetwork)());
            } catch (err) {
                // Ignore error and proceed with networkId undefined
            }
        }

        const provider = await this.getProviderAsync(injectedWeb3, networkId);
        await this.updateProviderName(injectedWeb3);
        const shouldPollUserAddress = true;
        this.web3Wrapper = new Web3Wrapper(this.dispatcher, provider, networkId, shouldPollUserAddress);
        this.zeroEx = new ZeroEx(provider);
        await this.postInstantiationOrUpdatingProviderZeroExAsync();
    }
    // This method should always be run after instantiating or updating the provider
    // of the ZeroEx instance.
    private async postInstantiationOrUpdatingProviderZeroExAsync() {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        this.exchangeAddress = await this.zeroEx.exchange.getContractAddressAsync();
    }
    private updateProviderName(injectedWeb3: Web3) {
        const doesInjectedWeb3Exist = !_.isUndefined(injectedWeb3);
        let providerName;
        if (doesInjectedWeb3Exist) {
            providerName = this.getNameGivenProvider(injectedWeb3.currentProvider);
        } else {
            providerName = constants.PUBLIC_PROVIDER_NAME;
        }
        this.dispatcher.updateInjectedProviderName(providerName);
    }
    // This is only ever called by the LedgerWallet subprovider in order to retrieve
    // the current networkId without this value going stale.
    private getBlockchainNetworkId() {
        return this.networkId;
    }
    private async getProviderAsync(injectedWeb3: Web3, networkIdIfExists: number) {
        const doesInjectedWeb3Exist = !_.isUndefined(injectedWeb3);
        const publicNodeUrlsIfExistsForNetworkId = constants.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkIdIfExists];
        const isPublicNodeAvailableForNetworkId = !_.isUndefined(publicNodeUrlsIfExistsForNetworkId);

        let provider;
        if (doesInjectedWeb3Exist && isPublicNodeAvailableForNetworkId) {
            // We catch all requests involving a users account and send it to the injectedWeb3
            // instance. All other requests go to the public hosted node.
            provider = new ProviderEngine();
            provider.addProvider(new InjectedWeb3SubProvider(injectedWeb3));
            provider.addProvider(new FilterSubprovider());
            provider.addProvider(new RedundantRPCSubprovider(
                publicNodeUrlsIfExistsForNetworkId,
            ));
            provider.start();
        } else if (doesInjectedWeb3Exist) {
            // Since no public node for this network, all requests go to injectedWeb3 instance
            provider = injectedWeb3.currentProvider;
        } else {
            // If no injectedWeb3 instance, all requests fallback to our public hosted mainnet node
            // We do this so that users can still browse the OTC DApp even if they do not have web3
            // injected into their browser.
            provider = new ProviderEngine();
            provider.addProvider(new FilterSubprovider());
            provider.addProvider(new RedundantRPCSubprovider(
                constants.PUBLIC_NODE_URLS_BY_NETWORK_ID[constants.MAINNET_NETWORK_ID],
            ));
            provider.start();
        }

        return provider;
    }
    private getNameGivenProvider(provider: Web3.Provider): string {
        if (!_.isUndefined((provider as any).isMetaMask)) {
            return constants.METAMASK_PROVIDER_NAME;
        }

        // HACK: We use the fact that Parity Signer's provider is an instance of their
        // internal `Web3FrameProvider` class.
        const isParitySigner = _.startsWith(provider.constructor.toString(), 'function Web3FrameProvider');
        if (isParitySigner) {
            return constants.PARITY_SIGNER_PROVIDER_NAME;
        }

        return constants.GENERIC_PROVIDER_NAME;
    }
    private async instantiateContractsAsync() {
        utils.assert(!_.isUndefined(this.networkId),
                     'Cannot call instantiateContractsAsync if disconnected from Ethereum node');

        this.dispatcher.updateBlockchainIsLoaded(false);
        try {
            const contractsPromises = _.map(
                [
                  TokenRegistryArtifacts,
                  TokenTransferProxyArtifacts,
                ],
                (artifacts: any) => this.instantiateContractIfExistsAsync(artifacts),
            );
            const contracts = await Promise.all(contractsPromises);
            this.tokenRegistry = contracts[0];
            this.tokenTransferProxy = contracts[1];
        } catch (err) {
            const errMsg = err + '';
            if (_.includes(errMsg, BlockchainCallErrs.CONTRACT_DOES_NOT_EXIST)) {
                this.dispatcher.encounteredBlockchainError(BlockchainErrs.A_CONTRACT_NOT_DEPLOYED_ON_NETWORK);
                this.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
                return;
            } else {
                // We show a generic message for other possible caught errors
                this.dispatcher.encounteredBlockchainError(BlockchainErrs.UNHANDLED_ERROR);
                return;
            }
        }
        this.dispatcher.clearTokenByAddress();
        const tokenArrays = await Promise.all([
                this.getTokenRegistryTokensAsync(),
                this.getCustomTokensAsync(),
        ]);
        const tokens = _.flatten(tokenArrays);
        // HACK: We need to fetch the userAddress here because otherwise we cannot fetch the token
        // balances and allowances and we need to do this in order not to trigger the blockchain
        // loading dialog to show up twice. First to load the contracts, and second to load the
        // balances and allowances.
        this.userAddress = await this.web3Wrapper.getFirstAccountIfExistsAsync();
        if (!_.isEmpty(this.userAddress)) {
            this.dispatcher.updateUserAddress(this.userAddress);
        }
        await this.updateTokenBalancesAndAllowancesAsync(tokens);
        const mostPopularTradingPairTokens: Token[] = [
            _.find(tokens, {symbol: configs.mostPopularTradingPairSymbols[0]}),
            _.find(tokens, {symbol: configs.mostPopularTradingPairSymbols[1]}),
        ];
        this.dispatcher.updateChosenAssetTokenAddress(Side.deposit, mostPopularTradingPairTokens[0].address);
        this.dispatcher.updateChosenAssetTokenAddress(Side.receive, mostPopularTradingPairTokens[1].address);
        this.dispatcher.updateBlockchainIsLoaded(true);
    }
    private async instantiateContractIfExistsAsync(artifact: any, address?: string): Promise<ContractInstance> {
        const c = await contract(artifact);
        const providerObj = this.web3Wrapper.getProviderObj();
        c.setProvider(providerObj);

        const artifactNetworkConfigs = artifact.networks[this.networkId];
        let contractAddress;
        if (!_.isUndefined(address)) {
            contractAddress = address;
        } else if (!_.isUndefined(artifactNetworkConfigs)) {
            contractAddress = artifactNetworkConfigs.address;
        }

        if (!_.isUndefined(contractAddress)) {
            const doesContractExist = await this.doesContractExistAtAddressAsync(contractAddress);
            if (!doesContractExist) {
                utils.consoleLog(`Contract does not exist: ${artifact.contract_name} at ${contractAddress}`);
                throw new Error(BlockchainCallErrs.CONTRACT_DOES_NOT_EXIST);
            }
        }

        try {
            let contractInstance;
            if (_.isUndefined(address)) {
                contractInstance = await c.deployed();
            } else {
                contractInstance = await c.at(address);
            }
            return contractInstance;
        } catch (err) {
            const errMsg = `${err}`;
            utils.consoleLog(`Notice: Error encountered: ${err} ${err.stack}`);
            if (_.includes(errMsg, 'not been deployed to detected network')) {
                throw new Error(BlockchainCallErrs.CONTRACT_DOES_NOT_EXIST);
            } else {
                await errorReporter.reportAsync(err);
                throw new Error(BlockchainCallErrs.UNHANDLED_ERROR);
            }
        }
    }
    private async onPageLoadAsync() {
        if (document.readyState === 'complete') {
            return; // Already loaded
        }
        return new Promise((resolve, reject) => {
            window.onload = resolve;
        });
    }
}
