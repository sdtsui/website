import * as _ from 'lodash';
import Web3 = require('web3');
import ethUtil = require('ethereumjs-util');
import * as ledger from 'ledgerco';
import * as HookedWalletSubprovider from 'web3-provider-engine/subproviders/hooked-wallet';
import {constants} from 'ts/utils/constants';

const NUM_ADDRESSES_TO_FETCH = 10;
const ASK_FOR_ON_DEVICE_CONFIRMATION = false;
const SHOULD_GET_CHAIN_CODE = false;

export class LedgerWallet {
    public isU2FSupported: boolean;
    public getAccounts: (callback: (err: Error, accounts: string[]) => void) => void;
    public signMessage: (msgParams: any, callback: (err: Error, result?: any) => void) => void;
    private path: string;
    private pathIndex: number;
    private ledgerEthConnection: any;
    private accounts: string[];
    constructor() {
        this.path = constants.DEFAULT_DERIVATION_PATH;
        this.pathIndex = 0;
        this.isU2FSupported = false;
        this.ledgerEthConnection = undefined;
        this.getAccounts = this.getAccountsAsync.bind(this);
        this.signMessage = this.signPersonalMessageAsync.bind(this);
    }
    public getPath(): string {
        return this.path;
    }
    public setPath(derivationPath: string) {
        this.path = derivationPath;
        this.getAccounts = this.getAccountsAsync.bind(this);
        this.signMessage = this.signPersonalMessageAsync.bind(this);
    }
    public setPathIndex(pathIndex: number) {
        this.pathIndex = pathIndex;
        this.signMessage = this.signPersonalMessageAsync.bind(this);
    }
    public async getAccountsAsync(callback: (err: Error, accounts: string[]) => void) {
        if (!_.isUndefined(this.ledgerEthConnection)) {
            callback(null, []);
            return;
        }
        await this.initLedgerConnectionAsync();

        const accounts = [];
        for (let i = 0; i < NUM_ADDRESSES_TO_FETCH; i++) {
            try {
                const derivationPath = `${this.path}/${i}`;
                const result = await (this.ledgerEthConnection as any).getAddress_async(
                    derivationPath, ASK_FOR_ON_DEVICE_CONFIRMATION, SHOULD_GET_CHAIN_CODE,
                );
                accounts.push(result.address.toLowerCase());
            } catch (err) {
                await this.closeLedgerConnectionAsync();
                callback(err, null);
                return;
            }
        }

        await this.closeLedgerConnectionAsync();
        callback(null, accounts);
    }
    public async signPersonalMessageAsync(msgParams: any, callback: (err: Error, result?: any) => void) {
        if (!_.isUndefined(this.ledgerEthConnection)) {
            callback(new Error('Another request is in progress.'));
            return;
        }
        await this.initLedgerConnectionAsync();

        try {
            const derivationPath = `${this.path}/${this.pathIndex}`;
            const result = await (this.ledgerEthConnection as any).signPersonalMessage_async(
                derivationPath, ethUtil.stripHexPrefix(msgParams.data),
            );
            const v = _.parseInt(result.v) - 27;
            let vHex = v.toString(16);
            if (vHex.length < 2) {
                vHex = `0${v}`;
            }
            const signature = `0x${result.r}${result.s}${vHex}`;
            await this.closeLedgerConnectionAsync();
            callback(null, signature);
        } catch (err) {
            await this.closeLedgerConnectionAsync();
            callback(err, null);
        }
    }
    private async initLedgerConnectionAsync() {
        if (!_.isUndefined(this.ledgerEthConnection)) {
            throw new Error('Multiple open connections to the Ledger disallowed.');
        }
        const ledgerConnection = await ledger.comm_u2f.create_async();
        this.ledgerEthConnection = new ledger.eth(ledgerConnection);
    }
    private async closeLedgerConnectionAsync() {
        if (_.isUndefined(this.ledgerEthConnection)) {
            return;
        }
        await this.ledgerEthConnection.comm.close_async();
        this.ledgerEthConnection = undefined;
    }
}

export const ledgerWalletSubproviderFactory = () => {
    const ledgerWallet = new LedgerWallet();
    const ledgerWalletSubprovider = new HookedWalletSubprovider(ledgerWallet);
    ledgerWalletSubprovider.getPath = ledgerWallet.getPath.bind(ledgerWallet);
    ledgerWalletSubprovider.setPath = ledgerWallet.setPath.bind(ledgerWallet);
    ledgerWalletSubprovider.setPathIndex = ledgerWallet.setPathIndex.bind(ledgerWallet);
    return ledgerWalletSubprovider;
};
