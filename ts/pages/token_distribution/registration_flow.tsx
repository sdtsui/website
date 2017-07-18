import * as _ from 'lodash';
import * as React from 'react';
import {colors} from 'material-ui/styles';
import Paper from 'material-ui/Paper';
import CircularProgress from 'material-ui/CircularProgress';
import {Step, Stepper, StepLabel} from 'material-ui/Stepper';
import {constants} from 'ts/utils/constants';
import {Footer} from 'ts/components/footer';
import {TopBar} from 'ts/components/top_bar';
import {ContributionForm} from 'ts/pages/token_distribution/contribution_form';
import {RegisterButton} from 'ts/pages/token_distribution/register_button';
import {CivicSip} from 'ts/types';
import {Dispatcher} from 'ts/redux/dispatcher';
import {FlashMessage} from 'ts/components/ui/flash_message';
import {NewsletterInput} from 'ts/pages/home/newsletter_input';

const CUSTOM_GRAY = 'rgb(74, 74, 74)';
enum RegistrationFlowSteps {
    VERIFY_IDENTITY,
    CONTRIBUTION_DETAILS,
    REGISTRATION_COMPLETE,
}

export interface RegistrationFlowProps {
    location: Location;
    dispatcher: Dispatcher;
    flashMessage?: string;
}

interface RegistrationFlowState {
    civicUserId: string;
    stepIndex: RegistrationFlowSteps;
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
            stepIndex: RegistrationFlowSteps.VERIFY_IDENTITY,
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
                    style={{width: '100%'}}
                >
                    <div className="sm-hide xs-hide">
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
                    <Paper zDepth={1} className="mb3 lg-mx0 md-mx0 sm-mx2">
                        {this.state.stepIndex === RegistrationFlowSteps.VERIFY_IDENTITY &&
                            this.renderVerifyIdentityStep()
                        }
                        {this.state.stepIndex === RegistrationFlowSteps.CONTRIBUTION_DETAILS &&
                            <ContributionForm
                                civicUserId={this.state.civicUserId}
                                dispatcher={this.props.dispatcher}
                                onSubmittedContributionInfo={this.onSubmittedContributionInfo.bind(this)}
                            />
                        }
                        {this.state.stepIndex === RegistrationFlowSteps.REGISTRATION_COMPLETE &&
                            this.renderThankYouStep()
                        }
                    </Paper>
                </div>
                <FlashMessage
                    dispatcher={this.props.dispatcher}
                    flashMessage={this.props.flashMessage}
                    showDurationMs={10000}
                    bodyStyle={{backgroundColor: colors.cyanA700}}
                />
                <Footer />
            </div>
        );
    }
    private renderThankYouStep() {
        return (
            <div className="mx-auto" style={{maxWidth: 440}}>
                <div className="h2 my2 pt3">
                    Registration successful!
                </div>
                <div className="sm-px2 pb3" style={{color: CUSTOM_GRAY}}>
                    <div className="pt2">
                        Thank you for taking the time to register for the 0x token sale. The contribution
                        period will begin on the <span className="bold">15th of August</span>.
                    </div>
                    <div className="pt4 mx-auto" style={{maxWidth: 440}}>
                        <div className="left-align pb2">
                            Get a reminder email when the contribution period opens
                        </div>
                        <NewsletterInput
                            buttonBackgroundColor="#575757"
                            buttonLabelColor="white"
                        />
                    </div>
                </div>
            </div>
        );
    }
    private renderVerifyIdentityStep() {
        return (
            <div>
                {this.state.isVerifyingIdentity ?
                    <div className="mx-auto pt3" style={{maxWidth: 400}}>
                        <CircularProgress />
                        <div className="pt3 pb3">
                            Verifying your Civic Identity...
                        </div>
                    </div> :
                    <div>
                        <div className="h2 my2 pt3">
                            Verify your identity with Civic
                        </div>
                        <div
                            className="pt2 mx-auto sm-px2"
                            style={{maxWidth: 450, textAlign: 'left', color: CUSTOM_GRAY}}
                        >
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
                        <div className="pt1 pb4">
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
            stepIndex: RegistrationFlowSteps.REGISTRATION_COMPLETE,
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
                stepIndex: RegistrationFlowSteps.CONTRIBUTION_DETAILS,
                civicUserId: responseJSON.civicUserId,
                isVerifyingIdentity: false,
            });
        }
    }
}
