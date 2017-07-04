import * as _ from 'lodash';
import * as React from 'react';
import * as BigNumber from 'bignumber.js';
import * as Recaptcha from 'react-recaptcha';
import {constants} from 'ts/utils/constants';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import {Dispatcher} from 'ts/redux/dispatcher';
import {IdenticonAddressInput} from 'ts/components/inputs/identicon_address_input';
import {EthAmountInput} from 'ts/components/inputs/eth_amount_input';
import {InputLabel} from 'ts/components/ui/input_label';
import {RequiredLabel} from 'ts/components/ui/required_label';

export interface ContributionFormProps {
    civicUserId: string;
    dispatcher: Dispatcher;
    onSubmittedContributionInfo: () => void;
}

interface ContributionFormState {
    contributionAddress?: string;
    didRegistrationSucceed: boolean;
    recaptchaToken?: string;
    contributionAmountInBaseUnits?: BigNumber.BigNumber;
}

export class ContributionForm extends React.Component<ContributionFormProps, ContributionFormState> {
    private recaptchaInstance: any;
    constructor(props: ContributionFormProps) {
        super(props);
        this.state = {
            contributionAddress: undefined,
            didRegistrationSucceed: false,
            recaptchaToken: undefined,
            contributionAmountInBaseUnits: undefined,
        };
    }
    public render() {
        const contributionAmountLabel = <RequiredLabel label="How much do you want to contribute"/>;
        return (
            <div className="mx-auto left-align" style={{width: 414}}>
                <div className="h2 my2">
                    Select Contribution Address & Amount
                </div>
                <div className="pt2" style={{width: 400}}>
                    <IdenticonAddressInput
                        initialAddress={''}
                        isRequired={true}
                        label={'Contribution Ethereum address'}
                        updateOrderAddress={this.onContributionAddressChanged.bind(this)}
                    />
                </div>
                <div style={{width: 400}}>
                    <InputLabel text={contributionAmountLabel}/>
                    <EthAmountInput
                        amount={this.state.contributionAmountInBaseUnits}
                        balance={new BigNumber(Infinity)}
                        shouldCheckBalance={false}
                        shouldShowIncompleteErrs={false}
                        onChange={this.onContributionAmountChanged.bind(this)}
                    />
                </div>
                <Recaptcha
                    sitekey={constants.RECAPTCHA_SITE_KEY}
                    render="explicit"
                    ref={this.setRecaptchaInstance.bind(this)}
                    onloadCallback={_.noop}
                    verifyCallback={this.verifyCaptchaCallback.bind(this)}
                />
                <div className="pt3 mt1">
                    <RaisedButton
                        label="Submit"
                        primary={true}
                        disabled={
                            _.isUndefined(this.state.recaptchaToken) ||
                            _.isUndefined(this.state.contributionAddress) ||
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
            contributionAddress: this.state.contributionAddress,
            contributionAmountInBaseUnits: this.state.contributionAmountInBaseUnits,
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
        this.resetRecaptcha();
        if (response.status !== 200) {
            const errorMsg = await response.text();
            if (errorMsg === 'ADDRESS_ALREADY_REGISTERED') {
                this.props.dispatcher.showFlashMessage('You cannot update your contribution address.');
            } else if (errorMsg === 'NOT_ENOUGH_BALANCE') {
                this.props.dispatcher.showFlashMessage(
                    'You must have a sufficient balance in your account to contribute your desired amount.',
                );
            } else {
                this.props.dispatcher.showFlashMessage('Address registration failed');
            }
        } else {
            this.props.onSubmittedContributionInfo();
        }
    }
    private onContributionAmountChanged(isValid: boolean, contributionAmountInBaseUnits?: BigNumber.BigNumber) {
        this.setState({
            contributionAmountInBaseUnits,
        });
    }
    private onContributionAddressChanged(contributionAddress?: string) {
        this.setState({
            contributionAddress,
        });
    }
    private setRecaptchaInstance(recaptchaInstance: any) {
        this.recaptchaInstance = recaptchaInstance;
    }
    private resetRecaptcha() {
        this.recaptchaInstance.reset();
    }
}
