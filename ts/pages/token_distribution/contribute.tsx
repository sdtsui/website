import * as _ from 'lodash';
import * as React from 'react';
import * as DocumentTitle from 'react-document-title';
import * as accounting from 'accounting';
import * as BigNumber from 'bignumber.js';
import * as moment from 'moment';
import ReactTooltip = require('react-tooltip');
import {colors} from 'material-ui/styles';
import CircularProgress from 'material-ui/CircularProgress';
import {ZeroEx} from '0x.js';
import {utils} from 'ts/utils/utils';
import {Blockchain} from 'ts/blockchain';
import {constants} from 'ts/utils/constants';
import {Footer} from 'ts/components/footer';
import {TopBar} from 'ts/components/top_bar';
import {BlockchainErrs, ProviderType, EtherscanLinkSuffixes, ScreenWidths, TokenSaleErrs} from 'ts/types';
import {Dispatcher} from 'ts/redux/dispatcher';
import {FlashMessage} from 'ts/components/ui/flash_message';
import {BlockchainErrDialog} from 'ts/components/blockchain_err_dialog';
import {EthAmountInput} from 'ts/components/inputs/eth_amount_input';
import {LedgerConfigDialog} from 'ts/components/ledger_config_dialog';
import {PurchaseLoadingDialog} from 'ts/pages/token_distribution/purchase_loading_dialog';
import {U2fNotSupportedDialog} from 'ts/components/u2f_not_supported_dialog';
import {LabeledSwitcher} from 'ts/components/ui/labeled_switcher';
import {Party} from 'ts/components/ui/party';
import {LifeCycleRaisedButton} from 'ts/components/ui/lifecycle_raised_button';
import {SaleStats} from 'ts/pages/token_distribution/sale_stats';
import {Loading} from 'ts/components/ui/loading';
import {ContributionNotice} from 'ts/pages/token_distribution/contribution_notice';

const CUSTOM_GRAY = '#464646';
const CUSTOM_LIGHT_GRAY = '#BBBBBB';
const ZRX_ETH_DECIMAL_PLACES = 18;
const THROTTLE_TIMEOUT = 100;
const VARIABLE_TOKEN_SALE_INFO_INTERVAL = 3000;
const TRANSACTION_MINED_CHECK_INTERVAL = 5000;

export interface ContributeProps {
    location: Location;
    dispatcher: Dispatcher;
    blockchainIsLoaded: boolean;
    networkId: number;
    nodeVersion: string;
    providerType: ProviderType;
    injectedProviderName: string;
    userAddress: string;
    userEtherBalance: BigNumber.BigNumber;
    flashMessage?: string|React.ReactNode;
    blockchainErr: BlockchainErrs;
    shouldBlockchainErrDialogBeOpen: boolean;
    screenWidth: ScreenWidths;
}

interface ContributeState {
    contributionAmountInBaseUnits?: BigNumber.BigNumber;
    prevNetworkId: number;
    prevNodeVersion: string;
    prevUserAddress: string;
    prevProviderType: ProviderType;
    prevBlockchainIsLoaded: boolean;
    isLedgerDialogOpen: boolean;
    isU2FDialogOpen: boolean;
    zrxSold: BigNumber.BigNumber;
    zrxToEthExchangeRate?: BigNumber.BigNumber;
    ethContributedAmount?: BigNumber.BigNumber;
    baseEthCapPerAddress?: BigNumber.BigNumber;
    startTimeInSec?: BigNumber.BigNumber;
    totalZrxSupply: BigNumber.BigNumber;
    isAddressRegistered: boolean;
    didLoadConstantTokenSaleInfo: boolean;
    isInitialized?: boolean;
    isFinished?: boolean;
    transactionHash: string;
    isPurchaseLoadingDialogOpen: boolean;
}

