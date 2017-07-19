import * as _ from 'lodash';
import * as React from 'react';
import * as DocumentTitle from 'react-document-title';
import {DefaultPlayer as Video} from 'react-html5video';
import {utils} from 'ts/utils/utils';
import {Footer} from 'ts/components/footer';
import {TopBar} from 'ts/components/top_bar';
import {Distribution} from 'ts/pages/token_launch/distribution';
import {KeyDates} from 'ts/pages/token_launch/key_dates';
import {Partnerships} from 'ts/pages/home/partnerships';
import {NewsletterInput} from 'ts/pages/home/newsletter_input';
import {Fact, ScreenWidths} from 'ts/types';

const THROTTLE_TIMEOUT = 100;

const TOKEN_FACTS: Fact[] = [
    {
        image: '/images/non_rent_seeking.png',
        title: 'Non rent-seeking',
        explanation: '0x protocol is free to use. Only pay fees to the exchanges built on top of it.',
    },
    {
        image: '/images/zrx_ballot.png',
        title: 'Built-in governance',
        explanation: 'ZRX stakeholders will be responsible for voting on protocol upgrades.',
    },
    {
        image: '/images/liquidity_pool.png',
        title: 'Open and permissionless',
        explanation: '0x protocol enables a diverse ecosystem of exchanges run by anyone, anywhere.',
    },
];

export interface TokenLaunchProps {
    location: Location;
    screenWidth: ScreenWidths;
}

interface TokenLaunchState {
    screenWidth: ScreenWidths;
}

export class TokenLaunch extends React.Component<TokenLaunchProps, TokenLaunchState> {
    private throttledScreenWidthUpdate: () => void;
    constructor(props: TokenLaunchProps) {
        super(props);
        this.state = {
            screenWidth: undefined,
        };
        this.throttledScreenWidthUpdate = _.throttle(this.updateScreenWidth.bind(this), THROTTLE_TIMEOUT);
    }
    public componentWillMount() {
        window.scrollTo(0, 0);
        this.updateScreenWidth();
    }
    public componentDidMount() {
        window.addEventListener('resize', this.throttledScreenWidthUpdate);
    }
    public componentWillUnmount() {
        window.removeEventListener('resize', this.throttledScreenWidthUpdate);
    }
    public render() {
        const isUserOnMobile = utils.isUserOnMobile();
        return (
            <div>
                <DocumentTitle title="0x Token Launch"/>
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                />
                <div className="pt3">
                    <div className="mx-auto max-width-4 center pt2 mt2" style={{color: '#5D5D5D'}}>
                        <div className="mx-auto center">
                            <div className="mt4" style={{fontSize: 42, color: '#292929'}}>
                                <span className="robotoMono">0</span>x Token Launch
                            </div>
                        </div>
                        <div
                            className="pt1 pb4"
                            style={{fontSize: 18, color: '#B4B4B4'}}
                        >
                            Registration begins August 9
                        </div>
                        <div className="mx-auto pb2">
                            <img
                                src="/images/zrx_token.png"
                                style={{width: 150}}
                            />
                        </div>
                        <div
                            className="relative pt2 mx-auto sm-px3"
                            style={{maxWidth: 308, height: 145}}
                        >
                            <div className="absolute" style={{maxWidth: 308}}>
                                <div style={{textAlign: 'left', fontSize: 14}}>
                                    Receive notifications about registration & launch
                                </div>
                                <div className="pt1">
                                    <NewsletterInput
                                        buttonBackgroundColor="#575757"
                                        buttonLabelColor="white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <KeyDates
                        key={`keyDates-${this.state.screenWidth}`}
                        screenWidth={this.state.screenWidth}
                    />
                    <div
                        className="lg-py4 md-py4 sm-pt1 sm-pb4"
                        style={{backgroundColor: isUserOnMobile ? 'rgb(29, 29, 29)' : '#202020'}}
                    >
                        <div className="mx-auto max-width-4 center">
                            <div className="lg-px4 md-px4 sm-px0 lg-mx4 md-mx4 sm-mx0 clearfix">
                                <div
                                    className="col lg-col-6 md-col-6 col-12 center"
                                    style={{color: 'white', height: 268}}
                                >
                                    <div
                                        className="mx-auto relative lg-left-align md-left-align"
                                        style={{width: 315, transform: 'translateY(-50%)', top: '50%'}}
                                    >
                                        <div style={{fontSize: 30}}>
                                            Fueling trades
                                        </div>
                                        <div
                                            className="pt2 lg-left-align md-left-align"
                                            style={{color: '#D8D8D8', lineHeight: 1.6}}
                                        >
                                            0x tokens (ZRX) fuel{' '}
                                            trading activity across a global network of decentralized{' '}
                                            exchanges.
                                        </div>
                                    </div>
                                </div>
                                <div className="col lg-col-6 md-col-6 col-12 center">
                                    <div style={{maxWidth: 400}}>
                                        {isUserOnMobile ?
                                            <img className="p1" src="/gifs/atom_relay.gif" /> :
                                            <div style={{pointerEvents: 'none'}}>
                                                <Video
                                                    width={300}
                                                    autoPlay={true}
                                                    loop={true}
                                                    muted={true}
                                                    controls={[]}
                                                    poster="/images/atom_relay.png"
                                                >
                                                    <source src="/videos/atom_relay.mp4" type="video/mp4" />
                                                </Video>
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        className="py4"
                        style={{backgroundColor: '#262626'}}
                    >
                        <div className="clearfix mx-auto max-width-4 center">
                            {this.renderTokenFacts()}
                        </div>
                    </div>
                    <Distribution />
                    <Partnerships shouldCenterAlignTitle={true} />
                </div>
                <Footer />
            </div>
        );
    }
    private renderTokenFacts() {
        const facts = _.map(TOKEN_FACTS, (fact: Fact) => {
            return (
                <div
                    key={`fact-${fact.title}`}
                    className="col lg-col-4 md-col-4 col-12 sm-pb4"
                >
                    <div className="pb3">
                        <img
                            style={{height: 100, width: 100}}
                            src={fact.image}
                        />
                    </div>
                    <div
                        className="mx-auto lg-left-align md-left-align"
                        style={{color: 'white', width: 256}}
                    >
                        <div className="h3 pb2">
                            {fact.title}
                        </div>
                        <div style={{fontSize: 14, lineHeight: 1.6}}>
                            {fact.explanation}
                        </div>
                    </div>
                </div>
            );
        });
        return facts;
    }
    private updateScreenWidth() {
        const newScreenWidth = utils.getScreenWidth();
        this.setState({
            screenWidth: newScreenWidth,
        });
    }
}
