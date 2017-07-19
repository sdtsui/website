import * as _ from 'lodash';
import * as React from 'react';
import {colors} from 'material-ui/styles';
import Paper from 'material-ui/Paper';
import CircularProgress from 'material-ui/CircularProgress';
import {Step, Stepper, StepLabel} from 'material-ui/Stepper';
import {Blockchain} from 'ts/blockchain';
import {constants} from 'ts/utils/constants';
import {Footer} from 'ts/components/footer';
import {TopBar} from 'ts/components/top_bar';
import {ContributionAmountStep} from 'ts/pages/token_distribution/contribution_amount_step';
import {SignatureStep} from 'ts/pages/token_distribution/signature_step';
import {RegisterButton} from 'ts/pages/token_distribution/register_button';
import {CivicSip, BlockchainErrs, ProviderType} from 'ts/types';
import {Dispatcher} from 'ts/redux/dispatcher';
import {FlashMessage} from 'ts/components/ui/flash_message';
import {NewsletterInput} from 'ts/pages/home/newsletter_input';
import {BlockchainErrDialog} from 'ts/components/blockchain_err_dialog';

const CUSTOM_GRAY = '#635F5E';
enum RegistrationFlowSteps {
    VERIFY_IDENTITY,
    SIGNATURE_PROOF,
    CONTRIBUTION_AMOUNT,
    REGISTRATION_COMPLETE,
}

export interface RegistrationFlowProps {
    location: Location;
    dispatcher: Dispatcher;
    blockchainIsLoaded: boolean;
    networkId: number;
    nodeVersion: string;
    providerType: ProviderType;
    injectedProviderName: string;
    userAddress: string;
    flashMessage?: string;
    blockchainErr: BlockchainErrs;
    shouldBlockchainErrDialogBeOpen: boolean;
}

interface RegistrationFlowState {
    civicUserId: string;
    stepIndex: RegistrationFlowSteps;
    isVerifyingIdentity: boolean;
    prevNetworkId: number;
    prevNodeVersion: string;
    prevUserAddress: string;
    prevProviderType: ProviderType;
}

