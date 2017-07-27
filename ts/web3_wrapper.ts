import * as _ from 'lodash';
import Web3 = require('web3');
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {Dispatcher} from 'ts/redux/dispatcher';
import {utils} from 'ts/utils/utils';
import {constants} from 'ts/utils/constants';

export class Web3Wrapper {
    private dispatcher: Dispatcher;
    private web3: Web3;
    private prevNetworkId: number;
    private shouldPollUserAddress: boolean;
    private watchNetworkAndBalanceIntervalId: number;
    constructor(dispatcher: Dispatcher, provider: Web3.Provider, networkId: number,
                shouldPollUserAddress: boolean) {
        this.dispatcher = dispatcher;
        this.prevNetworkId = networkId;
        this.shouldPollUserAddress = shouldPollUserAddress;

        this.web3 = new Web3();
        this.web3.setProvider(provider);

        this.startEmittingNetworkConnectionAndUserBalanceStateAsync();
    }
    public isAddress(address: string) {
        return this.web3.isAddress(address);
    }
    public async getAccountsAsync(): Promise<string[]> {
        const addresses = await promisify(this.web3.eth.getAccounts)();
        return addresses;
    }
    public async getFirstAccountIfExistsAsync() {
        const addresses = await this.getAccountsAsync();
        if (_.isEmpty(addresses)) {
            return '';
        }
        return (addresses as string[])[0];
    }
    public async getNodeVersionAsync() {
        const nodeVersion = await promisify(this.web3.version.getNode)();
        return nodeVersion;
    }
    public getProviderObj() {
        return this.web3.currentProvider;
    }
    public async getNetworkIdIfExists() {
        try {
            const networkId = await this.getNetworkAsync();
            return Number(networkId);
        } catch (err) {
            return undefined;
        }
    }
    public async getBalanceInEthAsync(owner: string): Promise<BigNumber.BigNumber> {
        const balanceInWei: BigNumber.BigNumber = await promisify(this.web3.eth.getBalance)(owner);
        const balanceEth = this.web3.fromWei(balanceInWei, 'ether');
        return balanceEth;
    }
    public async doesContractExistAtAddressAsync(address: string): Promise<boolean> {
        const code = await promisify(this.web3.eth.getCode)(address);
        // Regex matches 0x0, 0x00, 0x in order to accomodate poorly implemented clients
        const zeroHexAddressRegex = /^0[xX][0]*$/;
        const didFindCode = _.isNull(code.match(zeroHexAddressRegex));
        return didFindCode;
    }
    // Note: since `sign` is overloaded to be both a sync and async method, it doesn't play nice
    // with our callAsync method. We therefore handle it here as a special case.
    public async signTransactionAsync(address: string, message: string): Promise<string> {
        const signData = await promisify(this.web3.eth.sign)(address, message);
        return signData;
    }
    public async getBlockTimestampAsync(blockHash: string): Promise<number> {
        const {timestamp} = await promisify(this.web3.eth.getBlock)(blockHash);
        return timestamp;
    }
    public async sendTransactionAsync(from: string, to: string,
                                     amountInBaseUnits: BigNumber.BigNumber,
                                     gas: number): Promise<string> {
        const transactionHex = await promisify(this.web3.eth.sendTransaction)({
            from,
            to,
            value: amountInBaseUnits,
            gas,
        });
        return transactionHex;
    }
    public destroy() {
        this.stopEmittingNetworkConnectionAndUserBalanceStateAsync();
    }
    private async getNetworkAsync() {
        const networkId = await promisify(this.web3.version.getNetwork)();
        return networkId;
    }
    private async startEmittingNetworkConnectionAndUserBalanceStateAsync() {
        if (!_.isUndefined(this.watchNetworkAndBalanceIntervalId)) {
            return; // we are already emitting the state
        }

        let prevNodeVersion: string;
        let prevUserEtherBalanceInWei = new BigNumber(0);
        let prevUserAddress: string;
        this.dispatcher.updateNetworkId(this.prevNetworkId);
        this.watchNetworkAndBalanceIntervalId = window.setInterval(async () => {
            // Check for network state changes
            const currentNetworkId = await this.getNetworkIdIfExists();
            if (currentNetworkId !== this.prevNetworkId) {
                this.prevNetworkId = currentNetworkId;
                this.dispatcher.updateNetworkId(currentNetworkId);
            }

            // Check for node version changes
            const currentNodeVersion = await this.getNodeVersionAsync();
            if (currentNodeVersion !== prevNodeVersion) {
                prevNodeVersion = currentNodeVersion;
                this.dispatcher.updateNodeVersion(currentNodeVersion);
            }

            if (this.shouldPollUserAddress) {
                const userAddressIfExists = await this.getFirstAccountIfExistsAsync();
                // Update makerAddress on network change
                if (prevUserAddress !== userAddressIfExists) {
                    prevUserAddress = userAddressIfExists;
                    this.dispatcher.updateUserAddress(userAddressIfExists);
                }

                // Check for user ether balance changes
                if (userAddressIfExists !== '') {
                    const balance = await this.getBalanceInEthAsync(userAddressIfExists);
                    if (!balance.eq(prevUserEtherBalanceInWei)) {
                        prevUserEtherBalanceInWei = balance;
                        this.dispatcher.updateUserEtherBalance(balance);
                    }
                }
            }
        }, 1000);
    }
    private stopEmittingNetworkConnectionAndUserBalanceStateAsync() {
        clearInterval(this.watchNetworkAndBalanceIntervalId);
    }
}
