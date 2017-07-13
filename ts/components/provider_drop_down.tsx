import * as _ from 'lodash';
import * as React from 'react';
import {colors} from 'material-ui/styles';
import Dialog from 'material-ui/Dialog';
import MenuItem from 'material-ui/MenuItem';
import DropDownMenu from 'material-ui/DropDownMenu';
import FlatButton from 'material-ui/FlatButton';
import {utils} from 'ts/utils/utils';
import {Dispatcher} from 'ts/redux/dispatcher';
import {ProviderType} from 'ts/types';

const LEDGER_NAME = 'Ledger Nano S';

interface ProviderDropDownProps {
    dispatcher: Dispatcher;
    initialProviderType: ProviderType;
    injectedProviderName: string;
}

interface ProviderDropDownState {
    selectedProviderType: ProviderType;
    isU2FDialogOpen: boolean;
}

export class ProviderDropDown extends React.Component<ProviderDropDownProps, ProviderDropDownState> {
    private initialInjectedWeb3ProviderName: string;
    constructor(props: ProviderDropDownProps) {
        super(props);
        this.state = {
            selectedProviderType: props.initialProviderType,
            isU2FDialogOpen: false,
        };
    }
    public render() {
        return (
            <div className="mx-auto" style={{width: 120}}>
                <DropDownMenu
                    maxHeight={300}
                    value={this.state.selectedProviderType}
                    onChange={this.updateSelectedProviderAsync.bind(this)}
                >
                    {this.renderDropDownItems()}
                </DropDownMenu>
                <Dialog
                    title="U2F Not Supported"
                    titleStyle={{fontWeight: 100}}
                    actions={[
                        <FlatButton
                            label="Ok"
                            onTouchTap={this.onToggleU2FDialog.bind(this)}
                        />,
                    ]}
                    open={this.state.isU2FDialogOpen}
                    onRequestClose={this.onToggleU2FDialog.bind(this)}
                    autoScrollBodyContent={true}
                >
                    <div className="pt2" style={{color: colors.grey700}}>
                        <div>
                            It looks like your browser does not support U2F connections
                            required for us to communicate with your hardware wallet.
                            Please use a browser that supports U2F connections and try
                            again.
                        </div>
                        <div>
                            <ul>
                                <li className="pb1">Chrome version 38 or later</li>
                                <li className="pb1">Opera version 40 of later</li>
                                <li>
                                    Firefox with{' '}
                                    <a
                                        href="https://addons.mozilla.org/en-US/firefox/addon/u2f-support-add-on/"
                                        target="_blank"
                                        style={{textDecoration: 'underline'}}
                                    >
                                        this extension
                                    </a>.
                                </li>
                            </ul>
                        </div>
                    </div>
                </Dialog>
            </div>
        );
    }
    private onToggleU2FDialog() {
        this.setState({
            isU2FDialogOpen: !this.state.isU2FDialogOpen,
        });
    }
    private renderDropDownItems() {
        const providerNameByType: {[type: number]: string} = {
            [ProviderType.INJECTED]: this.props.injectedProviderName,
            [ProviderType.LEDGER]: LEDGER_NAME,
        };
        const items = _.map(providerNameByType, (providerName: string, providerType: ProviderType) => {
            console.log('providerName', providerName);
            return (
                <MenuItem
                    key={`provider-${providerName}`}
                    value={providerType}
                    primaryText={providerName}
                />
            );
        });
        return items;
    }
    private async updateSelectedProviderAsync(e: any, index: number, value: string) {
        const providerType = value as ProviderType;
        const isU2FSupported = await utils.isU2FSupportedAsync();
        if (!isU2FSupported && providerType === ProviderType.LEDGER) {
            this.setState({
                isU2FDialogOpen: true,
            });
            return;
        }

        this.setState({
            selectedProviderType: providerType,
        });
        this.props.dispatcher.updateProviderType(providerType);
    }
}
