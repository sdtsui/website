import * as _ from 'lodash';
import * as React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import {utils} from 'ts/utils/utils';
import {constants} from 'ts/utils/constants';
import {Footer} from 'ts/components/footer';
import {TopBar} from 'ts/components/top_bar';
import {CivicSip} from 'ts/types';

export interface RegistrationFlowProps {
    location: Location;
}

interface RegistrationFlowState {
    civicUserId: string;
    addressInputErrMsg: string;
    contributionAddress: string;
    didRegistrationSucceed: boolean;
}

export class RegistrationFlow extends React.Component<RegistrationFlowProps, RegistrationFlowState> {
    private civicSip: CivicSip;
    constructor(props: RegistrationFlowProps) {
        super(props);
        this.civicSip = new (global as any).civic.sip({
            appId: constants.CIVIC_APP_ID,
        });
        this.state = {
            civicUserId: undefined,
            addressInputErrMsg: '',
            contributionAddress: '',
            didRegistrationSucceed: false,
        };
    }
    public componentDidMount() {
        this.civicSip.on('auth-code-received', (event: any) => {
            const jwtToken = event.response;
            this.sendAuthCodeAsync(jwtToken);
        });

        // TODO: Handle errors!
        this.civicSip.on('civic-sip-error', (error: any) => {
            console.log('   Error type = ' + error.type);
            console.log('   Error message = ' + error.message);
        });
    }
    public render() {
        const registrationStyle: React.CSSProperties = {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
        };
        return (
            <div id="tokenDistribution" style={registrationStyle}>
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                />
                <div
                    className="mx-auto max-width-4 center pt4"
                    style={{height: 400}}
                >
                    {_.isUndefined(this.state.civicUserId) ?
                        <RaisedButton
                            label="Authenticate with Civic"
                            primary={true}
                            onClick={this.onRegisterClick.bind(this)}
                        /> :
                        this.renderAddressForm()
                    }
                </div>
                <Footer />
            </div>
        );
    }
    private renderAddressForm() {
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
            civicUserId: this.state.civicUserId,
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
    private onRegisterClick() {
        this.civicSip.signup({
            style: 'popup',
            scopeRequest: this.civicSip.ScopeRequests.BASIC_SIGNUP,
        });
    }
    private async sendAuthCodeAsync(jwtToken: string) {
        const body = JSON.stringify({
            jwtToken,
        });
        const response = await fetch(`${constants.BACKEND_BASE_URL}/civic_auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body,
        });
        if (response.status !== 200) {
            // TODO: Show the user an error message
            throw new Error('UNABLE_TO_VERIFY_JWT_TOKEN');
        }
        const responseJSON = await response.json();
        this.setState({
            civicUserId: responseJSON.civicUserId,
        });
    }
}