export class RegistrationFlow extends React.Component<RegistrationFlowProps, RegistrationFlowState> {
    private blockchain: Blockchain;
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
            prevNetworkId: this.props.networkId,
            prevNodeVersion: this.props.nodeVersion,
            prevUserAddress: this.props.userAddress,
            prevProviderType: this.props.providerType,
        };
    }
    public componentWillMount() {
        this.blockchain = new Blockchain(this.props.dispatcher);
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

        this.civicSip.on('user-cancelled', (event: any) => {
            this.setState({
                isVerifyingIdentity: false,
            });
        });
    }
    public componentWillReceiveProps(nextProps: RegistrationFlowProps) {
        if (nextProps.networkId !== this.state.prevNetworkId) {
            this.blockchain.networkIdUpdatedFireAndForgetAsync(nextProps.networkId);
            this.setState({
                prevNetworkId: nextProps.networkId,
            });
        }
        if (nextProps.userAddress !== this.state.prevUserAddress) {
            this.blockchain.userAddressUpdatedFireAndForgetAsync(nextProps.userAddress);
            this.setState({
                prevUserAddress: nextProps.userAddress,
            });
        }
        if (nextProps.nodeVersion !== this.state.prevNodeVersion) {
            this.blockchain.nodeVersionUpdatedFireAndForgetAsync(nextProps.nodeVersion);
            this.setState({
                prevNodeVersion: nextProps.nodeVersion,
            });
        }
        if (nextProps.providerType !== this.state.prevProviderType) {
            this.blockchain.providerTypeUpdatedFireAndForgetAsync(nextProps.providerType);
            this.setState({
                prevProviderType: nextProps.providerType,
            });
        }
    }
    public render() {
        const updateShouldBlockchainErrDialogBeOpen = this.props.dispatcher
                .updateShouldBlockchainErrDialogBeOpen.bind(this.props.dispatcher);
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
                                <StepLabel>Signature proof</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>Choose contribution amount</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>Complete</StepLabel>
                            </Step>
                        </Stepper>
                    </div>
                    {this.state.stepIndex === RegistrationFlowSteps.VERIFY_IDENTITY &&
                        this.renderVerifyIdentityStep()
                    }
                    {this.state.stepIndex === RegistrationFlowSteps.SIGNATURE_PROOF &&
                        <div>
                            <SignatureStep
                                blockchain={this.blockchain}
                                blockchainIsLoaded={this.props.blockchainIsLoaded}
                                civicUserId={this.state.civicUserId}
                                dispatcher={this.props.dispatcher}
                                injectedProviderName={this.props.injectedProviderName}
                                userAddress={this.props.userAddress}
                                onSubmittedOwnershipProof={this.onSubmittedOwnershipProof.bind(this)}
                                providerType={this.props.providerType}
                            />
                        </div>
                    }
                    {this.state.stepIndex === RegistrationFlowSteps.CONTRIBUTION_AMOUNT &&
                        <ContributionAmountStep
                            civicUserId={this.state.civicUserId}
                            dispatcher={this.props.dispatcher}
                            onSubmittedContributionInfo={this.onSubmittedContributionInfo.bind(this)}
                        />
                    }
                    {this.state.stepIndex === RegistrationFlowSteps.REGISTRATION_COMPLETE &&
                        this.renderThankYouStep()
                    }
                </div>
                <BlockchainErrDialog
                    blockchain={this.blockchain}
                    blockchainErr={this.props.blockchainErr}
                    isOpen={this.props.shouldBlockchainErrDialogBeOpen}
                    userAddress={this.props.userAddress}
                    toggleDialogFn={updateShouldBlockchainErrDialogBeOpen}
                />
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
                    <div className="mx-auto pt3" style={{maxWidth: 400, height: 409}}>
                        <div
                            className="relative"
                            style={{top: '50%', transform: 'translateY(-50%)', height: 95}}
                        >
                            <CircularProgress />
                            <div className="pt3 pb3">
                                Verifying your Civic Identity...
                            </div>
                        </div>
                    </div> :
                    <div className="pt3" style={{color: CUSTOM_GRAY}}>
                        <div className="clearfix mx-auto">
                            <div className="col col-4 pt4 sm-hide xs-hide">
                                <div className="pt2 pr4 right-align">
                                    <img
                                        src="/images/qr_code_icon.png"
                                        style={{width: 90}}
                                    />
                                </div>
                            </div>
                            <div className="col lg-col-8 md-col-8 col-12 sm-px2">
                                <div className="my2 lg-left-align md-left-align" style={{fontSize: 28}}>
                                    Verify your identity with Civic
                                </div>
                                <div
                                    className="pt3 sm-px2 left-align sm-mx-auto"
                                    style={{maxWidth: 450}}
                                >
                                    <div>
                                        Follow the steps below to get verified:
                                    </div>
                                    <ul style={{paddingLeft: 19}}>
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
                                    <div className="pt1 pb4 left-align" style={{maxWidth: 357}}>
                                        <RegisterButton
                                            onClick={this.onRegisterClick.bind(this)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="py3 mx-auto sm-px3" style={{color: '#A5A5A5', maxWidth: 500}}>
                            *0x is using{' '}
                            <a
                                href="https://www.civic.com/"
                                style={{color: '#A5A5A5'}}
                                className="underline"
                            >
                                Civic
                            </a>'s
                            {' '}identity verification service to limit individual contributions to
                            the token sale.
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
    private onSubmittedOwnershipProof() {
        this.setState({
            stepIndex: RegistrationFlowSteps.CONTRIBUTION_AMOUNT,
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
                stepIndex: RegistrationFlowSteps.SIGNATURE_PROOF,
                civicUserId: responseJSON.civicUserId,
                isVerifyingIdentity: false,
            });
        }
    }
}
