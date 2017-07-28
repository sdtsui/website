import * as _ from 'lodash';
import * as React from 'react';
import * as BigNumber from 'bignumber.js';
import * as moment from 'moment';
import {colors} from 'material-ui/styles';
import {ZeroEx} from '0x.js';
import {utils} from 'ts/utils/utils';
import {Blockchain} from 'ts/blockchain';
import {constants} from 'ts/utils/constants';
import {Footer} from 'ts/components/footer';
import {TopBar} from 'ts/components/top_bar';
import {BlockchainErrs, ProviderType, EtherscanLinkSuffixes} from 'ts/types';
import {Dispatcher} from 'ts/redux/dispatcher';
import {FlashMessage} from 'ts/components/ui/flash_message';
import {BlockchainErrDialog} from 'ts/components/blockchain_err_dialog';
import {EthAmountInput} from 'ts/components/inputs/eth_amount_input';
import {InputLabel} from 'ts/components/ui/input_label';
import {LedgerConfigDialog} from 'ts/components/ledger_config_dialog';
import {U2fNotSupportedDialog} from 'ts/components/u2f_not_supported_dialog';
import {LabeledSwitcher} from 'ts/components/ui/labeled_switcher';
import {Party} from 'ts/components/ui/party';
import {LifeCycleRaisedButton} from 'ts/components/ui/lifecycle_raised_button';
import {SaleStats} from 'ts/pages/token_distribution/sale_stats';
import {Loading} from 'ts/components/ui/loading';
import {tradeHistoryStorage} from 'ts/local_storage/trade_history_storage';

interface CapInfo {
    cap: number;
    startTimestampSec: number;
}
const capSchedule: CapInfo[] = [
    {
        cap: 12,
        startTimestampSec: moment().add(3, 'day').valueOf(),
    },
    {
        cap: 24,
        startTimestampSec: moment().add(6, 'day').valueOf(),
    },
    {
        cap: 1000000,
        startTimestampSec: moment().add(10, 'day').valueOf(),
    },
];

const CUSTOM_GRAY = '#464646';
const CUSTOM_LIGHT_GRAY = '#BBBBBB';

