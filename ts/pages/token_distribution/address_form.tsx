import * as React from 'react';
import {constants} from 'ts/utils/constants';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';

export interface AddressFormProps {
    civicUserId: string;
}

interface AddressFormState {
    addressInputErrMsg: string;
    contributionAddress: string;
    didRegistrationSucceed: boolean;
}

export class AddressForm extends React.Component<AddressFormProps, AddressFormState> {
    constructor(props: AddressFormProps) {
        super(props);
        this.state = {
            addressInputErrMsg: '',
            contributionAddress: '',
            didRegistrationSucceed: false,
        };
    }
    public render() {
        return (
            <div className="mx-auto" style={{width: 300}}>
                {this.state.didRegistrationSucceed ?
                    'Thank you for registering!' :
                    <div>
                        <TextField
                            floatingLabelFixed={true}
                            floatingLabelText="Contribution Ethereum address"
                            errorText={this.state.addressInputErrMsg}
                            value={this.state.contributionAddress}
                            onChange={this.onContributionAddressChanged.bind(this)}
                        />
                        <div
                            className="g-recaptcha pt3"
                            data-sitekey="6LcXHicUAAAAAOmRl4ZpDf2MxLEiHolYp1vpdOII"
                        />
                        <div className="pt3">
                            <RaisedButton
                                label="Submit"
                                primary={true}
                                onClick={this.onContributionAddressSubmitClickAsync.bind(this)}
                            />
                        </div>
                    </div>
                }
            </div>
        );
    }
    private async onContributionAddressSubmitClickAsync() {
        const body = JSON.stringify({
            contributionAddress: this.state.contributionAddress,
            civicUserId: this.props.civicUserId,
        });
        const response = await fetch(`${constants.BACKEND_BASE_URL}/register_address`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body,
        });
        if (response.status !== 200) {
            // TODO: Show the user an error message
            throw new Error('UNABLE_TO_REGISTER_ETHEREUM_ADDRESS');
        }
        this.setState({
            didRegistrationSucceed: true,
        });
    }
    private onContributionAddressChanged(e: any) {
        const address = e.target.value.toLowerCase();
        // TODO: Validate Ethereum address!!!
        this.setState({
            contributionAddress: address,
        });
    }
}
