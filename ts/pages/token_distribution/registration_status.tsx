import * as _ from 'lodash';
import * as React from 'react';
import {Link} from 'react-router-dom';
import * as DocumentTitle from 'react-document-title';
import {LifeCycleRaisedButton} from 'ts/components/ui/lifecycle_raised_button';
import {TopBar} from 'ts/components/top_bar';
import {Footer} from 'ts/components/footer';
import {IdenticonAddressInput} from 'ts/components/inputs/identicon_address_input';

export interface RegistrationStatusProps {
    location: Location;
}

interface RegistrationStatusState {
    ethereum_address?: string;
    registered?: boolean;
}

const PUBLIC_NODE_URL = 'https://kovan.0xproject.com';

export class RegistrationStatus extends React.Component<RegistrationStatusProps, RegistrationStatusState> {
    constructor(props: RegistrationStatusProps) {
        super(props);
        this.state = {};
    }
    public render() {
        const style: React.CSSProperties = {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
        };
        const title = 'Check your registration status';
        return (
            <DocumentTitle title={title}>
                <div style={style}>
                    <TopBar
                        blockchainIsLoaded={false}
                        location={this.props.location}
                    />
                    <div
                        className="mx-auto max-width-4"
                        style={{paddingTop: 100, width: 600}}
                    >
                        <h1 className="center" style={{fontWeight: 100}}>{title}</h1>
                        <IdenticonAddressInput
                            initialAddress={''}
                            label={'Your ethereum address'}
                            updateOrderAddress={this.updateOrderAddress.bind(this)}
                        />
                        <div style={{width: 300}} className="right">
                            <LifeCycleRaisedButton
                                isPrimary={true}
                                disabled={_.isUndefined(this.state.ethereum_address)}
                                labelReady={'Check'}
                                labelComplete={'Your address is registered!'}
                                labelLoading={'Checking...'}
                                onClickAsyncFn={this.checkRegistrationStatus.bind(this)}
                            />
                            {this.renderRegistrationStatus()}
                        </div>
                    </div>
                    <Footer/>
                </div>
            </DocumentTitle>
        );
    }
    private renderRegistrationStatus(): React.ReactNode {
        if (_.isUndefined(this.state.registered)) {
            return null;
        }
        if (this.state.registered) {
            return (
                <p>
                    Your address is successfully registered!
                </p>
            );
        } else {
            return (
                <p>
                    Your address is not registered.
                    <br/>
                    <Link to="/registration" style={{textDecoration: 'underline'}}>Register it now!</Link>
                </p>
            );
        }
    }
    private updateOrderAddress(ethereum_address: string): void {
        this.setState({
            ethereum_address,
        });
    }
    private async checkRegistrationStatus(): Promise<boolean> {
        try {
            const address = this.state.ethereum_address;
            const result = await fetch(
                'http://localhost:3000/contributor_status',
                {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ethereum_address: address}),
                },
            );
            const json = await result.json();
            this.setState({
                registered: json.registered,
            });
            return true;
        } catch (e) {
            return false;
        }
    }
};
