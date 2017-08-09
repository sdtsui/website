import * as _ from 'lodash';
import * as React from 'react';
import {Link} from 'react-router-dom';
import * as DocumentTitle from 'react-document-title';
import {utils} from 'ts/utils/utils';
import {configs} from 'ts/utils/configs';
import {LifeCycleRaisedButton} from 'ts/components/ui/lifecycle_raised_button';
import {TopBar} from 'ts/components/top_bar';
import {Footer} from 'ts/components/footer';
import {IdenticonAddressInput} from 'ts/components/inputs/identicon_address_input';

export interface RegistrationCheckProps {
    location: Location;
}

interface RegistrationCheckState {
    ethereumAddress?: string;
    isRegistered?: boolean;
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
                            Check if your address is registered
                        </div>
                        <IdenticonAddressInput
                            initialAddress={''}
                            label={'Your address'}
                            updateOrderAddress={this.updateOrderAddress.bind(this)}
                        />
                        <div style={{width: 100}} className="right">
                            <LifeCycleRaisedButton
                                isPrimary={true}
                                isDisabled={
                                    _.isUndefined(this.state.ethereumAddress) ||
                                    _.isEmpty(this.state.ethereumAddress)
                                }
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
        if (_.isUndefined(this.state.isRegistered)) {
            return null;
        }
        if (this.state.isRegistered) {
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
    private updateOrderAddress(ethereumAddress: string): void {
        this.setState({
            ethereumAddress,
        });
    }
    private async checkRegistrationStatusAsync(): Promise<boolean> {
        const endpoint = `${configs.BACKEND_BASE_URL}/contributor_status?ethereumAddress=${this.state.ethereumAddress}`;
        try {
            const result = await fetch(
                endpoint,
                {
                    method: 'get',
                },
            );
            const jsonResult = await result.json();
            this.setState({
                isRegistered: jsonResult.registered,
            });
            return true;
        } catch (err) {
            utils.consoleLog(`website backend error: ${err}`);
            return false;
        }
    }
};
