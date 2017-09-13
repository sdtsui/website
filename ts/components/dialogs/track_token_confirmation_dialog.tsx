import * as _ from 'lodash';
import * as React from 'react';
import {colors} from 'material-ui/styles';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import {constants} from 'ts/utils/constants';
import {Blockchain} from 'ts/blockchain';
import {Dispatcher} from 'ts/redux/dispatcher';
import {TrackTokenConfirmation} from 'ts/components/track_token_confirmation';
import {trackedTokenStorage} from 'ts/local_storage/tracked_token_storage';
import {Token, TokenByAddress} from 'ts/types';

interface TrackTokenConfirmationDialogProps {
    tokens: Token[];
    tokenByAddress: TokenByAddress;
    isOpen: boolean;
    onToggleDialog: (didConfirmTokenTracking: boolean) => void;
    dispatcher: Dispatcher;
    networkId: number;
    blockchain: Blockchain;
    userAddress: string;
}

interface TrackTokenConfirmationDialogState {
    isAddingTokenToTracked: boolean;
}

export class TrackTokenConfirmationDialog extends
    React.Component<TrackTokenConfirmationDialogProps, TrackTokenConfirmationDialogState> {
    constructor(props: TrackTokenConfirmationDialogProps) {
        super(props);
        this.state = {
            isAddingTokenToTracked: false,
        };
    }
    public render() {
        const tokens = this.props.tokens;
        return (
            <Dialog
                title="Tracking confirmation"
                titleStyle={{fontWeight: 100}}
                actions={[
                    <FlatButton
                        label="No"
                        onTouchTap={this.onTrackConfirmationRespondedAsync.bind(this, false)}
                    />,
                    <FlatButton
                        label="Yes"
                        onTouchTap={this.onTrackConfirmationRespondedAsync.bind(this, true)}
                    />,
                ]}
                open={this.props.isOpen}
                onRequestClose={this.props.onToggleDialog.bind(this, false)}
                autoScrollBodyContent={true}
            >
                <div className="pt2">
                    <TrackTokenConfirmation
                        tokens={tokens}
                        networkId={this.props.networkId}
                        isAddingTokenToTracked={this.state.isAddingTokenToTracked}
                    />
                </div>
            </Dialog>
        );
    }
    private async onTrackConfirmationRespondedAsync(didUserAcceptTracking: boolean) {
        if (!didUserAcceptTracking) {
            this.props.onToggleDialog(didUserAcceptTracking);
            return;
        }
        this.setState({
            isAddingTokenToTracked: true,
        });
        for (const token of this.props.tokens) {
            const newTokenEntry = _.assign({}, token);

            if (!token.isRegistered) {
                // Let's make sure this token (with a unique address), also have a unique name/symbol, otherwise
                // we append something to make it visibly clear to the end user that this is a different underlying
                // token then the identically named one they already had locally.
                const existingTokens = _.values(this.props.tokenByAddress);
                const isUniqueName = _.isUndefined(_.find(existingTokens, {name: newTokenEntry.name}));
                if (!isUniqueName) {
                    newTokenEntry.name = `${newTokenEntry.name} [Imported]`;
                }

                const isUniqueSymbol = _.isUndefined(_.find(existingTokens, {symbol: newTokenEntry.symbol}));
                if (!isUniqueSymbol) {
                    newTokenEntry.symbol = this.addSymbolFlourish(newTokenEntry.symbol);
                }
            }

            newTokenEntry.isTracked = true;
            trackedTokenStorage.addTrackedTokenToUser(this.props.userAddress, this.props.networkId, newTokenEntry);
            this.props.dispatcher.updateTokenByAddress([newTokenEntry]);

            const [
                balance,
                allowance,
            ] = await this.props.blockchain.getCurrentUserTokenBalanceAndAllowanceAsync(token.address);
            this.props.dispatcher.updateTokenStateByAddress({
                [token.address]: {
                    balance,
                    allowance,
                },
            });
        }

        this.setState({
            isAddingTokenToTracked: false,
        });
        this.props.onToggleDialog(didUserAcceptTracking);
    }
    private addSymbolFlourish(symbol: string) {
        return `*${symbol}*`;
    }
}
