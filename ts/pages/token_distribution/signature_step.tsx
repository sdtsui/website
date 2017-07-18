import * as _ from 'lodash';
import * as React from 'react';
import ethUtil = require('ethereumjs-util');
import RaisedButton from 'material-ui/RaisedButton';
import ReactTooltip = require('react-tooltip');
import {Blockchain} from 'ts/blockchain';
import {Dispatcher} from 'ts/redux/dispatcher';
import {errorReporter} from 'ts/utils/error_reporter';
import {utils} from 'ts/utils/utils';
import {constants} from 'ts/utils/constants';
import {InputLabel} from 'ts/components/ui/input_label';
import {RequiredLabel} from 'ts/components/ui/required_label';
import {LabeledSwitcher, Labels} from 'ts/components/ui/labeled_switcher';
import {Styles, ProviderType} from 'ts/types';
import {Identicon} from 'ts/components/ui/identicon';
import {LifeCycleRaisedButton} from 'ts/components/ui/lifecycle_raised_button';
import {LedgerConfigDialog} from 'ts/components/ledger_config_dialog';
import {U2fNotSupportedDialog} from 'ts/components/u2f_not_supported_dialog';
import {Loading} from 'ts/components/ui/loading';

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
        };
    }
    public render() {
        const isLedgerProvider = this.props.providerType === ProviderType.LEDGER;
        const labelLeft = this.props.injectedProviderName !== constants.PUBLIC_PROVIDER_NAME ?
                          this.props.injectedProviderName :
                          'Injected Web3';
        return (
            <div className="mx-auto left-align sm-px2" style={{maxWidth: 414}}>
                {!this.props.blockchainIsLoaded ?
                    <div className="pt2">
                        <Loading />
                    </div> :
                    <div>
                        <div className="lg-h2 md-h2 sm-h3 my2 pt3 center">
                            Proof of Ownership
                        </div>
                        <div className="pb2">
                            In order to register a contribution address, you must prove that you own it. You
                            prove ownership by signing a message with the address's corresponding private key.
                            This proof also ensures that you do not try to register an exchange-hosted address.
                            You can either use an address connected via an injected Web3 instance (Metamask,
                            Parity Signer, Mist) or use a Ledger hardware wallet.
                        </div>
                        <div className="pt2">
                            <LabeledSwitcher
                                labelLeft={labelLeft}
                                labelRight="Ledger Nano S"
                                initialSelectedLabel={isLedgerProvider ? Labels.RIGHT : Labels.LEFT}
                                onLeftLabelClick={this.onInjectedWeb3Click.bind(this)}
                                onRightLabelClick={this.onLedgerClickAsync.bind(this)}
                            />
                        </div>
                        <div className="pt3" style={{maxWidth: 400}}>
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
            </div>
        );
    }
    private renderUserAddress() {
        const userAddress = this.props.userAddress;
        const identiconDiameter = 25;
        return (
            <div>
                <div className="pb1" style={{fontSize: 12}}>
                    <RequiredLabel label={<InputLabel text="Accessible contribution address" />} />
                </div>
                <div className="flex">
                    <div className="pr2">
                        <Identicon address={userAddress} diameter={identiconDiameter} />
                    </div>
                    <div
                        style={styles.address}
                        data-tip={true}
                        data-for="userAddressTooltip"
                    >
                        {!_.isEmpty(userAddress) ? userAddress : 'None found'}
                    </div>
                    <ReactTooltip id="userAddressTooltip">{userAddress}</ReactTooltip>
                </div>
                <div>
                    {_.isEmpty(userAddress) &&
                        <div className="pt2" style={{fontSize: 12}}>
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
            // ethUtil.sha3 is a misnomer. It's actually Keccak256.
            const civicUserIdHashBuff = ethUtil.sha3(this.props.civicUserId);
            const civicUserIdHashHex = ethUtil.bufferToHex(civicUserIdHashBuff);
            signatureData = await this.props.blockchain.sendSignRequestAsync(civicUserIdHashHex);
        } catch (err) {
            const errMsg = `${err}`;
            if (_.includes(errMsg, 'User denied message')) {
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
        const response = await fetch(`${constants.BACKEND_BASE_URL}/signature_proof`, {
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
    private async onInjectedWeb3Click() {
        this.props.dispatcher.updateProviderType(ProviderType.INJECTED);
    }
    private async onLedgerClickAsync() {
        const isU2FSupported = await utils.isU2FSupportedAsync();
        if (!isU2FSupported) {
            this.setState({
                isU2FDialogOpen: true,
            });
            return;
        }

        this.props.dispatcher.updateProviderType(ProviderType.LEDGER);
        this.setState({
            isLedgerDialogOpen: true,
        });
    }
}
