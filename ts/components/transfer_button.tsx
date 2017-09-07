import * as _ from 'lodash';
import {ZeroEx} from '0x.js';
import * as React from 'react';
import * as BigNumber from 'bignumber.js';
import RaisedButton from 'material-ui/RaisedButton';
import {BlockchainCallErrs} from 'ts/types';
import {TransferDialog} from 'ts/components/transfer_dialog';
import {Token} from 'ts/types';
import {constants} from 'ts/utils/constants';
import {utils} from 'ts/utils/utils';
import {Dispatcher} from 'ts/redux/dispatcher';
import {errorReporter} from 'ts/utils/error_reporter';
import {Blockchain} from 'ts/blockchain';

interface TransferButtonProps {
    token: Token;
    dispatcher: Dispatcher;
    blockchain: Blockchain;
    onError: () => void;
}

interface TransferButtonState {
    isTransferDialogVisible: boolean;
    isTransferring: boolean;
}

export class TransferButton extends React.Component<TransferButtonProps, TransferButtonState> {
    public constructor(props: TransferButtonProps) {
        super(props);
        this.state = {
            isTransferDialogVisible: false,
            isTransferring: false,
        };
    }
    public render() {
        const labelStyle = this.state.isTransferring ? {fontSize: 10} : {};
        return (
            <div>
                <RaisedButton
                    style={{width: '100%'}}
                    labelStyle={labelStyle}
                    disabled={this.state.isTransferring}
                    label={this.state.isTransferring ? 'Sending...' : 'Send'}
                    onClick={this.toggleTransferDialog.bind(this)}
                />
                <TransferDialog
                    isOpen={this.state.isTransferDialogVisible}
                    onComplete={this.onTransferAmountSelectedAsync.bind(this)}
                    onCancelled={this.toggleTransferDialog.bind(this)}
                    token={this.props.token}
                />
            </div>
        );
    }
    private toggleTransferDialog() {
        this.setState({
            isTransferDialogVisible: !this.state.isTransferDialogVisible,
        });
    }
    private async onTransferAmountSelectedAsync(recipient: string, value: BigNumber.BigNumber) {
        this.setState({
            isTransferring: true,
        });
        this.toggleTransferDialog();
        const token = this.props.token;
        let balance = token.balance;
        try {
            await this.props.blockchain.transferAsync(token.address, recipient, value);
            const tokenAmount = ZeroEx.toUnitAmount(value, token.decimals);
            const flashMessage = `Successfully transferred ${tokenAmount.toString()} ${token.symbol} to ${recipient}`;
            this.props.dispatcher.showFlashMessage(flashMessage);
            balance = balance.minus(value);
            const updatedToken = _.assign({}, token, {
                balance,
            });
            this.props.dispatcher.updateTokenByAddress([updatedToken]);
        } catch (err) {
            const errMsg = `${err}`;
            if (_.includes(errMsg, BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES)) {
                this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
                return;
            } else if (!_.includes(errMsg, 'User denied transaction')) {
                utils.consoleLog(`Unexpected error encountered: ${err}`);
                utils.consoleLog(err.stack);
                await errorReporter.reportAsync(err);
                this.props.onError();
            }
        }
        this.setState({
            isTransferring: false,
        });
    }
}
