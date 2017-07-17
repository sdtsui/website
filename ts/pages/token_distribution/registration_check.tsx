import * as _ from 'lodash';
import * as React from 'react';
import {Link} from 'react-router-dom';
import * as DocumentTitle from 'react-document-title';
import {LifeCycleRaisedButton} from 'ts/components/ui/lifecycle_raised_button';
import {TopBar} from 'ts/components/top_bar';
import {Footer} from 'ts/components/footer';
import {IdenticonAddressInput} from 'ts/components/inputs/identicon_address_input';

export interface RegistrationCheckProps {
    location: Location;
}

interface RegistrationCheckState {
    ethereum_address?: string;
    registered?: boolean;
}

export class RegistrationCheck extends React.Component<RegistrationCheckProps, RegistrationCheckState> {
    constructor(props: RegistrationCheckProps) {
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
        return (
            <DocumentTitle title="Registration check">
                <div style={style}>
                    <TopBar
                        blockchainIsLoaded={false}
                        location={this.props.location}
                    />
                    <div
                        className="mx-auto max-width-4 pt4 mt2 sm-px3"
                        style={{maxWidth: 600}}
                    >
                        <div className="lg-h2 md-h2 sm-h4 pb2 thin">
                            Check if your contribution address is registered
                        </div>
                        <IdenticonAddressInput
                            initialAddress={''}
                            label={'Your contribution address'}
                            updateOrderAddress={this.updateOrderAddress.bind(this)}
                        />
                        <div style={{width: 100}} className="right">
                            <LifeCycleRaisedButton
                                isPrimary={true}
                                disabled={_.isUndefined(this.state.ethereum_address)}
                                labelReady={'Check'}
                                labelComplete={'Checked!'}
                                labelLoading={'Checking...'}
                                onClickAsyncFn={this.checkRegistrationStatusAsync.bind(this)}
                            />
                        </div>
                        <div className="pt2">
                            {this.renderRegistrationCheck()}
                        </div>
                    </div>
                    <Footer/>
                </div>
            </DocumentTitle>
        );
    }
    private renderRegistrationCheck(): React.ReactNode {
        if (_.isUndefined(this.state.registered)) {
            return null;
        }
        if (this.state.registered) {
            return (
                <div>
                    Your address is registered!
                </div>
            );
        } else {
            return (
                <div>
                    Your address is not registered.{' '}
                    <Link to="/registration" style={{textDecoration: 'underline'}}>Register it now!</Link>
                </div>
            );
        }
    }
    private updateOrderAddress(ethereum_address: string): void {
        this.setState({
            ethereum_address,
        });
    }
    private async checkRegistrationStatusAsync(): Promise<boolean> {
        try {
            const body = JSON.stringify({
                ethereum_address: this.state.ethereum_address,
            });
            const result = await fetch(
                'http://localhost:3000/contributor_status',
                {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body,
                },
            );
            const jsonResult = await result.json();
            this.setState({
                registered: jsonResult.registered,
            });
            return true;
        } catch (e) {
            return false;
        }
    }
};
