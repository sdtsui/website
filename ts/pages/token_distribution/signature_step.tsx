import * as _ from 'lodash';
import * as React from 'react';
import ethUtil = require('ethereumjs-util');
import RaisedButton from 'material-ui/RaisedButton';
import ReactTooltip = require('react-tooltip');
import {Blockchain} from 'ts/blockchain';
import {Dispatcher} from 'ts/redux/dispatcher';
import {errorReporter} from 'ts/utils/error_reporter';
import {utils} from 'ts/utils/utils';
import {configs} from 'ts/utils/configs';
import {constants} from 'ts/utils/constants';
import {InputLabel} from 'ts/components/ui/input_label';
import {RequiredLabel} from 'ts/components/ui/required_label';
import {LabeledSwitcher} from 'ts/components/ui/labeled_switcher';
import {Styles, ProviderType} from 'ts/types';
import {Identicon} from 'ts/components/ui/identicon';
import {LifeCycleRaisedButton} from 'ts/components/ui/lifecycle_raised_button';
import {LedgerConfigDialog} from 'ts/components/ledger_config_dialog';
import {U2fNotSupportedDialog} from 'ts/components/u2f_not_supported_dialog';
import {Loading} from 'ts/components/ui/loading';
import {MsgSigningExplanationDialog} from 'ts/pages/token_distribution/msg_signing_explanation_dialog';

const CUSTOM_GRAY = '#635F5E';

export interface SignatureStepProps {
    blockchain: Blockchain;
    blockchainIsLoaded: boolean;
    civicUserId: string;
    dispatcher: Dispatcher;
    injectedProviderName: string;
    userAddress: string;
    onSubmittedOwnershipProof: () => void;
    providerType: ProviderType;
}

interface SignatureStepState {
    didSignatureProofSucceed: boolean;
    isLedgerDialogOpen: boolean;
    isU2FDialogOpen: boolean;
    isMsgSigningExplanationDialogOpen: boolean;
}

