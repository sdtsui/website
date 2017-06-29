import * as _ from 'lodash';
import * as React from 'react';
import {isAddress} from 'ethereum-address';
import * as Recaptcha from 'react-recaptcha';
import {constants} from 'ts/utils/constants';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import {Dispatcher} from 'ts/redux/dispatcher';

export interface AddressFormProps {
    civicUserId: string;
    dispatcher: Dispatcher;
}

interface AddressFormState {
    addressInputErrMsg: string;
    contributionAddress: string;
    didRegistrationSucceed: boolean;
    recaptchaToken?: string;
}

export class AddressForm extends React.Component<AddressFormProps, AddressFormState> {
    constructor(props: AddressFormProps) {
        super(props);
        this.state = {
            addressInputErrMsg: '',
            contributionAddress: '',
            didRegistrationSucceed: false,
            recaptchaToken: undefined,
        };
    }
    public render() {
        return (
            <div className="mx-auto" style={{width: 400}}>
                {this.state.didRegistrationSucceed ?
                    'Thank you for registering!' :
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <TextField
                            style={{width: 400}}
                            floatingLabelFixed={true}
                            floatingLabelText="Contribution Ethereum address"
                            errorText={this.state.addressInputErrMsg}
                            value={this.state.contributionAddress}
                            onChange={this.onContributionAddressChanged.bind(this)}
                        />
                        <Recaptcha
                            sitekey="6LcXHicUAAAAAOmRl4ZpDf2MxLEiHolYp1vpdOII"
                            render="explicit"
                            onloadCallback={_.noop}
                            verifyCallback={this.verifyCaptchaCallback.bind(this)}
                        />
                        <div className="pt3">
                            <RaisedButton
                                label="Submit"
                                primary={true}
                                disabled={
                                    _.isUndefined(this.state.recaptchaToken) ||
                                    !_.isEmpty(this.state.addressInputErrMsg)
                                }
                                onClick={this.onContributionAddressSubmitClickAsync.bind(this)}
                            />
                        </div>
                    </div>
                }
            </div>
        );
    }
    private verifyCaptchaCallback(recaptchaToken: string) {
        this.setState({
            recaptchaToken,
        });
    }
    private async onContributionAddressSubmitClickAsync() {
        const body = JSON.stringify({
            contributionAddress: this.state.contributionAddress,
            civicUserId: this.props.civicUserId,
            recaptchaToken: this.state.recaptchaToken,
        });
        const response = await fetch(`${constants.BACKEND_BASE_URL}/register_address`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body,
        });
        if (response.status !== 200) {
            const errorMsg = await response.text();
            if (errorMsg === 'ADDRESS_ALREADY_REGISTERED') {
                this.props.dispatcher.showFlashMessage('You can\'t change an address');
            } else {
                this.props.dispatcher.showFlashMessage('Address registration failed');
            }
        } else {
            this.setState({
                didRegistrationSucceed: true,
            });
        }
    }
    private onContributionAddressChanged(e: any) {
        const address = e.target.value.toLowerCase();
        this.setState({
            contributionAddress: address,
            addressInputErrMsg: isAddress(address) ? '' : 'Invalid address',
        });
    }
}
