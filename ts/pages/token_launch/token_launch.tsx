import * as _ from 'lodash';
import * as React from 'react';
import * as DocumentTitle from 'react-document-title';
import RaisedButton from 'material-ui/RaisedButton';
import {DefaultPlayer as Video} from 'react-html5video';
import {utils} from 'ts/utils/utils';
import {configs} from 'ts/utils/configs';
import {Footer} from 'ts/components/footer';
import {TopBar} from 'ts/components/top_bar';
import {Distribution} from 'ts/pages/token_launch/distribution';
import {KeyDates} from 'ts/pages/token_launch/key_dates';
import {Partnerships} from 'ts/pages/home/partnerships';
import {NewsletterInput} from 'ts/pages/home/newsletter_input';
import {Fact, ScreenWidths, BlogPost} from 'ts/types';

const THROTTLE_TIMEOUT = 100;
const CUSTOM_DARK_GRAY = '#575757';

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

const BLOG_POSTS: BlogPost[] = [
    {
        image: '/images/blog/tutorial_blog_post.png',
        title: 'Tutorials for the 0x Token Sale Registration',
        description: 'Detailed tutorials for registration using MetaMask, Parity Signer and Ledger',
        date: 'Aug 9th',
        url: 'https://blog.0xproject.com/tutorials-for-the-0x-token-sale-registration-766064955d12',
    },
    {
        image: '/images/blog/scams_blog_post.png',
        title: 'A Note on Scams and Phishing Attempts',
        description: 'Always verify instructions via official 0x communication channels',
        date: 'Aug 8th',
        url: 'https://blog.0xproject.com/a-note-on-scams-and-phishing-attempts-e2d72577a470',
    },
    {
        image: '/images/blog/registration_blog_post.png',
        title: '0x Token Sale and Registration Details',
        description: 'Registration Requirements and Sale Overview',
        date: 'Aug 5th',
        url: 'https://blog.0xproject.com/0x-token-sale-and-registration-details-75d84af11c60',
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
                <DocumentTitle title="0x Token Sale"/>
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                />
                <div className="pt3">
                    <div className="mx-auto max-width-4 center pt2 mt2" style={{color: '#5D5D5D'}}>
                        <div className="mx-auto center">
                            <div className="mt4" style={{fontSize: 55, color: '#292929'}}>
                                <span className="robotoMono">0</span>x Token Sale
                            </div>
                        </div>
                        <div
                            className="pt1 pb4"
                            style={{fontSize: 18, color: '#B4B4B4'}}
                        >
                            Registration is now open. Sale begins August 15 8AM PST
                        </div>
                        <div className="mx-auto pb1">
                            <img
                                src="/images/zrx_token.png"
                                style={{width: 150}}
                            />
                        </div>
                        <div
                            className="relative pt2 mx-auto sm-px3"
                            style={{maxWidth: 308, height: 145}}
                        >
                            {configs.IS_REGISTRATION_OPEN ?
                                <div>
                                    <RaisedButton
                                        label="Register for the sale"
                                        primary={true}
                                        onClick={this.onRegisterClick.bind(this)}
                                        buttonStyle={{paddingLeft: 22, paddingRight: 22}}
                                    />
                                    <div className="pt2" style={{fontSize: 13}}>
                                        Registration is required to purchase ZRX
                                    </div>
                                </div> :
                                <div className="absolute" style={{maxWidth: 308}}>
                                    <div style={{textAlign: 'left', fontSize: 14}}>
                                        Receive notifications about registration & launch
                                    </div>
                                    <div className="pt1">
                                        <NewsletterInput
                                            buttonBackgroundColor={CUSTOM_DARK_GRAY}
                                            buttonLabelColor="white"
                                        />
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                    <KeyDates
                        key={`keyDates-${this.state.screenWidth}`}
                        screenWidth={this.state.screenWidth}
                    />
                    <div
                        className="lg-py3 md-py3 sm-pt1 sm-pb3"
                        style={{backgroundColor: 'white'}}
                    >
                        <div className="mx-auto max-width-4 center">
                            <h1 className="thin pb3">RECENT BLOG POSTS</h1>
                            <div>
                                {this.renderBlogPosts()}
                            </div>
                        </div>
                    </div>
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
                                    <div style={{maxWidth: 400, height: 383, overflow: 'hidden'}}>
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
    private renderBlogPosts() {
        const posts = _.map(BLOG_POSTS, post => {
            return (
                <div
                    key={post.title}
                    className="clearfix mx-auto pb3"
                    style={{maxWidth: 570}}
                >
                    <a href={post.url} target="_blank">
                        <div className="col lg-col-3 md-col-3 col-12">
                            <img src={post.image} style={{width: 130}} />
                        </div>
                        <div
                            className="col lg-col-9 md-col-9 col-12 sm-pr3 sm-pl4 left-align lg-pl2 md-pl2"
                            style={{color: '#808080'}}
                        >
                            <div className="pb1" style={{fontSize: 12}}>
                                {post.date}
                            </div>
                            <div className="pb1" style={{fontSize: 14, color: '#252525'}}>
                                {post.title}
                            </div>
                            <div style={{fontSize: 12}}>
                                {post.description}
                            </div>
                        </div>
                    </a>
                </div>
            );
        });
        return posts;
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
    private onRegisterClick() {
        window.location.href = configs.QUEUE_IT_URL;
    }
    private updateScreenWidth() {
        const newScreenWidth = utils.getScreenWidth();
        this.setState({
            screenWidth: newScreenWidth,
        });
    }
}
