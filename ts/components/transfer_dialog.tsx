import * as React from 'react';
import * as _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RadioButtonGroup from 'material-ui/RadioButton/RadioButtonGroup';
import RadioButton from 'material-ui/RadioButton';
import {Side, Token} from 'ts/types';
import {TokenAmountInput} from 'ts/components/inputs/token_amount_input';
import {EthAmountInput} from 'ts/components/inputs/eth_amount_input';
import {AddressInput} from 'ts/components/inputs/address_input';
import * as BigNumber from 'bignumber.js';

interface TransferDialogProps {
    onComplete: (recipient: string, value: BigNumber.BigNumber) => void;
    onCancelled: () => void;
    isOpen: boolean;
    token: Token;
}

interface TransferDialogState {
    value?: BigNumber.BigNumber;
    recipient: string;
    shouldShowIncompleteErrs: boolean;
    isAmountValid: boolean;
}

export class TransferDialog extends React.Component<TransferDialogProps, TransferDialogState> {
    constructor() {
        super();
        this.state = {
            recipient: '',
            shouldShowIncompleteErrs: false,
            isAmountValid: false,
        };
    }
    public render() {
        const transferDialogActions = [
            <FlatButton
                label="Cancel"
                onTouchTap={this.onCancel.bind(this)}
            />,
            <FlatButton
                disabled={this.hasErrors()}
                label="Transfer"
                primary={true}
                onTouchTap={this.onTransferClick.bind(this)}
            />,
        ];
        return (
            <Dialog
                title="I want to tranfer"
                titleStyle={{fontWeight: 100}}
                actions={transferDialogActions}
                open={this.props.isOpen}
            >
                {this.renderTransferDialogBody()}
            </Dialog>
        );
    }
    private renderTransferDialogBody() {
        return (
            <div className="mx-auto" style={{maxWidth: 300}}>
                <AddressInput
                    initialAddress={this.state.recipient}
                    updateAddress={this.onRecipientChange.bind(this)}
                    isRequired={true}
                    label={'Recipient address'}
                    hintText={'Address'}
                />
                <TokenAmountInput
                    label="Amount to transfer"
                    token={this.props.token}
                    shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                    shouldCheckBalance={true}
                    shouldCheckAllowance={false}
                    onChange={this.onValueChange.bind(this)}
                    amount={this.state.value}
                    onVisitBalancesPageClick={this.props.onCancelled}
                />
            </div>
        );
    }
    private onRecipientChange(recipient?: string) {
        this.setState({
            shouldShowIncompleteErrs: false,
            recipient,
        });
    }
    private onValueChange(isValid: boolean, amount?: BigNumber.BigNumber) {
        this.setState({
            isAmountValid: isValid,
            value: amount,
        });
    }
    private onTransferClick() {
        if (this.hasErrors()) {
            this.setState({
                shouldShowIncompleteErrs: true,
            });
        } else {
            const value = this.state.value;
            this.setState({
                value: undefined,
            });
            this.props.onComplete(this.state.recipient, value);
        }
    }
    private onCancel() {
        this.setState({
            value: undefined,
        });
        this.props.onCancelled();
    }
    private hasErrors() {
        return _.isUndefined(this.state.recipient) ||
               _.isUndefined(this.state.value) ||
               !this.state.isAmountValid;
    }
}
