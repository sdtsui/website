import * as _ from 'lodash';
import * as React from 'react';
import ethUtil = require('ethereumjs-util');
import ReactTooltip = require('react-tooltip');
import {Blockchain} from 'ts/blockchain';
import {Dispatcher} from 'ts/redux/dispatcher';
import {errorReporter} from 'ts/utils/error_reporter';
import {utils} from 'ts/utils/utils';
import {constants} from 'ts/utils/constants';
import {InputLabel} from 'ts/components/ui/input_label';
import {RequiredLabel} from 'ts/components/ui/required_label';
import {Styles} from 'ts/types';
import {Identicon} from 'ts/components/ui/identicon';
import {LifeCycleRaisedButton} from 'ts/components/ui/lifecycle_raised_button';
import {ProviderDropDown} from 'ts/components/provider_drop_down';

export interface SignatureStepProps {
    blockchain: Blockchain;
    civicUserId: string;
    dispatcher: Dispatcher;
    userAddress: string;
    onSubmittedOwnershipProof: () => void;
}

interface SignatureStepState {
    didSignatureProofSucceed: boolean;
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
        };
    }
    public render() {
        return (
            <div className="mx-auto left-align sm-px2" style={{maxWidth: 414}}>
                <div className="lg-h2 md-h2 sm-h3 my2 pt3 center">
                    Proof of Ownership
                </div>
                <div className="pb2">
                    In order to register a contribution address, you must first prove that
                    you own it. You can do this by signing a message with the corresponding
                    private key. Additionally, this ensures that you do not try and register
                    an exchange-hosted address. Select the address you would like to contribute
                    with via Metamask, Parity Signer or Mist and once it shows up below, click
                    the button to sign the proof.
                </div>
                <div>
                    <ProviderDropDown
                        currentProviderName="Metamask"
                    />
                </div>
                <div className="pt2" style={{maxWidth: 400}}>
                    {this.renderUserAddress()}
                </div>
                <div className="pt3 mt1 pb4 center">
                    <LifeCycleRaisedButton
                        labelReady="Sign Proof of Ownership"
                        labelLoading="Signing proof..."
                        labelComplete="Proof signed!"
                        onClickAsyncFn={this.onSignProofAsync.bind(this)}
                        isDisabled={_.isEmpty(this.props.userAddress)}
                    />
                </div>
            </div>
        );
    }
    private renderUserAddress() {
        const userAddress = this.props.userAddress;
        const identiconDiameter = 25;
        return (
            <div className="pb2">
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
                        {!_.isEmpty(userAddress) ? userAddress : ''}
                    </div>
                    <ReactTooltip id="userAddressTooltip">{userAddress}</ReactTooltip>
                </div>
            </div>
        );
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
}