export interface ContributeProps {
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

interface ContributeState {
    contributionAmountInBaseUnits?: BigNumber.BigNumber;
    prevNetworkId: number;
    prevNodeVersion: string;
    prevUserAddress: string;
    prevProviderType: ProviderType;
    prevBlockchainIsLoaded: boolean;
    isLedgerDialogOpen: boolean;
    isU2FDialogOpen: boolean;
    zrxSold: BigNumber.BigNumber;
    zrxToEthExchangeRate?: BigNumber.BigNumber;
    ethContributedAmount?: BigNumber.BigNumber;
}

export class Contribute extends React.Component<ContributeProps, ContributeState> {
    private blockchain: Blockchain;
    constructor(props: ContributeProps) {
        super(props);
        this.state = {
            prevNetworkId: this.props.networkId,
            prevNodeVersion: this.props.nodeVersion,
            prevUserAddress: this.props.userAddress,
            prevProviderType: this.props.providerType,
            prevBlockchainIsLoaded: this.props.blockchainIsLoaded,
            isLedgerDialogOpen: false,
            isU2FDialogOpen: false,
            zrxSold: new BigNumber(0),
        };
    }
    public componentWillMount() {
        this.blockchain = new Blockchain(this.props.dispatcher);
    }
    public componentWillReceiveProps(nextProps: ContributeProps) {
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
        if (nextProps.blockchainIsLoaded && !this.state.prevBlockchainIsLoaded) {
            this.updateTokenSaleInfoFireAndForgetAsync();
            this.updateUserContributedAmountFireAndForgetAsync();
        }
    }
    public render() {
        const contributeStyle: React.CSSProperties = {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: CUSTOM_GRAY,
        };
        const updateShouldBlockchainErrDialogBeOpen = this.props.dispatcher
                .updateShouldBlockchainErrDialogBeOpen.bind(this.props.dispatcher);
        return (
            <div style={contributeStyle}>
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                />
                {this.props.blockchainIsLoaded ?
                  this.renderContributionForm() :
                  <Loading />
                }
                <Footer />
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
                    bodyStyle={{backgroundColor: constants.CUSTOM_BLUE}}
                />
                <LedgerConfigDialog
                    blockchain={this.blockchain}
                    dispatcher={this.props.dispatcher}
                    toggleDialogFn={this.onToggleLedgerDialog.bind(this)}
                    isOpen={this.state.isLedgerDialogOpen}
                />
                <U2fNotSupportedDialog
                    isOpen={this.state.isU2FDialogOpen}
                    onToggleDialog={this.onToggleU2FDialog.bind(this)}
                />
            </div>
        );
    }
    private renderContributionForm() {
      const capIndex = this.findCurrentCapIndex();
      const nextCapInfo = capSchedule[capIndex + 1];
      const labelLeft = this.props.injectedProviderName !== constants.PUBLIC_PROVIDER_NAME ?
                        this.props.injectedProviderName :
                        'Injected Web3';
      const isLedgerProvider = this.props.providerType === ProviderType.LEDGER;
      let ZRXAmountToReceive = 0;
      if (!_.isUndefined(this.state.contributionAmountInBaseUnits)) {
          const contributionETHAmountInUnits = ZeroEx.toUnitAmount(this.state.contributionAmountInBaseUnits, 18);
          const zrxEquivalentAmount = contributionETHAmountInUnits.mul(this.state.zrxToEthExchangeRate);
          ZRXAmountToReceive = Math.round(zrxEquivalentAmount.toNumber() * 100000) / 100000;
      }
      const tokenSaleAddress = this.blockchain.getTokenSaleAddress();
      const etherscanTokenSaleContractUrl = utils.getEtherScanLinkIfExists(tokenSaleAddress,
                                                                           this.props.networkId,
                                                                           EtherscanLinkSuffixes.address);
      return (
        <div className="clearfix max-width-4 mx-auto" style={{paddingTop: 43, width: '64rem'}}>
            <div className="col col-9">
                <div className="mx-auto" style={{width: 460}}>
                    <div className="h2 pt3">Make a contribution</div>
                    <div className="clearfix pt3">
                        <div className="col col-1">
                            {this.renderStepNumber(1)}
                        </div>
                        <div className="col col-11">
                            <div className="h3">Select your wallet:</div>
                            <div className="pt2 pb3 mx-auto" style={{maxWidth: 440}}>
                                <LabeledSwitcher
                                    labelLeft={labelLeft}
                                    labelRight="Ledger Nano S"
                                    isLeftInitiallySelected={!isLedgerProvider}
                                    onLeftLabelClickAsync={this.onInjectedWeb3Click.bind(this)}
                                    onRightLabelClickAsync={this.onLedgerClickAsync.bind(this)}
                                />
                                <div
                                    className="clearfix"
                                    style={{fontSize: 14, color: '#635F5E', paddingTop: 11}}
                                >
                                    <div className="col col-6 center">
                                        <div>
                                            address connected via Web3
                                        </div>
                                        <div>
                                            (i.e{' '}
                                            <a
                                                className="underline"
                                                style={{color: '#635F5E'}}
                                                href={constants.METAMASK_CHROME_STORE_URL}
                                                target="_blank"
                                            >
                                                Metamask
                                            </a>{' '}or{' '}
                                            <a
                                                className="underline"
                                                style={{color: '#635F5E'}}
                                                href={constants.PARITY_CHROME_STORE_URL}
                                                target="_blank"
                                            >
                                                Parity Signer
                                            </a>)
                                        </div>
                                    </div>
                                    <div className="col col-6 center">
                                        Ledger hardware wallet
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="clearfix">
                        <div className="col col-5">
                            <Party
                                label="Your address"
                                address={this.props.userAddress}
                                identiconDiameter={30}
                                identiconStyle={{marginTop: 10, marginBottom: 10}}
                            />
                            <div
                                className="pt1 mx-auto center"
                                style={{fontSize: 12, width: 108}}
                            >
                                ZRX will be instantly sent to this address
                            </div>
                        </div>
                        <div className="col col-2">
                            <div className="mx-auto" style={{width: 17, marginTop: 24}}>
                                <i
                                    style={{fontSize: 54, color: '#DDDDDD'}}
                                    className="zmdi zmdi-chevron-right"
                                />
                            </div>
                        </div>
                        <div className="col col-5">
                            <Party
                                label="ZRX sale address"
                                address={tokenSaleAddress}
                                identiconDiameter={30}
                                identiconStyle={{marginTop: 10, marginBottom: 10}}
                            />
                            <div
                                className="pt1 mx-auto center underline"
                                style={{width: 108, cursor: 'pointer'}}
                            >
                                <a
                                    style={{color: '#00C33E', fontSize: 12}}
                                    href={etherscanTokenSaleContractUrl}
                                    target="_blank"
                                >
                                    Verify source code on Etherscan
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="clearfix pt3">
                        <div className="col col-1">
                            {this.renderStepNumber(2)}
                        </div>
                        <div className="col col-11">
                            <div className="h3">Choose an amount:</div>
                            <div className="clearfix">
                                <div className="col col-6" style={{maxWidth: 220}}>
                                    <EthAmountInput
                                        amount={this.state.contributionAmountInBaseUnits}
                                        balance={new BigNumber(Infinity)}
                                        shouldCheckBalance={false}
                                        shouldShowIncompleteErrs={false}
                                        onChange={this.onContributionAmountChanged.bind(this)}
                                    />
                                </div>
                                {ZRXAmountToReceive !== 0 &&
                                    <div
                                        className="col col-6 pl1"
                                        style={{color: CUSTOM_LIGHT_GRAY, paddingTop: 15}}
                                    >
                                        = {ZRXAmountToReceive} ZRX
                                    </div>
                                }
                            </div>
                            <div style={{fontSize: 13}}>
                                {this.renderCapInfo(capIndex)}
                                <div className="pt1">
                                    <span style={{color: CUSTOM_LIGHT_GRAY}}>
                                        contributed from your address so far:
                                    </span>{' '}
                                    <span style={{color: CUSTOM_GRAY}}>
                                        {_.isUndefined(this.state.ethContributedAmount) ?
                                            '...' :
                                            this.state.ethContributedAmount.toString()
                                        } ETH
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="clearfix pt3">
                        <div className="col col-1">
                            {this.renderStepNumber(3)}
                        </div>
                        <div className="col col-11">
                            <div className="h3 pb2">Verify information and purchase ZRX</div>
                            <LifeCycleRaisedButton
                                labelReady="Purchase ZRX"
                                labelLoading="Purchasing ZRX..."
                                labelComplete="ZRX purchased!"
                                isPrimary={true}
                                isDisabled={_.isEmpty(this.props.userAddress) ||
                                            _.isUndefined(this.state.contributionAmountInBaseUnits)}
                                onClickAsyncFn={this.onPurchaseZRXClickAsync.bind(this)}
                            />
                            <div
                                className="pt2 pb4 center"
                                style={{color: CUSTOM_LIGHT_GRAY, fontSize: 13}}
                            >
                                To avoid issues and phishing scams we highly recommend
                                you check your address, and verify the 0x address with
                                Etherscan before you continue
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col col-3">
                <div className="pt4">
                    <SaleStats
                        zrxSold={this.state.zrxSold}
                        capTimeRemainingSec={_.isUndefined(nextCapInfo) ? 0 : nextCapInfo.startTimestampSec}
                    />
                </div>
            </div>
        </div>
      );
    }
    private renderCapInfo(capIndex: number) {
        const capInfo = capSchedule[capIndex];
        const nextCapInfo = capSchedule[capIndex + 1];
        return (
            <div>
                <div>
                    <span style={{color: CUSTOM_LIGHT_GRAY}}>
                        current contribution cap:
                    </span>{' '}
                    <span style={{color: CUSTOM_GRAY}}>
                        {capInfo.cap} ETH/participant
                    </span>
                </div>
                {this.renderNextCapInfo(nextCapInfo)}
            </div>
        );
    }
    private renderNextCapInfo(nextCapInfo: CapInfo) {
        if (_.isUndefined(nextCapInfo)) {
            return null;
        }
        const nextCapMoment = moment(nextCapInfo.startTimestampSec);
        return (
            <div className="pt1">
                <span style={{color: CUSTOM_LIGHT_GRAY}}>
                    cap increases to{' '}
                    <span style={{color: CUSTOM_GRAY}}>
                        {nextCapInfo.cap} ETH {nextCapMoment.fromNow()}
                    </span>
                </span>
            </div>
        );
    }
    private renderStepNumber(n: number) {
        const numberedCircleStyles = {
            width: 22,
            height: 22,
            color: 'white',
            backgroundColor: 'rgb(216, 216, 216)',
            textAlign: 'center',
            lineHeight: '24px',
            fontSize: 13,
        };
        return (
            <div
                className="circle"
                style={numberedCircleStyles}
            >
                {n}
            </div>
        );
    }
    private async updateUserContributedAmountFireAndForgetAsync() {
        const orderHash = await this.blockchain.getTokenSaleOrderHashAsync();
        const fillsByHash = tradeHistoryStorage.getUserFillsByHash(this.props.userAddress, this.props.networkId);
        const fills = _.values(fillsByHash);
        const tokenSaleFills = _.filter(fills, fill => {
            const isTokenSaleFill = fill.orderHash === orderHash;
            return isTokenSaleFill;
        });
        let ethContributedAmount = new BigNumber(0);
        for (const fill of tokenSaleFills) {
            ethContributedAmount = ethContributedAmount.add(fill.filledMakerTokenAmount);
        }
        this.setState({
            ethContributedAmount,
        });
    }
    private async updateTokenSaleInfoFireAndForgetAsync() {
        const orderHash = await this.blockchain.getTokenSaleOrderHashAsync();
        const ethContributed = await this.blockchain.getFillAmountAsync(orderHash);
        const zrxToEthExchangeRate = await this.blockchain.getTokenSaleExchangeRateAsync();
        const zrxSold = ethContributed.mul(zrxToEthExchangeRate);

        this.setState({
            zrxSold,
            zrxToEthExchangeRate,
        });
    }
    private onContributionAmountChanged(isValid: boolean, contributionAmountInBaseUnits?: BigNumber.BigNumber) {
        this.setState({
            contributionAmountInBaseUnits,
        });
    }
    private onToggleLedgerDialog(isOpen: boolean) {
        this.setState({
            isLedgerDialogOpen: isOpen,
        });
    }
    private onToggleU2FDialog() {
        this.setState({
            isU2FDialogOpen: !this.state.isU2FDialogOpen,
        });
    }
    private async onInjectedWeb3Click(): Promise<boolean> {
        this.props.dispatcher.updateProviderType(ProviderType.INJECTED);
        return true;
    }
    private async onLedgerClickAsync(): Promise<boolean> {
        const isU2FSupported = await utils.isU2FSupportedAsync();
        if (!isU2FSupported) {
            this.setState({
                isU2FDialogOpen: true,
            });
            return false;
        }

        this.props.dispatcher.updateProviderType(ProviderType.LEDGER);
        this.setState({
            isLedgerDialogOpen: true,
        });
        return true;
    }
    private async onPurchaseZRXClickAsync() {
        try {
            const tokenSaleAddress = this.blockchain.getTokenSaleAddress();
            const response = await this.blockchain.tokenSaleFillOrderWithEthAsync(
                this.state.contributionAmountInBaseUnits,
            );
            const transactionHex = 'blah';
            const transactionSuccessMsg = this.renderTransactionSuccessfulMsg(transactionHex);
            this.props.dispatcher.showFlashMessage(transactionSuccessMsg);
            return true;
        } catch (err) {
            utils.consoleLog(`Sending transaction failed: ${err}`);
            this.props.dispatcher.showFlashMessage('Failed to complete transaction. Please try again.');
            return false;
        }
    }
    private renderTransactionSuccessfulMsg(transactionHex: string) {
        const etherscanLink = utils.getEtherScanLinkIfExists(transactionHex, this.props.networkId,
                                                             EtherscanLinkSuffixes.tx);
        return (
            <div>
                Your transaction was successfully mined!{' '}
                <a
                    href={etherscanLink}
                    target="_blank"
                    className="underline"
                    style={{color: 'white'}}
                >
                    View your transaction
                </a>
            </div>
        );
    }
    private findCurrentCapIndex(): number {
        const currentMoment = moment();
        for (let i = 0; i < capSchedule.length; i++) {
            const capInfo = capSchedule[i];
            const startMoment = moment(capInfo.startTimestampSec);
            const isBeforeFirstCap = i === 0 && currentMoment.isBefore(startMoment);
            const isLastCap = i === (capSchedule.length - 1);
            if (isBeforeFirstCap || isLastCap) {
                return i;
            }
            const nextCapInfo = capSchedule[i + 1];
            const stopMoment =  moment(nextCapInfo.startTimestampSec);
            if (currentMoment.isBefore(stopMoment) && startMoment.isBefore(currentMoment)) {
                return i;
            }
        }
    }
}
