import * as _ from 'lodash';
import * as React from 'react';
import {Blockchain} from 'ts/blockchain';
import {Paper, Divider, Dialog} from 'material-ui';
import {colors} from 'material-ui/styles';
import {Dispatcher} from 'ts/redux/dispatcher';
import {zeroEx} from 'ts/utils/zero_ex';
import {utils} from 'ts/utils/utils';
import {constants} from 'ts/utils/constants';
import {Validator} from 'ts/schemas/validator';
import {orderSchema} from 'ts/schemas/order_schema';
import {ErrorAlert} from 'ts/components/ui/error_alert';
import {OrderJSON} from 'ts/components/order_json';
import {IdenticonAddressInput} from 'ts/components/inputs/identicon_address_input';
import {TokenInput} from 'ts/components/inputs/token_input';
import {AmountInput} from 'ts/components/inputs/amount_input';
import {HashInput} from 'ts/components/inputs/hash_input';
import {ExpirationInput} from 'ts/components/inputs/expiration_input';
import {LifeCycleRaisedButton} from 'ts/components/ui/lifecycle_raised_button';
import {errorReporter} from 'ts/utils/error_reporter';
import {HelpTooltip} from 'ts/components/ui/help_tooltip';
import {SwapIcon} from 'ts/components/ui/swap_icon';
import {
    Side,
    SideToAssetToken,
    SignatureData,
    HashData,
    MenuItemValue,
    TokenByAddress,
    BlockchainErrs,
} from 'ts/types';

enum SigningState {
    UNSIGNED,
    SIGNING,
    SIGNED,
}

interface GenerateOrderFormProps {
    blockchain: Blockchain;
    blockchainErr: BlockchainErrs;
    blockchainIsLoaded: boolean;
    dispatcher: Dispatcher;
    hashData: HashData;
    orderExpiryTimestamp: number;
    userAddress: string;
    orderSignatureData: SignatureData;
    orderTakerAddress: string;
    sideToAssetToken: SideToAssetToken;
    tokenByAddress: TokenByAddress;
    triggerMenuClick: (menuItemValue: MenuItemValue) => void;
}

interface GenerateOrderFormState {
    globalErrMsg: string;
    shouldShowIncompleteErrs: boolean;
    signingState: SigningState;
}

const style = {
    paper: {
        display: 'inline-block',
        position: 'relative',
        textAlign: 'center',
        width: '100%',
    },
};

