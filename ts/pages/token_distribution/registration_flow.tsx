import * as _ from 'lodash';
import * as React from 'react';
import * as DocumentTitle from 'react-document-title';
import * as queryString from 'query-string';
import * as Recaptcha from 'react-recaptcha';
import {colors} from 'material-ui/styles';
import Paper from 'material-ui/Paper';
import {Step, Stepper, StepLabel} from 'material-ui/Stepper';
import {Blockchain} from 'ts/blockchain';
import {ipUtils} from 'ts/utils/ip_utils';
import {configs} from 'ts/utils/configs';
import {constants} from 'ts/utils/constants';
import {utils} from 'ts/utils/utils';
import {Footer} from 'ts/components/footer';
import {TopBar} from 'ts/components/top_bar';
import {SignatureStep} from 'ts/pages/token_distribution/signature_step';
import {TermsAndConditions} from 'ts/pages/token_distribution/terms_and_conditions';
import {RegisterButton} from 'ts/pages/token_distribution/register_button';
import {CivicSip, BlockchainErrs, ProviderType} from 'ts/types';
import {Dispatcher} from 'ts/redux/dispatcher';
import {FlashMessage} from 'ts/components/ui/flash_message';
import {NewsletterInput} from 'ts/pages/home/newsletter_input';
import {SimpleLoading} from 'ts/components/ui/simple_loading';
import {BlockchainErrDialog} from 'ts/components/blockchain_err_dialog';
import {queueItTokenStorage} from 'ts/local_storage/queue_it_token_storage';

const CUSTOM_GRAY = '#635F5E';
enum RegistrationFlowSteps {
    ACCEPT_TERMS_AND_CONDITIONS,
    VERIFY_IDENTITY,
    SIGNATURE_PROOF,
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
    flashMessage?: string|React.ReactNode;
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
    isLoadingRegistrationFlow: boolean;
    isDisallowedIp: boolean;
    queueItToken: string;
    recaptchaToken?: string;
}

