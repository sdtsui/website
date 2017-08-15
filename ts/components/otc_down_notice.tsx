import * as _ from 'lodash';
import * as React from 'react';
import Paper from 'material-ui/Paper';
import {utils} from 'ts/utils/utils';
import * as DocumentTitle from 'react-document-title';
import {DefaultPlayer as Video} from 'react-html5video';
import 'react-html5video/dist/styles.css';
import {Footer} from 'ts/components/footer';
import {TopBar} from 'ts/components/top_bar';

interface OTCDownNoticeProps {
    location: Location;
}

interface OTCDownNoticeState {}

export class OTCDownNotice extends React.Component<OTCDownNoticeProps, OTCDownNoticeState> {
    public render() {
        const contributeStyle: React.CSSProperties = {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: 'gray',
        };
        return (
            <div style={contributeStyle}>
                <DocumentTitle title="0x Token Sale"/>
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                />
                <div className="pt4 sm-px2 sm-pt2 sm-m1" style={{height: 500}}>
                    <Paper className="mx-auto pt2 pb3" style={{maxWidth: 600}}>
                        <h1 className="center">OTC Temporarily Unavailable</h1>
                        <div className="center pt2" style={{paddingBottom: 11}}>
                            Due to the high load expected during our token sale, OTC is currently unavailable.{' '}
                            Sorry for the inconvenience.
                        </div>
                    </Paper>
                </div>
                <Footer />
            </div>
        );
    }
}