export class Contribute extends React.Component<ContributeProps, ContributeState> {
    private blockchain: Blockchain;
    private throttledScreenWidthUpdate: () => void;
    private updateVariableTokenSaleInfoIntervalId: number;
    private txConfirmationIntervalId: number;
    constructor(props: ContributeProps) {
        super(props);
        this.throttledScreenWidthUpdate = _.throttle(this.updateScreenWidth.bind(this), THROTTLE_TIMEOUT);
        this.state = {
            prevNetworkId: this.props.networkId,
            prevNodeVersion: this.props.nodeVersion,
            prevUserAddress: this.props.userAddress,
            prevProviderType: this.props.providerType,
            prevBlockchainIsLoaded: this.props.blockchainIsLoaded,
            isLedgerDialogOpen: false,
            isU2FDialogOpen: false,
            zrxSold: new BigNumber(0),
            totalZrxSupply: ZeroEx.toBaseUnitAmount(new BigNumber(500000000), 18),
            isAddressRegistered: false,
            didLoadConstantTokenSaleInfo: false,
            transactionHash: '',
            isPurchaseLoadingDialogOpen: false,
        };
    }
    public componentDidMount() {
        window.addEventListener('resize', this.throttledScreenWidthUpdate);
        window.scrollTo(0, 0);
        this.updateVariableTokenSaleInfoIntervalId = window.setInterval(() => {
            if (this.props.blockchainIsLoaded) {
                this.updateVariableTokenSaleInfoFireAndForgetAsync();
            }
        }, VARIABLE_TOKEN_SALE_INFO_INTERVAL);
    }
    public componentWillUnmount() {
        window.removeEventListener('resize', this.throttledScreenWidthUpdate);
        clearInterval(this.updateVariableTokenSaleInfoIntervalId);
        clearInterval(this.txConfirmationIntervalId);

        // Reset the redux state so that if the user navigate to OTC or some other page, it can initialize
        // itself properly.
        this.props.dispatcher.resetState();
    }
    public componentWillMount() {
        const isSalePage = true;
        this.blockchain = new Blockchain(this.props.dispatcher, isSalePage);
    }
    public componentWillReceiveProps(nextProps: ContributeProps) {
        if (nextProps.networkId !== this.state.prevNetworkId) {
            this.blockchain.networkIdUpdatedFireAndForgetAsync(nextProps.networkId);
            this.setState({
                prevNetworkId: nextProps.networkId,
            });
        }
        if (nextProps.userAddress !== this.state.prevUserAddress) {
            this.blockchain.userAddressUpdatedFireAndForgetAsync(nextProps.userAddress);
            this.setState({
                prevUserAddress: nextProps.userAddress,
            });
        }
        if (nextProps.nodeVersion !== this.state.prevNodeVersion) {
            this.blockchain.nodeVersionUpdatedFireAndForgetAsync(nextProps.nodeVersion);
            this.setState({
                prevNodeVersion: nextProps.nodeVersion,
            });
        }
        if (nextProps.providerType !== this.state.prevProviderType) {
            this.blockchain.providerTypeUpdatedFireAndForgetAsync(nextProps.providerType);
            this.setState({
                prevProviderType: nextProps.providerType,
            });
        }
        if (this.state.prevBlockchainIsLoaded !== nextProps.blockchainIsLoaded) {
            if (nextProps.blockchainIsLoaded) {
                this.updateConstantTokenSaleInfoFireAndForgetAsync();
            }
            this.setState({
                prevBlockchainIsLoaded: nextProps.blockchainIsLoaded,
            });
        }
        if (nextProps.blockchainIsLoaded) {
            this.updateVariableTokenSaleInfoFireAndForgetAsync();
        }
    }
    public render() {
        const contributeStyle: React.CSSProperties = {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: CUSTOM_GRAY,
        };
        const updateShouldBlockchainErrDialogBeOpen = this.props.dispatcher
                .updateShouldBlockchainErrDialogBeOpen.bind(this.props.dispatcher);
        return (
            <div style={contributeStyle}>
                <DocumentTitle title="0x Token Sale"/>
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                />
                {this.props.blockchainIsLoaded && this.state.didLoadConstantTokenSaleInfo ?
                  this.renderContributionForm() :
                  <div className="pt4">
                      <Loading />
                 </div>
                }
                <Footer />
                <BlockchainErrDialog
                    blockchain={this.blockchain}
                    blockchainErr={this.props.blockchainErr}
                    isOpen={this.props.shouldBlockchainErrDialogBeOpen}
                    userAddress={this.props.userAddress}
                    toggleDialogFn={updateShouldBlockchainErrDialogBeOpen}
                    isTokenLaunchPage={true}
                />
                <FlashMessage
                    dispatcher={this.props.dispatcher}
                    flashMessage={this.props.flashMessage}
                    showDurationMs={10000}
                    bodyStyle={{backgroundColor: constants.CUSTOM_BLUE}}
                />
                <LedgerConfigDialog
                    networkId={this.props.networkId}
                    blockchain={this.blockchain}
                    dispatcher={this.props.dispatcher}
                    toggleDialogFn={this.onToggleLedgerDialog.bind(this)}
                    isOpen={this.state.isLedgerDialogOpen}
                />
                <U2fNotSupportedDialog
                    isOpen={this.state.isU2FDialogOpen}
                    onToggleDialog={this.onToggleU2FDialog.bind(this)}
                />
                <PurchaseLoadingDialog
                    isOpen={this.state.isPurchaseLoadingDialogOpen}
                    transactionHash={this.state.transactionHash}
                    networkId={this.props.networkId}
                />
            </div>
        );
    }
    private renderContributionForm() {
        if (this.props.networkId === constants.TESTNET_NETWORK_ID) {
            return (
                <ContributionNotice>
                    <div className="center h2 sm-px2">
                        You are connected to Kovan, not Mainnet
                    </div>
                    <div className="center pt2 mt1" style={{color: 'gray', width: 443}}>
                        In order to buy ZRX tokens, you must connect to the Ethereum mainnet
                        (network id: 1). Switch to mainnet and refresh this page.
                    </div>
                </ContributionNotice>
            );
        }
        if (!this.state.isInitialized || this.state.startTimeInSec.gt(moment().unix())) {
            const startDateMessage = this.state.isInitialized
                ? `Start time: ${moment.unix(this.state.startTimeInSec.toNumber()).format('MMMM Do h:mm:ss a')}`
                : '';
            return (
                <ContributionNotice>
                    <div className="center h2 sm-px2">
                        The token sale has not started yet
                    </div>
                    <div className="center pt2 mt1" style={{color: 'gray'}}>
                        {startDateMessage}
                    </div>
                </ContributionNotice>
            );
        } else if (this.state.isFinished) {
            return (
                <ContributionNotice>
                    <div className="center h2 sm-px2">
                        The token sale had already ended
                    </div>
                </ContributionNotice>
            );
        }
        const now = moment().unix();
        const nextPeriodTimestamp = now + constants.CAP_PERIOD_IN_SEC;
        const capPeriodEndIfExists = this.getCapPeriodEndTimestampIfExists();
        const labelLeft = this.props.injectedProviderName !== constants.PUBLIC_PROVIDER_NAME ?
                        this.props.injectedProviderName :
                        'Metamask/Parity';
        const isLedgerProvider = this.props.providerType === ProviderType.LEDGER;
        let ZRXAmountToReceive = 0;
        if (!_.isUndefined(this.state.contributionAmountInBaseUnits)) {
            const zrxEquivalentAmount = this.state.contributionAmountInBaseUnits.mul(this.state.zrxToEthExchangeRate);
            ZRXAmountToReceive = this.formatCurrencyAmount(zrxEquivalentAmount);
        }
        const tokenSaleAddress = this.blockchain.getTokenSaleAddress();
        const etherscanTokenSaleContractUrl = utils.getEtherScanLinkIfExists(tokenSaleAddress,
                                                                           this.props.networkId,
                                                                           EtherscanLinkSuffixes.address);
        const userEtherBalanceInWei = ZeroEx.toBaseUnitAmount(this.props.userEtherBalance, 18);
        return (
            <div className="clearfix max-width-4 mx-auto" style={{paddingTop: 43, width: '100%'}}>
                <div className="mx-auto sm-px2 relative" style={{maxWidth: 530}}>
                    <div className="absolute" style={{right: 0, top: 28, width: 190}}>
                        <SaleStats
                            isLoading={!this.state.didLoadConstantTokenSaleInfo}
                            totalZrxSupply={this.state.totalZrxSupply}
                            zrxSold={this.state.zrxSold}
                        />
                    </div>
                    <div className="h2 pt3" style={{paddingLeft: 44, paddingTop: 51}}>Token sale</div>
                    <div className="clearfix pb1" style={{paddingTop: 28}}>
                        <div className="col col-1">
                            {this.renderStepNumber(1)}
                        </div>
                        <div className="col col-11">
                            <div className="h4">Select your wallet:</div>
                            <div className="pt2 pb3">
                                <LabeledSwitcher
                                    labelLeft={labelLeft}
                                    labelRight="Ledger Nano S"
                                    isLeftInitiallySelected={!isLedgerProvider}
                                    onLeftLabelClickAsync={this.onInjectedWeb3Click.bind(this)}
                                    onRightLabelClickAsync={this.onLedgerClickAsync.bind(this)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="clearfix" style={{marginLeft: 45}}>
                        <div className="mx-auto" style={{width: 417}}>
                            <div className="col col-5">
                                <Party
                                    label="Your address"
                                    address={this.props.userAddress}
                                    identiconDiameter={30}
                                    identiconStyle={{marginTop: 10, marginBottom: 10}}
                                    noAddressLabel={<span style={{color: '#ff3333'}}>No address found</span>}
                                />
                                <div
                                    className="pt1 mx-auto center"
                                    style={{fontSize: 12, maxWidth: 132}}
                                >
                                    {!_.isEmpty(this.props.userAddress) && this.state.didLoadConstantTokenSaleInfo &&
                                        <div className="pb1">
                                            {this.state.isAddressRegistered ?
                                                <div style={{color: 'rgb(0, 195, 62)'}}>
                                                    <span><i className="zmdi zmdi-check-circle" /></span>{' '}
                                                    <span>Address registered</span>
                                                </div> :
                                                <div
                                                    style={{color: colors.red500}}
                                                    data-tip={true}
                                                    data-for="notRegisteredTooltip"
                                                >
                                                    <span><i className="zmdi zmdi-alert-triangle" /></span>{' '}
                                                    <span>Unregistered address</span>
                                                    <ReactTooltip id="notRegisteredTooltip">
                                                        You can only purchase from an address that was<br />
                                                        registered during the mandatory registration period<br />
                                                        (Aug. 9th-12th).
                                                    </ReactTooltip>
                                                </div>
                                            }
                                        </div>
                                    }
                                    <div>
                                        <span style={{color: '#BBBBBB'}}>Balance:</span>{' '}
                                        <span style={{color: '#848484'}}>
                                            {this.formatCurrencyAmount(userEtherBalanceInWei)} ETH
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="col col-2">
                                <div className="mx-auto" style={{width: 65, marginTop: 36}}>
                                    <img src="/images/sale_arrows.png" style={{width: 65}} />
                                </div>
                            </div>
                            <div className="col col-5">
                                <Party
                                    label="0x sale address"
                                    address={tokenSaleAddress}
                                    identiconDiameter={30}
                                    identiconStyle={{marginTop: 10, marginBottom: 10}}
                                    noAddressLabel="No address found"
                                />
                                <div
                                    className="mx-auto center underline"
                                    style={{width: 108, cursor: 'pointer', paddingTop: 4}}
                                >
                                    <a
                                        style={{color: '#00C33E', fontSize: 12}}
                                        href={etherscanTokenSaleContractUrl}
                                        target="_blank"
                                    >
                                        Verify source code on Etherscan
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="clearfix pt3 pb2">
                        <div className="col col-1">
                            {this.renderStepNumber(2)}
                        </div>
                        <div className="col col-11">
                            <div className="h4">Choose an amount:</div>
                            <div className="clearfix">
                                <div className="col col-6" style={{maxWidth: 235}}>
                                    <EthAmountInput
                                        amount={this.state.contributionAmountInBaseUnits}
                                        balance={this.props.userEtherBalance}
                                        shouldCheckBalance={true}
                                        shouldShowIncompleteErrs={false}
                                        onChange={this.onContributionAmountChanged.bind(this)}
                                        shouldHideVisitBalancesLink={true}
                                    />
                                </div>
                                {ZRXAmountToReceive !== 0 &&
                                    <div
                                        className="col col-6 pl1"
                                        style={{color: CUSTOM_LIGHT_GRAY, paddingTop: 15}}
                                    >
                                        = {accounting.formatNumber(ZRXAmountToReceive)} ZRX
                                    </div>
                                }
                            </div>
                            <div style={{fontSize: 13}}>
                                <div>
                                    <div>
                                        <span style={{color: CUSTOM_LIGHT_GRAY}}>
                                            Current purchase limit:{' '}
                                        </span>
                                        <span style={{color: CUSTOM_GRAY}}>
                                            {this.renderEthCapPerAddress(now)} ETH/buyer
                                        </span>
                                    </div>
                                    <div className="pt1">
                                        <span style={{color: CUSTOM_LIGHT_GRAY}}>
                                            Limit increases to:{' '}
                                            <span style={{color: CUSTOM_GRAY}}>
                                                {this.renderEthCapPerAddress(nextPeriodTimestamp)} ETH
                                            </span>{' '}
                                            {this.renderTimeUntilCapIncrease(capPeriodEndIfExists)}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt1">
                                    <span style={{color: CUSTOM_LIGHT_GRAY}}>
                                        Bought from your address so far:{' '}
                                    </span>
                                    <span style={{color: CUSTOM_GRAY}}>
                                        {_.isUndefined(this.state.ethContributedAmount) ?
                                            <span style={{paddingRight: 3, paddingLeft: 3}}>
                                                <CircularProgress size={10} />
                                            </span> :
                                            this.formatCurrencyAmount(this.state.ethContributedAmount)
                                        } ETH
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="clearfix pt3">
                        <div className="col col-1">
                            {this.renderStepNumber(3)}
                        </div>
                        <div className="col col-11">
                            <div className="h4 pb2">Verify information and purchase ZRX</div>
                            <LifeCycleRaisedButton
                                labelReady="Purchase ZRX"
                                labelLoading="Purchasing ZRX..."
                                labelComplete="ZRX purchased!"
                                isPrimary={true}
                                isDisabled={_.isEmpty(this.props.userAddress) ||
                                            _.isUndefined(this.state.contributionAmountInBaseUnits)}
                                onClickAsyncFn={this.onPurchaseZRXClickAsync.bind(this)}
                            />
                            <div
                                className="pt2 pb1 center"
                                style={{color: 'gray', fontSize: 13}}
                            >
                                By clicking the button above, you are agreeing to the{' '}
                                <a
                                    target="_blank"
                                    href="/pdfs/zeroEx_terms_and_conditions.pdf"
                                >
                                    Terms of Token Sale
                                </a>.
                            </div>
                            <div
                                className="pt1 pb4 center"
                                style={{color: CUSTOM_LIGHT_GRAY, fontSize: 13}}
                            >
                                To avoid issues and phishing scams we highly recommend
                                you check your address, and verify the 0x address with
                                Etherscan before you continue
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    private renderTimeUntilCapIncrease(capPeriodEndIfExists: number) {
        if (_.isUndefined(capPeriodEndIfExists)) {
            return null;
        }
        const capIncreaseFromNow = moment.unix(capPeriodEndIfExists).fromNow();
        return capIncreaseFromNow;
    }
    private renderEthCapPerAddress(timestamp: number) {
        if (_.isUndefined(this.state.baseEthCapPerAddress)) {
            return (
                <span style={{paddingRight: 3, paddingLeft: 3}}>
                    <CircularProgress size={10} />
                </span>
            );
        }
        const currentEthCapPerAddressInWei = this.getEthCapPerAddressAtTimestamp(timestamp);
        const currentEthCapPerAddress = this.formatCurrencyAmount(currentEthCapPerAddressInWei);
        return currentEthCapPerAddress;
    }
    private renderStepNumber(n: number) {
        const numberedCircleStyles = {
            width: 22,
            height: 23,
            color: 'white',
            backgroundColor: 'rgb(216, 216, 216)',
            textAlign: 'center',
            lineHeight: '22px',
            paddingLeft: 1,
            fontSize: 13,
        };
        return (
            <div
                className="circle"
                style={numberedCircleStyles}
            >
                {n}
            </div>
        );
    }
    private renderTransactionSuccessfulMsg(transactionHash: string) {
        const etherscanLink = utils.getEtherScanLinkIfExists(transactionHash, this.props.networkId,
                                                             EtherscanLinkSuffixes.tx);
        return (
            <div>
                Your transaction was successfully mined!{' '}
                <a
                    href={etherscanLink}
                    target="_blank"
                    className="underline"
                    style={{color: 'white'}}
                >
                    View your transaction
                </a>
            </div>
        );
    }
    private async updateConstantTokenSaleInfoFireAndForgetAsync() {
        const [
            zrxToEthExchangeRate,
            baseEthCapPerAddress,
            startTimeInSec,
            totalZrxSupply,
            isInitialized,
            isFinished,
        ] = await Promise.all([
            this.blockchain.getTokenSaleExchangeRateAsync(),
            this.blockchain.getTokenSaleBaseEthCapPerAddressAsync(),
            this.blockchain.getTokenSaleStartTimeInSecAsync(),
            this.blockchain.getTokenSaleTotalSupplyAsync(),
            this.blockchain.getIsTokenSaleInitialized(),
            this.blockchain.getIsTokenSaleFinished(),
        ]);

        this.setState({
            zrxToEthExchangeRate,
            baseEthCapPerAddress,
            startTimeInSec,
            totalZrxSupply,
            isInitialized,
            isFinished,
            didLoadConstantTokenSaleInfo: true,
        });
    }
    private async updateVariableTokenSaleInfoFireAndForgetAsync() {
        const [
            orderHash,
            zrxToEthExchangeRate,
        ] = await Promise.all([
            this.blockchain.getTokenSaleOrderHashAsync(),
            this.blockchain.getTokenSaleExchangeRateAsync(),
        ]);

        const ethContributedInWei = await this.blockchain.getFillAmountAsync(orderHash);

        const zrxSold = ethContributedInWei.mul(zrxToEthExchangeRate);

        let ethContributedAmount = new BigNumber(0);
        let isAddressRegistered = false;
        if (!_.isEmpty(this.props.userAddress)) {
            ethContributedAmount = await this.blockchain.getTokenSaleContributionAmountAsync();
            isAddressRegistered = await this.blockchain.getTokenSaleIsUserAddressRegisteredAsync();
        }

        this.setState({
            zrxSold,
            ethContributedAmount,
            isAddressRegistered,
        });
    }
    private onContributionAmountChanged(isValid: boolean, contributionAmountInBaseUnits?: BigNumber.BigNumber) {
        this.setState({
            contributionAmountInBaseUnits,
        });
    }
    private onToggleLedgerDialog(isOpen: boolean) {
        this.setState({
            isLedgerDialogOpen: isOpen,
        });
    }
    private onToggleU2FDialog() {
        this.setState({
            isU2FDialogOpen: !this.state.isU2FDialogOpen,
        });
    }
    private async onInjectedWeb3Click(): Promise<boolean> {
        this.props.dispatcher.updateProviderType(ProviderType.INJECTED);
        return true;
    }
    private async onLedgerClickAsync(): Promise<boolean> {
        const isU2FSupported = await utils.isU2FSupportedAsync();
        if (!isU2FSupported) {
            this.setState({
                isU2FDialogOpen: true,
            });
            return false;
        }

        this.props.dispatcher.updateProviderType(ProviderType.LEDGER);
        this.setState({
            isLedgerDialogOpen: true,
        });
        return true;
    }
    private formatCurrencyAmount(amount: BigNumber.BigNumber): number {
        const unitAmount = ZeroEx.toUnitAmount(amount, ZRX_ETH_DECIMAL_PLACES);
        const roundedUnitAmount = Math.round(unitAmount.toNumber() * 100000) / 100000;
        return roundedUnitAmount;
    }
    private async onPurchaseZRXClickAsync(): Promise<boolean> {
        const contributionAmountInUnits = ZeroEx.toUnitAmount(this.state.contributionAmountInBaseUnits,
                                                              ZRX_ETH_DECIMAL_PLACES);
        if (this.props.userEtherBalance.lt(contributionAmountInUnits)) {
            this.props.dispatcher.showFlashMessage('Insufficient Ether balance to complete this transaction');
            return false;
        }
        const isAmountBelowCurrentCap = this.isAmountBelowCurrentCap();
        if (!isAmountBelowCurrentCap) {
            const desiredContributionAmount = this.formatCurrencyAmount(this.state.contributionAmountInBaseUnits);
            const errMsg = `Cannot purchase ${desiredContributionAmount} ETH without exceeding the current limit`;
            this.props.dispatcher.showFlashMessage(errMsg);
            return false;
        }

        try {
            const transactionHash = await this.blockchain.tokenSaleFillOrderWithEthAsync(
                this.state.contributionAmountInBaseUnits,
            );
            this.setState({
                isPurchaseLoadingDialogOpen: true,
                transactionHash,
            });
            this.startPollingForTxConfirmationFireAndForgetAsync(transactionHash);
            return true;
        } catch (err) {
            const errMsg = `${err}`;
            if (utils.didUserDenyWeb3Request(errMsg)) {
                this.props.dispatcher.showFlashMessage('You denied the transaction confirmation');
            } else if (_.includes(errMsg, TokenSaleErrs.ADDRESS_NOT_REGISTERED)) {
                this.props.dispatcher.showFlashMessage('You cannot purchase from an unregistered address');
            } else if (_.includes(errMsg, 'TOO_OLD_LEDGER_FIRMWARE')) {
                this.props.dispatcher.showFlashMessage('Your Ledger firmware is too old. Please update it.');
            } else {
                utils.consoleLog(`Sending transaction failed: ${err}`);
                this.props.dispatcher.showFlashMessage(
                    'Failed to complete transaction. Please try again.',
                );
            }
            this.setState({
                isPurchaseLoadingDialogOpen: false,
                transactionHash: '',
            });
            return false;
        }
    }
    private async startPollingForTxConfirmationFireAndForgetAsync(txHash: string) {
        this.txConfirmationIntervalId = window.setInterval(async () => {
            const txReceiptIfExists = await this.blockchain.getTransactionReceiptIfExistsAsync(txHash);
            if (!_.isUndefined(txReceiptIfExists)) {
                this.setState({
                    isPurchaseLoadingDialogOpen: false,
                    transactionHash: '',
                });
                const transactionSuccessMsg = this.renderTransactionSuccessfulMsg(txHash);
                this.props.dispatcher.showFlashMessage(transactionSuccessMsg);
                clearInterval(this.txConfirmationIntervalId);
            }
        }, TRANSACTION_MINED_CHECK_INTERVAL);
    }
    private isAmountBelowCurrentCap(): boolean {
        const nowTimestamp = moment().unix();
        const ethCapPerAddress = this.getEthCapPerAddressAtTimestamp(nowTimestamp);
        const desiredContributionAmount = this.state.contributionAmountInBaseUnits.add(this.state.ethContributedAmount);
        const isBelowCap = ethCapPerAddress.gte(desiredContributionAmount);
        return isBelowCap;
    }
    private getEthCapPerAddressAtTimestamp(timestamp: number): BigNumber.BigNumber {
        const period = this.getCapPeriod(timestamp);
        const multiplier = (2 ** period) - 1;
        const ethCapPerAddress = this.state.baseEthCapPerAddress.mul(multiplier);
        return ethCapPerAddress;
    }
    private getCapPeriod(timestamp: number): number {
        const timestampBigNumber = new BigNumber(timestamp);
        const secondsSinceStart = timestampBigNumber.minus(this.state.startTimeInSec);
        const period = secondsSinceStart.div(constants.CAP_PERIOD_IN_SEC).round(0, 1).add(1);
        return period.toNumber();
    }
    private getCapPeriodEndTimestampIfExists(): number {
        if (_.isUndefined(this.state.startTimeInSec)) {
            return undefined;
        }
        const now = moment().unix();
        const period = this.getCapPeriod(now);
        const capPeriodEndTimestamp = this.state.startTimeInSec.add(constants.CAP_PERIOD_IN_SEC * period);
        return capPeriodEndTimestamp.toNumber();
    }
    private updateScreenWidth() {
        const newScreenWidth = utils.getScreenWidth();
        this.props.dispatcher.updateScreenWidth(newScreenWidth);
    }
}
