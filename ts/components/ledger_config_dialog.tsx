import * as _ from 'lodash';
import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import {LifeCycleRaisedButton} from 'ts/components/ui/lifecycle_raised_button';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import {
    Table,
    TableBody,
    TableHeader,
    TableRow,
    TableHeaderColumn,
    TableRowColumn,
} from 'material-ui/Table';
import {colors} from 'material-ui/styles';
import {utils} from 'ts/utils/utils';
import {constants} from 'ts/utils/constants';
import {Blockchain} from 'ts/blockchain';
import {Dispatcher} from 'ts/redux/dispatcher';

const VALID_ETHEREUM_DERIVATION_PATH_PREFIX = `44'/60'`;

enum LedgerSteps {
    CONNECT,
    SELECT_ADDRESS,
}

interface LedgerConfigDialogProps {
    isOpen: boolean;
    toggleDialogFn: (isOpen: boolean) => void;
    dispatcher: Dispatcher;
    blockchain: Blockchain;
}

interface LedgerConfigDialogState {
    didConnectFail: boolean;
    stepIndex: LedgerSteps;
    userAddresses: string[];
    addressBalances: BigNumber.BigNumber[];
    derivationPath: string;
    derivationErrMsg: string;
}

export class LedgerConfigDialog extends React.Component<LedgerConfigDialogProps, LedgerConfigDialogState> {
    constructor(props: LedgerConfigDialogProps) {
        super(props);
        this.state = {
            didConnectFail: false,
            stepIndex: LedgerSteps.CONNECT,
            userAddresses: [],
            addressBalances: [],
            derivationPath: constants.DEFAULT_DERIVATION_PATH,
            derivationErrMsg: '',
        };
    }
    public render() {
        const dialogActions = [
            <FlatButton
                label="Cancel"
                onTouchTap={this.props.toggleDialogFn.bind(this.props.toggleDialogFn, false)}
            />,
        ];
        const dialogTitle = this.state.stepIndex === LedgerSteps.CONNECT ?
                            'Connect to your Ledger' :
                            'Select desired address';
        return (
            <Dialog
                title={dialogTitle}
                titleStyle={{fontWeight: 100}}
                actions={dialogActions}
                open={this.props.isOpen}
                onRequestClose={this.props.toggleDialogFn.bind(this.props.toggleDialogFn, false)}
                autoScrollBodyContent={true}
            >
                <div className="pt2" style={{color: colors.grey700}}>
                    {this.state.stepIndex === LedgerSteps.CONNECT &&
                        this.renderConnectStep()
                    }
                    {this.state.stepIndex === LedgerSteps.SELECT_ADDRESS &&
                        this.renderSelectAddressStep()
                    }
                </div>
            </Dialog>
        );
    }
    private renderSelectAddressStep() {
        return (
            <div>
                <div>
                    <Table
                        bodyStyle={{height: 300}}
                        onRowSelection={this.onAddressSelected.bind(this)}
                    >
                        <TableHeader displaySelectAll={false}>
                            <TableRow>
                                <TableHeaderColumn>Address</TableHeaderColumn>
                                <TableHeaderColumn>Balance</TableHeaderColumn>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {this.renderAddressTableRows()}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex pt2" style={{height: 100}}>
                    <div>
                        <TextField
                            floatingLabelFixed={true}
                            floatingLabelStyle={{color: colors.grey500}}
                            floatingLabelText="Update path derivation"
                            value={this.state.derivationPath}
                            errorText={this.state.derivationErrMsg}
                            onChange={this.onDerivationPathChanged.bind(this)}
                        />
                    </div>
                    <div className="pl2" style={{paddingTop: 28}}>
                        <LifeCycleRaisedButton
                            labelReady="Update"
                            labelLoading="Updating..."
                            labelComplete="Updated!"
                            onClickAsyncFn={this.onFetchAddressesForDerivationPathAsync.bind(this, true)}
                        />
                    </div>
                </div>
            </div>
        );
    }
    private renderAddressTableRows() {
        const rows = _.map(this.state.userAddresses, (userAddress: string, i: number) => {
            const balance = this.state.addressBalances[i];
            return (
                <TableRow key={userAddress} style={{height: 40}}>
                    <TableRowColumn>{userAddress}</TableRowColumn>
                    <TableRowColumn>{balance.toString()} ETH</TableRowColumn>
                </TableRow>
            );
        });
        return rows;
    }
    private renderConnectStep() {
        return (
            <div>
                <div className="h4">
                    Follow these instructions before proceeding
                </div>
                <ol>
                    <li className="pb1">
                        Connect your Ledger Nano S & Open the Ethereum application
                    </li>
                    <li className="pb1">
                        Verify that Browser Support is enabled in Settings
                    </li>
                    <li className="pb1">
                        If no Browser Support is found in settings, verify that you have{' '}
                        <a href="https://www.ledgerwallet.com/apps/manager" target="_blank">Firmware >1.2</a>
                    </li>
                </ol>
                <div className="center">
                    <LifeCycleRaisedButton
                        labelReady="Connect to Ledger"
                        labelLoading="Connecting..."
                        labelComplete="Connected!"
                        onClickAsyncFn={this.onConnectLedgerClickAsync.bind(this, true)}
                    />
                    {this.state.didConnectFail &&
                        <div>
                            Failed to connect. Follow the instructions and try again.
                        </div>
                    }
                </div>
            </div>
        );
    }
    private onAddressSelected(selectedRowIndexes: number[]) {
        const selectedRowIndex = selectedRowIndexes[0];
        this.props.blockchain.updateLedgerDerivationIndex(selectedRowIndex);
        const selectedAddress = this.state.userAddresses[selectedRowIndex];
        this.props.dispatcher.updateUserAddress(selectedAddress);
        const isOpen = false;
        this.setState({
            stepIndex: LedgerSteps.CONNECT,
        });
        this.props.toggleDialogFn(isOpen);
    }
    private async onFetchAddressesForDerivationPathAsync() {
        const currentlySetPath = this.props.blockchain.getLedgerDerivationPathIfExists();
        if (currentlySetPath === this.state.derivationPath) {
            return;
        }
        this.props.blockchain.updateLedgerDerivationPath(this.state.derivationPath);
        const didSucceed = await this.fetchAddressesAndBalancesAsync();
        return didSucceed;
    }
    private async fetchAddressesAndBalancesAsync() {
        let userAddresses: string[];
        const addressBalances: BigNumber.BigNumber[] = [];
        try {
            userAddresses = await this.getUserAddressesAsync();
            for (const address of userAddresses) {
                const balance = await this.props.blockchain.getBalanceInEthAsync(address);
                addressBalances.push(balance);
            }
        } catch (err) {
            utils.consoleLog(`Ledger error: ${JSON.stringify(err)}`);
            this.setState({
                didConnectFail: true,
            });
            return false;
        }
        this.setState({
            userAddresses,
            addressBalances,
        });
        return true;
    }
    private onDerivationPathChanged(e: any, derivationPath: string) {
        let derivationErrMsg = '';
        if (!_.startsWith(derivationPath, VALID_ETHEREUM_DERIVATION_PATH_PREFIX)) {
            derivationErrMsg = 'Must be a valid Ethereum derivation path.';
        }

        this.setState({
            derivationPath,
            derivationErrMsg,
        });
    }
    private async onConnectLedgerClickAsync() {
        const didSucceed = await this.fetchAddressesAndBalancesAsync();
        if (didSucceed) {
            // HACK: We transition to the next view after a timeout so that the
            // LifeCycleRaisedButton component can properly transition to it's
            // final state before being unmounted.
            window.setTimeout(() => {
                this.setState({
                    stepIndex: LedgerSteps.SELECT_ADDRESS,
                });
            }, 400);
        }
        return didSucceed;
    }
    private async getUserAddressesAsync(): Promise<string[]> {
        let userAddresses: string[];
        userAddresses = await this.props.blockchain.getUserAccountsAsync();

        if (_.isEmpty(userAddresses)) {
            throw new Error('No addresses retrieved.');
        }
        return userAddresses;
    }
}
