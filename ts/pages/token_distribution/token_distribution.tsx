import * as _ from 'lodash';
import * as React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import {Footer} from 'ts/components/footer';
import {TopBar} from 'ts/components/top_bar';
import {Distribution} from 'ts/pages/token_distribution/distribution';
import {KeyDates} from 'ts/pages/token_distribution/key_dates';
import {TeamAndAdvisors} from 'ts/pages/home/team_and_advisors';
import {NewsletterInput} from 'ts/pages/home/newsletter_input';

export interface TokenDistributionProps {
    location: Location;
}

interface TokenDistributionState {}

export class TokenDistribution extends React.Component<TokenDistributionProps, TokenDistributionState> {
    public componentDidMount() {
        window.scrollTo(0, 0);
    }
    public render() {
        return (
            <div>
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                />
                <div className="pt3">
                    <div className="pb4" style={{backgroundColor: 'rgb(39, 39, 39)'}}>
                        <div className="mx-auto max-width-4 center pt3" style={{color: 'white'}}>
                            <div className="thin mt3 mb4" style={{fontSize: 40}}>0x Token Launch</div>
                            <RaisedButton
                                primary={true}
                                label="Register for the token sale"
                                disabled={true}
                            />
                            <div
                                className="pt4 mx-auto"
                                style={{width: 400}}
                            >
                                <div style={{textAlign: 'left'}}>
                                    Get notified when the registration starts
                                </div>
                                <div className="pt1">
                                    <NewsletterInput />
                                </div>
                            </div>
                        </div>
                    </div>
                    <KeyDates />
                    <Distribution />
                    <TeamAndAdvisors />
                </div>
                <Footer />
            </div>
        );
    }
}
