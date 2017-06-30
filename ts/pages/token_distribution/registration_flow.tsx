import * as _ from 'lodash';
import * as React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import Paper from 'material-ui/Paper';
import CircularProgress from 'material-ui/CircularProgress';
import {Step, Stepper, StepLabel} from 'material-ui/Stepper';
import {utils} from 'ts/utils/utils';
import {constants} from 'ts/utils/constants';
import {Footer} from 'ts/components/footer';
import {TopBar} from 'ts/components/top_bar';
import {ContributionForm} from 'ts/pages/token_distribution/contribution_form';
import {RegisterButton} from 'ts/pages/token_distribution/register_button';
import {CivicSip} from 'ts/types';
import {Dispatcher} from 'ts/redux/dispatcher';
import {FlashMessage} from 'ts/components/ui/flash_message';

const CUSTOM_GRAY = 'rgb(74, 74, 74)';

export interface RegistrationFlowProps {
    location: Location;
    dispatcher: Dispatcher;
    flashMessage?: string;
}

interface RegistrationFlowState {
    civicUserId: string;
    stepIndex: number;
    isVerifyingIdentity: boolean;
}

export class RegistrationFlow extends React.Component<RegistrationFlowProps, RegistrationFlowState> {
    private civicSip: CivicSip;
    constructor(props: RegistrationFlowProps) {
        super(props);
        this.civicSip = new (global as any).civic.sip({
            appId: constants.CIVIC_APP_ID,
        });
        this.state = {
            stepIndex: 0,
            civicUserId: undefined,
            isVerifyingIdentity: false,
        };
    }
    public componentDidMount() {
        this.civicSip.on('auth-code-received', (event: any) => {
            const jwtToken = event.response;
            this.sendAuthCodeAsync(jwtToken);
        });

        this.civicSip.on('civic-sip-error', (error: any) => {
            this.props.dispatcher.showFlashMessage('Civic encountered an error. Please try again.');
            this.setState({
                isVerifyingIdentity: false,
            });
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
                    style={{height: 400, width: '100%'}}
                >
                    <div>
                        <Stepper activeStep={this.state.stepIndex}>
                            <Step>
                                <StepLabel>Verify your identity with Civic</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>Select contribution address & amount</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>Complete</StepLabel>
                            </Step>
                        </Stepper>
                    </div>
                    <div className="pt2">
                        {this.state.stepIndex === 0 &&
                            this.renderVerifyIdentityStep()
                        }
                        {this.state.stepIndex === 1 &&
                            <ContributionForm
                                civicUserId={this.state.civicUserId}
                                dispatcher={this.props.dispatcher}
                                onSubmittedContributionInfo={this.onSubmittedContributionInfo.bind(this)}
                            />
                        }
                        {this.state.stepIndex === 2 &&
                            this.renderThankYouStep()
                        }
                    </div>
                </div>
                <FlashMessage
                    dispatcher={this.props.dispatcher}
                    flashMessage={this.props.flashMessage}
                />
                <Footer />
            </div>
        );
    }
    private renderThankYouStep() {
        return (
            <div className="mx-auto" style={{width: 600}}>
                <div className="h2 my2">
                    Registration successful!
                </div>
                <div className="pt2">
                    Thank you for taking the time to register for the 0x token sale. The contribution
                    period will begin on the <span className="bold">15th of August</span>, be sure to
                    set yourself a reminder.
                </div>
            </div>
        );
    }
    private renderVerifyIdentityStep() {
        return (
            <div>
                {this.state.isVerifyingIdentity ?
                    <div className="mx-auto pt3" style={{width: 400}}>
                        <Paper zDepth={1} style={{padding: 40}}>
                            <CircularProgress />
                            <div className="pt3">
                                Verifying your Civic Identity...
                            </div>
                        </Paper>
                    </div> :
                    <div>
                        <div className="h2 my2">
                            Verify your identity with Civic
                        </div>
                        <div className="pt2 mx-auto" style={{width: 450, textAlign: 'left', color: CUSTOM_GRAY}}>
                            <div>
                                0x is using <a href="https://www.civic.com/">Civic's</a> identity verification
                                service to limit individual contributions to the token sale. Follow the steps
                                below to get verified:
                            </div>
                            <ul>
                                <li className="pb1">Install the{' '}
                                    <a
                                        href="https://www.civic.com/app"
                                        target="_blank"
                                        style={{textDecoration: 'underline'}}
                                    >
                                        Civic mobile app
                                    </a>
                                </li>
                                <li className="pb1">
                                    Verify your email and phone number through the app.
                                </li>
                                <li className="pb1">
                                    Click the button below, scan the QR code and authenticate with 0x.
                                </li>
                            </ul>
                        </div>
                        <div className="pt1">
                            <RegisterButton
                                onClick={this.onRegisterClick.bind(this)}
                            />
                        </div>
                    </div>
                }
            </div>
        );
    }
    private onSubmittedContributionInfo() {
        this.setState({
            stepIndex: 2,
        });
    }
    private onRegisterClick() {
        this.setState({
            isVerifyingIdentity: true,
        });
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
            const errMsg = await response.text();
            if (_.includes(errMsg, 'CIVIC_EMAIL_NOT_VERIFIED')) {
                this.props.dispatcher.showFlashMessage('You must verify your email on Civic to continue.');
            } else if (_.includes(errMsg, 'CIVIC_PHONE_NOT_VERIFIED')) {
                this.props.dispatcher.showFlashMessage('You must verify your phone number on Civic to continue.');
            } else {
                this.props.dispatcher.showFlashMessage('Civic authorization failed');
            }
            this.setState({
                isVerifyingIdentity: false,
            });
        } else {
            const responseJSON = await response.json();
            this.setState({
                stepIndex: 1,
                civicUserId: responseJSON.civicUserId,
                isVerifyingIdentity: false,
            });
        }
    }
}
