import * as _ from 'lodash';
import * as React from 'react';
import Paper from 'material-ui/Paper';
import {utils} from 'ts/utils/utils';
import * as DocumentTitle from 'react-document-title';
import {DefaultPlayer as Video} from 'react-html5video';
import 'react-html5video/dist/styles.css';
import {Footer} from 'ts/components/footer';
import {TopBar} from 'ts/components/top_bar';

interface SaleOverProps {
    location: Location;
}

interface SaleOverState {}

export class SaleOver extends React.Component<SaleOverProps, SaleOverState> {
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
                        <h1 className="center">0x Token Sale Over</h1>
                        <div className="center pt2" style={{paddingBottom: 11}}>
                            All of the ZRX tokens have been sold and the sale is now over.
                        </div>
                    </Paper>
                </div>
                <Footer />
            </div>
        );
    }
}