export class RegistrationFlow extends React.Component<RegistrationFlowProps, RegistrationFlowState> {
    private blockchain: Blockchain;
    private civicSip: CivicSip;
    private recaptchaInstance: any;
    constructor(props: RegistrationFlowProps) {
        super(props);
        this.civicSip = new (global as any).civic.sip({
            appId: configs.CIVIC_APP_ID,
        });
        this.state = {
            stepIndex: RegistrationFlowSteps.ACCEPT_TERMS_AND_CONDITIONS,
            civicUserId: undefined,
            isVerifyingIdentity: false,
            prevNetworkId: this.props.networkId,
            prevNodeVersion: this.props.nodeVersion,
            prevUserAddress: this.props.userAddress,
            prevProviderType: this.props.providerType,
            isLoadingRegistrationFlow: true,
            isDisallowedIp: false,
            queueItToken: undefined,
            recaptchaToken: undefined,
        };
    }
    public componentWillMount() {
        this.setIsNYIPFireAndForgetAsync();
        this.setQueueItTokenOrRedirectIfNoneExistsFireAndForgetAsync();
        const isRegistrationFlow = true;
        this.blockchain = new Blockchain(this.props.dispatcher, isRegistrationFlow);
    }
    public componentWillUnmount() {
        // Reset the redux state so that if the user navigate to OTC or some other page, it can initialize
        // itself properly.
        this.props.dispatcher.resetState();
    }
    public componentDidMount() {
        this.civicSip.on('data-received', jwtToken => {
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
                <DocumentTitle title="Registration - 0x Token Sale"/>
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
                                <StepLabel>Terms & conditions</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>Identity verification</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>Ownership proof</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>Complete</StepLabel>
                            </Step>
                        </Stepper>
                    </div>
                    {this.state.isLoadingRegistrationFlow ?
                        <SimpleLoading message="Loading registration flow" /> :
                        this.renderMainContent()
                    }
                </div>
                <BlockchainErrDialog
                    blockchain={this.blockchain}
                    blockchainErr={this.props.blockchainErr}
                    isOpen={this.props.shouldBlockchainErrDialogBeOpen}
                    userAddress={this.props.userAddress}
                    toggleDialogFn={updateShouldBlockchainErrDialogBeOpen}
                    isTokenLaunchPage={true}
                />
                <FlashMessage
                    dispatcher={this.props.dispatcher}
                    flashMessage={this.props.flashMessage}
                    showDurationMs={10000}
                    bodyStyle={{backgroundColor: constants.CUSTOM_BLUE}}
                />
                <Footer />
            </div>
        );
    }
    private renderMainContent() {
        return (
            <div>
                {this.state.isDisallowedIp ?
                    this.renderIPForbiddenMessage() :
                    <div>
                        {this.state.stepIndex === RegistrationFlowSteps.ACCEPT_TERMS_AND_CONDITIONS &&
                            <TermsAndConditions
                                onContinueClick={this.onAcceptTermsAndConditions.bind(this)}
                            />
                        }
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
                                    networkId={this.props.networkId}
                                    userAddress={this.props.userAddress}
                                    onSubmittedOwnershipProof={this.onSubmittedOwnershipProof.bind(this)}
                                    providerType={this.props.providerType}
                                />
                            </div>
                        }
                        {this.state.stepIndex === RegistrationFlowSteps.REGISTRATION_COMPLETE &&
                            this.renderThankYouStep()
                        }
                    </div>
                }
            </div>
        );
    }
    private renderIPForbiddenMessage() {
        return (
            <div className="sm-px3">
                <Paper
                    className="mt3 p3 mx-auto left-align"
                    style={{maxWidth: 400}}
                >
                    <div className="h3 thin">
                        <i className="zmdi zmdi-alert-triangle mr1" />
                        Disallowed IP detected
                    </div>
                    <div className="pt2">
                        We are sorry but registration by individuals from certain cities and countries
                        goes against our terms and conditions. We are not able to let you register.
                    </div>
                </Paper>
            </div>
        );
    }
    private renderThankYouStep() {
        return (
            <div className="mx-auto" style={{maxWidth: 440, color: CUSTOM_GRAY}}>
                <div className="my2 pt3" style={{fontSize: 28}}>
                    Registration successful!
                </div>
                <div className="sm-px2 pb3" style={{color: CUSTOM_GRAY}}>
                    <div className="py2">
                        Thank you for taking the time to register for the 0x token sale. The contribution
                        period will begin on the <span className="bold">15th of August</span>.
                    </div>
                    <div className="mx-auto pt3">
                        <img
                            src="/images/zrx_token.png"
                            style={{width: 150}}
                        />
                    </div>
                    <div className="pt1 mx-auto" style={{maxWidth: 440}}>
                        We have sent a registration confirmation email to your Civic-associated email
                        address. You will also receive a reminder email before the contribution period opens.
                    </div>
                </div>
            </div>
        );
    }
    private renderVerifyIdentityStep() {
        if (utils.isUserOnMobile()) {
            return (
                <div>
                    Mobile devices are not supported.
                    Please complete your registration on a Desktop
                    using an ethereum enabled browser (Metamask or Parity Signer) or Ledger Nano S.
                </div>
            );
        }
        return (
            <div>
                {this.state.isVerifyingIdentity ?
                    <SimpleLoading message="verifying your Civic Identity" /> :
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
                                    <div className="pb4 left-align" style={{maxWidth: 357}}>
                                        <div className="mx-auto pt2 pb3" style={{width: 302}}>
                                            <Recaptcha
                                                sitekey={configs.RECAPTCHA_SITE_KEY}
                                                render="explicit"
                                                ref={this.setRecaptchaInstance.bind(this)}
                                                onloadCallback={_.noop}
                                                verifyCallback={this.verifyCaptchaCallback.bind(this)}
                                            />
                                        </div>
                                        <div className="pt1">
                                            <RegisterButton
                                                onClick={this.onRegisterClick.bind(this)}
                                                isDisabled={_.isUndefined(this.state.recaptchaToken)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="py3 mx-auto sm-px3" style={{color: '#A5A5A5', maxWidth: 500}}>
                            *0x is using{' '}
                            <a
                                href="https://www.civic.com/"
                                target="_blank"
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
    private onSubmittedOwnershipProof() {
        this.setState({
            stepIndex: RegistrationFlowSteps.REGISTRATION_COMPLETE,
        });
    }
    private onAcceptTermsAndConditions() {
        this.setState({
            stepIndex: RegistrationFlowSteps.VERIFY_IDENTITY,
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
            queueItToken: this.state.queueItToken,
            recaptchaToken: this.state.recaptchaToken,
        });
        const response = await fetch(`${configs.BACKEND_BASE_URL}/civic_auth`, {
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
    private async setIsNYIPFireAndForgetAsync() {
        const isDisallowedIp = await ipUtils.isDisallowedIPAsync();
        this.setState({
            isDisallowedIp,
            isLoadingRegistrationFlow: false,
        });
    }
    private async setQueueItTokenOrRedirectIfNoneExistsFireAndForgetAsync() {
        const queueItTokenIfExists = this.getQueueItTokenIfExists();
        if (_.isUndefined(queueItTokenIfExists)) {
            // Re-direct to QueueIt if they haven't been through it yet.
            window.location.href = configs.QUEUE_IT_URL;
        } else {
            this.setState({
                queueItToken: queueItTokenIfExists,
            });
        }
    }
    private getQueueItTokenIfExists(): string|undefined {
        const parsed = queryString.parse(window.location.search);
        let queueItToken = parsed.queueittoken;
        if (_.isUndefined(queueItToken)) {
            queueItToken = queueItTokenStorage.getToken();
            if (_.isUndefined(queueItToken) || _.isEmpty(queueItToken)) {
                return;
            }
        } else {
            queueItTokenStorage.addToken(queueItToken);
        }
        return queueItToken;
    }
    private setRecaptchaInstance(recaptchaInstance: any) {
        this.recaptchaInstance = recaptchaInstance;
    }
    private resetRecaptcha() {
        this.recaptchaInstance.reset();
    }
    private verifyCaptchaCallback(recaptchaToken: string) {
        this.setState({
            recaptchaToken,
        });
    }
}
