import * as _ from 'lodash';
import * as React from 'react';
import MenuItem from 'material-ui/MenuItem';
import DropDownMenu from 'material-ui/DropDownMenu';

interface ProviderDropDownProps {
    currentProviderName: string;
}

interface ProviderDropDownState {
    initialInjectedWeb3ProviderName: string;
    selectedWeb3ProviderName: string;
}

export class ProviderDropDown extends React.Component<ProviderDropDownProps, ProviderDropDownState> {
    constructor(props: ProviderDropDownProps) {
        super(props);
        this.state = {
            initialInjectedWeb3ProviderName: props.currentProviderName,
            selectedWeb3ProviderName: props.currentProviderName,
        };
    }
    public render() {
        return (
            <div className="mx-auto" style={{width: 120}}>
                <DropDownMenu
                    maxHeight={300}
                    value={this.state.selectedWeb3ProviderName}
                    onChange={this.updateSelectedProvider.bind(this)}
                >
                    {this.renderDropDownItems()}
                </DropDownMenu>
            </div>
        );
    }
    private renderDropDownItems() {
        const providerNames = [
            this.state.initialInjectedWeb3ProviderName,
            'Ledger Nano S',
        ];
        const items = _.map(providerNames, providerName => {
            return (
                <MenuItem
                    key={providerName}
                    value={providerName}
                    primaryText={providerName}
                />
            );
        });
        return items;
    }
    private updateSelectedProvider(e: any, index: number, value: string) {
        this.setState({
            selectedWeb3ProviderName: value,
        });
        // TODO: update the provider
    }
}
