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

export interface AddressFormProps {
    civicUserId: string;
    dispatcher: Dispatcher;
}

interface AddressFormState {
    contributionAddress?: string;
    didRegistrationSucceed: boolean;
    recaptchaToken?: string;
    contributionAmountInBaseUnits?: BigNumber.BigNumber;
}

export class AddressForm extends React.Component<AddressFormProps, AddressFormState> {
    private recaptchaInstance: any;
    constructor(props: AddressFormProps) {
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
                        <IdenticonAddressInput
                            initialAddress={''}
                            isRequired={true}
                            label={'Contribution Ethereum address'}
                            updateOrderAddress={this.onContributionAddressChanged.bind(this)}
                        />
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
                            sitekey="6LcXHicUAAAAAOmRl4ZpDf2MxLEiHolYp1vpdOII"
                            render="explicit"
                            ref={this.setRecaptchaInstance.bind(this)}
                            onloadCallback={_.noop}
                            verifyCallback={this.verifyCaptchaCallback.bind(this)}
                        />
                        <div className="pt3">
                            <RaisedButton
                                label="Submit"
                                primary={true}
                                disabled={
                                    _.isUndefined(this.state.recaptchaToken) ||
                                    _.isUndefined(this.state.contributionAddress) ||
                                    _.isUndefined(this.state.contributionAmountInBaseUnits)
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
    private setRecaptchaInstance(recaptchaInstance: any) {
        this.recaptchaInstance = recaptchaInstance;
    }
    private resetRecaptcha() {
        this.recaptchaInstance.reset();
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
        this.resetRecaptcha();
        if (response.status !== 200) {
            const errorMsg = await response.text();
            if (errorMsg === 'ADDRESS_ALREADY_REGISTERED') {
                this.props.dispatcher.showFlashMessage('You cannot update your contribution address.');
            } else {
                this.props.dispatcher.showFlashMessage('Address registration failed');
            }
        } else {
            this.setState({
                didRegistrationSucceed: true,
            });
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
}