export class GenerateOrderForm extends React.Component<GenerateOrderFormProps, any> {
    private validator: Validator;
    constructor(props: GenerateOrderFormProps) {
        super(props);
        this.state = {
            globalErrMsg: '',
            shouldShowIncompleteErrs: false,
            signingState: SigningState.UNSIGNED,
        };
        this.validator = new Validator();
    }
    public componentWillReceiveProps(newProps: GenerateOrderFormProps) {
        if (!utils.deepEqual(newProps.hashData, this.props.hashData)) {
            this.setState({
                signingState: SigningState.UNSIGNED,
            });
        }
    }
    public render() {
        const dispatcher = this.props.dispatcher;
        const depositTokenAddress = this.props.sideToAssetToken[Side.deposit].address;
        const depositToken = this.props.tokenByAddress[depositTokenAddress];
        const receiveTokenAddress = this.props.sideToAssetToken[Side.receive].address;
        const receiveToken = this.props.tokenByAddress[receiveTokenAddress];
        const takerExplanation = `If a taker is specified, only they are allowed to fill this order.
                                  If no taker is specified, anyone is able to fill it.`;
        return (
            <div className="clearfix mb2 px4">
                <h3>Generate an order</h3>
                <Divider />
                <div className="mx-auto" style={{width: 495}}>
                    <div className="pt2 flex mx-auto">
                        <IdenticonAddressInput
                            label="Taker (address)"
                            blockchain={this.props.blockchain}
                            address={this.props.orderTakerAddress}
                            updateOrderAddress={dispatcher.updateOrderTakerAddress.bind(dispatcher)}
                        />
                        <div className="pt3">
                            <div className="pl1">
                                <HelpTooltip
                                    explanation={takerExplanation}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="pt1">
                        <div className="mx-auto clearfix">
                            <div className="col col-5">
                                <TokenInput
                                    blockchain={this.props.blockchain}
                                    blockchainErr={this.props.blockchainErr}
                                    dispatcher={this.props.dispatcher}
                                    label="Token to sell (address)"
                                    side={Side.deposit}
                                    assetToken={this.props.sideToAssetToken[Side.deposit]}
                                    updateChosenAssetToken={dispatcher.updateChosenAssetToken.bind(dispatcher)}
                                    tokenByAddress={this.props.tokenByAddress}
                                />
                            </div>
                            <div className="col col-2">
                                <div className="p1">
                                    <SwapIcon
                                        swapTokensFn={dispatcher.swapAssetTokenSymbols.bind(dispatcher)}
                                    />
                                </div>
                            </div>
                            <div className="col col-5">
                                <TokenInput
                                    blockchain={this.props.blockchain}
                                    blockchainErr={this.props.blockchainErr}
                                    dispatcher={this.props.dispatcher}
                                    label="Token to receive (address)"
                                    side={Side.receive}
                                    assetToken={this.props.sideToAssetToken[Side.receive]}
                                    updateChosenAssetToken={dispatcher.updateChosenAssetToken.bind(dispatcher)}
                                    tokenByAddress={this.props.tokenByAddress}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="pt1">
                        <div className="mx-auto clearfix">
                            <div className="col col-5">
                                <AmountInput
                                    label="Sell amount (uint)"
                                    side={Side.deposit}
                                    token={depositToken}
                                    assetToken={this.props.sideToAssetToken[Side.deposit]}
                                    shouldCheckBalanceAndAllowance={true}
                                    shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                                    triggerMenuClick={this.props.triggerMenuClick}
                                    updateChosenAssetToken={dispatcher.updateChosenAssetToken.bind(dispatcher)}
                                />
                            </div>
                            <div className="col col-2 p1" />
                            <div className="col col-5">
                                <AmountInput
                                    label="Receive amount (uint)"
                                    side={Side.receive}
                                    token={receiveToken}
                                    assetToken={this.props.sideToAssetToken[Side.receive]}
                                    updateChosenAssetToken={dispatcher.updateChosenAssetToken.bind(dispatcher)}
                                    shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                                    triggerMenuClick={this.props.triggerMenuClick}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="pt1">
                        <div className="mx-auto" style={{width: 295}}>
                            <div style={{fontSize: 12, color: colors.grey500}}>Expiration (uint)</div>
                            <ExpirationInput
                                orderExpiryTimestamp={this.props.orderExpiryTimestamp}
                                updateOrderExpiry={dispatcher.updateOrderExpiry.bind(dispatcher)}
                            />
                        </div>
                    </div>
                    <div className="pt2">
                        <HashInput
                            blockchain={this.props.blockchain}
                            blockchainIsLoaded={this.props.blockchainIsLoaded}
                            hashData={this.props.hashData}
                            label="Hash (byte32)"
                        />
                    </div>
                    <div className="pt2">
                        <div className="center">
                            <LifeCycleRaisedButton
                                isHidden={this.state.signingState === SigningState.SIGNED}
                                isPrimary={true}
                                labelReady="Sign hash"
                                labelLoading="Signing..."
                                labelComplete="Hash signed!"
                                onClickAsyncFn={this.onSignClickedAsync.bind(this)}
                            />
                        </div>
                        {this.state.globalErrMsg !== '' && <ErrorAlert message={this.state.globalErrMsg} />}
                    </div>
                </div>
                <Dialog
                    title="Order JSON"
                    modal={false}
                    open={this.state.signingState === SigningState.SIGNED}
                    onRequestClose={this.onCloseOrderJSONDialog.bind(this)}
                >
                    <OrderJSON
                        orderExpiryTimestamp={this.props.orderExpiryTimestamp}
                        orderSignatureData={this.props.orderSignatureData}
                        orderTakerAddress={this.props.orderTakerAddress}
                        orderMakerAddress={this.props.userAddress}
                        sideToAssetToken={this.props.sideToAssetToken}
                        tokenByAddress={this.props.tokenByAddress}
                    />
                </Dialog>
            </div>
        );
    }
    private onCloseOrderJSONDialog() {
        this.setState({
            signingState: SigningState.UNSIGNED,
        });
    }
    private async onSignClickedAsync(): Promise<boolean> {
        if (this.props.blockchainErr !== '') {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            return false;
        }

        // Check if all required inputs were supplied
        const debitToken = this.props.sideToAssetToken[Side.deposit];
        const debitBalance = this.props.tokenByAddress[debitToken.address].balance;
        const debitAllowance = this.props.tokenByAddress[debitToken.address].allowance;
        const receiveAmount = this.props.sideToAssetToken[Side.receive].amount;
        if (!_.isUndefined(debitToken.amount) && !_.isUndefined(receiveAmount) &&
            debitToken.amount.gt(0) && receiveAmount.gt(0) &&
            this.props.userAddress !== '' &&
            debitBalance.gte(debitToken.amount) && debitAllowance.gte(debitToken.amount)) {
            const didSignSuccessfully = await this.signTransactionAsync();
            if (didSignSuccessfully) {
                this.setState({
                    globalErrMsg: '',
                    shouldShowIncompleteErrs: false,
                });
            }
            return didSignSuccessfully;
        } else {
            let globalErrMsg = 'You must fix the above errors in order to generate a valid order';
            if (this.props.userAddress === '') {
                globalErrMsg = 'You must enable wallet communication';
                this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            }
            this.setState({
                globalErrMsg,
                shouldShowIncompleteErrs: true,
            });
            return false;
        }
    }
    private async signTransactionAsync(): Promise<boolean> {
        this.setState({
            signingState: SigningState.SIGNING,
        });
        const exchangeContractAddr = this.props.blockchain.getExchangeContractAddressIfExists();
        if (_.isUndefined(exchangeContractAddr)) {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            this.setState({
                isSigning: false,
            });
            return false;
        }
        const hashData = this.props.hashData;
        const finalOrderExpiryTimestamp = this.addRandomizedSecondsToAvoidOrderCollisions(
          hashData.orderExpiryTimestamp,
        );
        this.props.dispatcher.updateOrderExpiry(finalOrderExpiryTimestamp);
        const orderHash = zeroEx.getOrderHash(exchangeContractAddr, hashData.orderMakerAddress,
                        hashData.orderTakerAddress, hashData.depositTokenContractAddr,
                        hashData.receiveTokenContractAddr, hashData.feeRecipientAddress,
                        hashData.depositAmount, hashData.receiveAmount, hashData.makerFee,
                        hashData.takerFee, finalOrderExpiryTimestamp);

        let globalErrMsg = '';
        try {
            const signatureData = await this.props.blockchain.sendSignRequestAsync(orderHash);
            const order = utils.generateOrder(this.props.sideToAssetToken,
                                                  finalOrderExpiryTimestamp,
                                                  this.props.orderTakerAddress,
                                                  this.props.userAddress, signatureData,
                                                  this.props.tokenByAddress);
            const validationResult = this.validator.validate(order, orderSchema);
            if (validationResult.errors.length > 0) {
                globalErrMsg = 'Order signing failed. Please refresh and try again';
                utils.consoleLog(`Unexpected error occured: Order validation failed:
                                  ${validationResult.errors}`);
            }
        } catch (err) {
            const errMsg = '' + err;
            if (_.includes(errMsg, 'User denied message')) {
                globalErrMsg = 'User denied sign request';
            } else {
                globalErrMsg = 'An unexpected error occured. Please try refreshing the page';
                utils.consoleLog(`Unexpected error occured: ${err}`);
                await errorReporter.reportAsync(err);
            }
        }
        this.setState({
            signingState: globalErrMsg === '' ? SigningState.SIGNED : SigningState.UNSIGNED,
            globalErrMsg,
        });
        return globalErrMsg === '';
    }
    // HACK:
    // Currently identical 0x orders will have identical orderHashes and will be treated as the same
    // order by the Exchange smart contract. This means a user cannot generate two identical orders and
    // expect them both to be fillable. The only way to accomplish this is to modify slightly the expiration
    // or amounts of the two orders.
    // In order to allow someone to generate two 'almost' identical orders that can both be filled,
    // we currently randomize the number of seconds in the order's expiration.
    private addRandomizedSecondsToAvoidOrderCollisions(expiryTimestamp: number) {
      const minInclusive = 0;
      const maxInclusive = 59;
      const randomSeconds = Math.floor(Math.random() * (maxInclusive - minInclusive + 1)) + minInclusive;
      const finalTimestamp = expiryTimestamp + randomSeconds;
      return finalTimestamp;
    }
}