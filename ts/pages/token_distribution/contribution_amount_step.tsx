import * as _ from 'lodash';
import * as React from 'react';
import * as BigNumber from 'bignumber.js';
import * as Recaptcha from 'react-recaptcha';
import RaisedButton from 'material-ui/RaisedButton';
import {Dispatcher} from 'ts/redux/dispatcher';
import {constants} from 'ts/utils/constants';
import {EthAmountInput} from 'ts/components/inputs/eth_amount_input';
import {InputLabel} from 'ts/components/ui/input_label';
import {RequiredLabel} from 'ts/components/ui/required_label';

const CUSTOM_GRAY = '#635F5E';

export interface ContributionAmountStepProps {
    civicUserId: string;
    dispatcher: Dispatcher;
    onSubmittedContributionInfo: () => void;
}

interface ContributionAmountStepState {
    didRegistrationSucceed: boolean;
    recaptchaToken?: string;
    contributionAmountInBaseUnits?: BigNumber.BigNumber;
}

export class ContributionAmountStep extends React.Component<ContributionAmountStepProps, ContributionAmountStepState> {
    private recaptchaInstance: any;
    constructor(props: ContributionAmountStepProps) {
        super(props);
        this.state = {
            didRegistrationSucceed: false,
            recaptchaToken: undefined,
            contributionAmountInBaseUnits: undefined,
        };
    }
    public render() {
        const contributionAmountLabel = <RequiredLabel label="How much do you want to contribute"/>;
        return (
            <div className="mx-auto left-align sm-px2" style={{maxWidth: 414, color: CUSTOM_GRAY}}>
                <div className="my2 pt3 left-align" style={{fontSize: 28}}>
                    Select contribution amount
                </div>
                <div className="pt3" style={{maxWidth: 400}}>
                    <InputLabel text={contributionAmountLabel}/>
                    <EthAmountInput
                        amount={this.state.contributionAmountInBaseUnits}
                        balance={new BigNumber(Infinity)}
                        shouldCheckBalance={false}
                        shouldShowIncompleteErrs={false}
                        onChange={this.onContributionAmountChanged.bind(this)}
                    />
                </div>
                <div>
                    <Recaptcha
                        sitekey={constants.RECAPTCHA_SITE_KEY}
                        render="explicit"
                        ref={this.setRecaptchaInstance.bind(this)}
                        onloadCallback={_.noop}
                        verifyCallback={this.verifyCaptchaCallback.bind(this)}
                    />
                </div>
                <div className="pt3 mt1 pb4">
                    <RaisedButton
                        label="Submit"
                        primary={true}
                        disabled={
                            _.isUndefined(this.state.recaptchaToken) ||
                            _.isUndefined(this.state.contributionAmountInBaseUnits)
                        }
                        onClick={this.onContributionSubmitClickAsync.bind(this)}
                    />
                </div>
            </div>
        );
    }
    private verifyCaptchaCallback(recaptchaToken: string) {
        this.setState({
            recaptchaToken,
        });
    }
    private async onContributionSubmitClickAsync() {
        const body = JSON.stringify({
            contributionAmountInBaseUnits: this.state.contributionAmountInBaseUnits,
            civicUserId: this.props.civicUserId,
            recaptchaToken: this.state.recaptchaToken,
        });
        const response = await fetch(`${constants.BACKEND_BASE_URL}/contribution_amount`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body,
        });
        this.resetRecaptcha();
        if (response.status !== 200) {
            this.props.dispatcher.showFlashMessage('Address registration failed.');
        } else {
            this.props.onSubmittedContributionInfo();
        }
    }
    private onContributionAmountChanged(isValid: boolean, contributionAmountInBaseUnits?: BigNumber.BigNumber) {
        this.setState({
            contributionAmountInBaseUnits,
        });
    }
    private setRecaptchaInstance(recaptchaInstance: any) {
        this.recaptchaInstance = recaptchaInstance;
    }
    private resetRecaptcha() {
        this.recaptchaInstance.reset();
    }
}
