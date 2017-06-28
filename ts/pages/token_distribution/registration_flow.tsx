import * as _ from 'lodash';
import * as React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import {utils} from 'ts/utils/utils';
import {constants} from 'ts/utils/constants';
import {Footer} from 'ts/components/footer';
import {TopBar} from 'ts/components/top_bar';
import {AddressForm} from 'ts/pages/token_distribution/address_form';
import {CivicSip} from 'ts/types';
import {Dispatcher} from 'ts/redux/dispatcher';
import {FlashMessage} from 'ts/components/ui/flash_message';

export interface RegistrationFlowProps {
    location: Location;
    dispatcher: Dispatcher;
    flashMessage?: string;
}

interface RegistrationFlowState {
    civicUserId: string;
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
        };
    }
    public componentDidMount() {
        this.civicSip.on('auth-code-received', (event: any) => {
            const jwtToken = event.response;
            this.sendAuthCodeAsync(jwtToken);
        });

        this.civicSip.on('civic-sip-error', (error: any) => {
            this.props.dispatcher.showFlashMessage(error.message);
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
                        <AddressForm
                            civicUserId={this.state.civicUserId}
                            dispatcher={this.props.dispatcher}
                        />
                    }
                </div>
                <FlashMessage
                    dispatcher={this.props.dispatcher}
                    flashMessage={this.props.flashMessage}
                />
                <Footer />
            </div>
        );
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
            this.props.dispatcher.showFlashMessage('Civic authorization failed');
        } else {
            const responseJSON = await response.json();
            this.setState({
                civicUserId: responseJSON.civicUserId,
            });
        }
    }
}