const styles: Styles = {
    address: {
        marginRight: 12,
        overflow: 'hidden',
        paddingTop: 4,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

export class SignatureStep extends React.Component<SignatureStepProps, SignatureStepState> {
    private recaptchaInstance: any;
    constructor(props: SignatureStepProps) {
        super(props);
        this.state = {
            didSignatureProofSucceed: false,
            isLedgerDialogOpen: false,
            isU2FDialogOpen: false,
            isMsgSigningExplanationDialogOpen: false,
        };
    }
    public render() {
        const isLedgerProvider = this.props.providerType === ProviderType.LEDGER;
        const labelLeft = this.props.injectedProviderName !== constants.PUBLIC_PROVIDER_NAME ?
                          this.props.injectedProviderName :
                          'Injected Web3';
        return (
            <div className="mx-auto left-align sm-px2" style={{maxWidth: 489}}>
                {!this.props.blockchainIsLoaded ?
                    <div className="pt2">
                        <Loading />
                    </div> :
                    <div style={{color: CUSTOM_GRAY}}>
                        <div className="my2 pt3 left-align" style={{fontSize: 28}}>
                            Proof of Ownership
                        </div>
                        <div className="pt2" style={{lineHeight: 1.5}}>
                            In order to register a contribution address, you must prove ownership by
                            signing a message with the corresponding private key. Any ZRX you eventually
                            purchase will be sent to this address.
                        </div>

                        <div className="pt2 pb2">
                            Notice: You cannot use an exchange address (i.e Coinbase, Kraken)
                        </div>
                        <div className="pt2 pb3">
                            <LabeledSwitcher
                                labelLeft={labelLeft}
                                labelRight="Ledger Nano S"
                                isLeftInitiallySelected={!isLedgerProvider}
                                onLeftLabelClickAsync={this.onInjectedWeb3Click.bind(this)}
                                onRightLabelClickAsync={this.onLedgerClickAsync.bind(this)}
                            />
                            <div
                                className="clearfix"
                                style={{fontSize: 14, color: '#635F5E', paddingTop: 11}}
                            >
                                <div className="col col-6 center">
                                    <div>
                                        address connected via Web3
                                    </div>
                                    <div>
                                        (i.e{' '}
                                        <a
                                            className="underline"
                                            style={{color: '#635F5E'}}
                                            href={constants.METAMASK_CHROME_STORE_URL}
                                            target="_blank"
                                        >
                                            Metamask
                                        </a>{' '}or{' '}
                                        <a
                                            className="underline"
                                            style={{color: '#635F5E'}}
                                            href={constants.PARITY_CHROME_STORE_URL}
                                            target="_blank"
                                        >
                                            Parity Signer
                                        </a>)
                                    </div>
                                </div>
                                <div className="col col-6 center">
                                    Ledger hardware wallet
                                </div>
                            </div>
                            <div className="pt4">
                                {this.renderUserAddress()}
                            </div>
                            <div className="pt3 pb4 center">
                                <LifeCycleRaisedButton
                                    isPrimary={true}
                                    labelReady="Sign Proof of Ownership"
                                    labelLoading="Signing proof..."
                                    labelComplete="Proof signed!"
                                    onClickAsyncFn={this.onSignProofAsync.bind(this)}
                                    isDisabled={_.isEmpty(this.props.userAddress)}
                                />
                                <div
                                    className="pt2"
                                    style={{color: '#565656', fontSize: 13}}
                                >
                                    You can follow{' '}
                                    <span
                                        className="underline"
                                        style={{cursor: 'pointer', color: '#04b504'}}
                                        onClick={this.toggleMsgSigningDialog.bind(this, true)}
                                    >
                                        these steps
                                    </span> to verify the message you are about to sign.
                                </div>
                            </div>
                        </div>
                    </div>
                }
                <LedgerConfigDialog
                    blockchain={this.props.blockchain}
                    dispatcher={this.props.dispatcher}
                    toggleDialogFn={this.onToggleLedgerDialog.bind(this)}
                    isOpen={this.state.isLedgerDialogOpen}
                />
                <U2fNotSupportedDialog
                    isOpen={this.state.isU2FDialogOpen}
                    onToggleDialog={this.onToggleU2FDialog.bind(this)}
                />
                <MsgSigningExplanationDialog
                    getPersonalMessageHashHex={this.props.blockchain.getPersonalMessageHashHex}
                    isOpen={this.state.isMsgSigningExplanationDialogOpen}
                    handleClose={this.toggleMsgSigningDialog.bind(this, false)}
                    message={`0x${this.props.civicUserId}`}
                />
            </div>
        );
    }
    private toggleMsgSigningDialog(isOpen: boolean): void {
        this.setState({
            isMsgSigningExplanationDialogOpen: isOpen,
        });
    }
    private renderUserAddress() {
        const userAddress = this.props.userAddress;
        const identiconDiameter = 25;
        const inputLabel = <InputLabel text="Accessible contribution address" />;
        return (
            <div>
                <div className="pb1" style={{fontSize: 12}}>
                    {_.isEmpty(userAddress) ?
                        <RequiredLabel label={inputLabel} /> :
                        inputLabel
                    }
                </div>
                {_.isEmpty(this.props.userAddress) ?
                    <div className="py2" style={{fontSize: 12}}>
                        <span style={{color: '#ff4f4d', fontStyle: 'italic'}}>
                            No injected Web3 found.
                        </span>
                        <span className="pl1">
                            Install{' '}<a
                                className="underline"
                                style={{color: '#635F5E'}}
                                href={constants.METAMASK_CHROME_STORE_URL}
                                target="_blank"
                            >
                                Metamask
                            </a>{' '}or{' '}
                            <a
                                className="underline"
                                style={{color: '#635F5E'}}
                                href={constants.PARITY_CHROME_STORE_URL}
                                target="_blank"
                            >
                                Parity Signer
                            </a>{' '}to use this option.
                        </span>
                    </div> :
                    <div className="flex">
                        <div className="pr2">
                            <Identicon address={userAddress} diameter={identiconDiameter} />
                        </div>
                        <div
                            style={styles.address}
                            data-tip={true}
                            data-for="userAddressTooltip"
                        >
                            {userAddress}
                        </div>
                        <ReactTooltip id="userAddressTooltip">{userAddress}</ReactTooltip>
                    </div>
                }
                <div>
                    {_.isEmpty(userAddress) &&
                        <div className="pt1" style={{fontSize: 12}}>
                            {this.renderEmptyUserAddressMsg()}
                        </div>
                    }
                </div>
            </div>
        );
    }
    private renderEmptyUserAddressMsg() {
        if (this.props.providerType === ProviderType.INJECTED &&
            this.props.injectedProviderName === constants.METAMASK_PROVIDER_NAME) {
            return 'Hint: Make sure your Metamask extension is unlocked.';
        } else if (this.props.providerType === ProviderType.LEDGER) {
            return (
                <span>
                    We still haven't been able to connect to your Ledger.{' '}
                    <span
                        style={{textDecoration: 'underline', cursor: 'pointer'}}
                        onClick={this.onToggleLedgerDialog.bind(this, true)}
                    >
                        Try again
                    </span>
                </span>
            );
        } else if (this.props.injectedProviderName === constants.PUBLIC_PROVIDER_NAME) {
            return (
                <span>
                    No injected Web3 found. Install {' '}
                    <a
                        style={{textDecoration: 'underline'}}
                        href={constants.METAMASK_CHROME_STORE_URL}
                        target="_blank"
                    >
                        Metamask
                    </a>{' '}or{' '}
                    <a
                        style={{textDecoration: 'underline'}}
                        href={constants.PARITY_CHROME_STORE_URL}
                        target="_blank"
                    >
                        Parity Signer
                    </a>{' '}to use this option.
                </span>
            );
        }
        return 'Make sure you have at least one Ethereum account available.';
    }
    private onToggleLedgerDialog(isOpen: boolean) {
        this.setState({
            isLedgerDialogOpen: isOpen,
        });
    }
    private async onSignProofAsync() {
        let signatureData;
        try {
            signatureData = await this.props.blockchain.sendSignRequestAsync(`0x${this.props.civicUserId}`);
        } catch (err) {
            const errMsg = `${err}`;
            if (utils.didUserDenyWeb3Request(errMsg)) {
                this.props.dispatcher.showFlashMessage('You denied the sign request.');
            } else {
                this.props.dispatcher.showFlashMessage('An unexpected error occured. Please try refreshing the page.');
                utils.consoleLog(`Unexpected error occured: ${err}`);
                utils.consoleLog(err.stack);
                await errorReporter.reportAsync(err);
            }
            return;
        }

        const body = JSON.stringify({
            contributionAddress: this.props.userAddress,
            civicUserId: this.props.civicUserId,
            signatureData,
        });
        const response = await fetch(`${configs.BACKEND_BASE_URL}/signature_proof`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body,
        });
        if (response.status !== 200) {
            const errorMsg = await response.text();
            if (errorMsg === 'ADDRESS_ALREADY_REGISTERED') {
                this.props.dispatcher.showFlashMessage('You cannot update your contribution address.');
            } else {
                utils.consoleLog(`Message signing failed: ${errorMsg}`);
            }
        } else {
            this.props.onSubmittedOwnershipProof();
        }
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
}
