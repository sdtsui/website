import * as _ from 'lodash';
import * as React from 'react';
import {utils} from 'ts/utils/utils';
import {colors} from 'material-ui/styles';
import {constants} from 'ts/utils/constants';
import {configs} from 'ts/utils/configs';
import {TextField, Paper} from 'material-ui';
import {CopyIcon} from 'ts/components/ui/copy_icon';
import {SideToAssetToken, SignatureData, Order, TokenByAddress} from 'ts/types';
import {errorReporter} from 'ts/utils/error_reporter';
import BigNumber = require('bignumber.js');

interface OrderJSONProps {
    exchangeContractIfExists: string;
    orderExpiryTimestamp: BigNumber;
    orderSignatureData: SignatureData;
    orderTakerAddress: string;
    orderMakerAddress: string;
    orderSalt: BigNumber;
    orderMakerFee: BigNumber;
    orderTakerFee: BigNumber;
    orderFeeRecipient: string;
    networkId: number;
    sideToAssetToken: SideToAssetToken;
    tokenByAddress: TokenByAddress;
}

interface OrderJSONState {}

export class OrderJSON extends React.Component<OrderJSONProps, OrderJSONState> {
    public render() {
        const order = utils.generateOrder(this.props.networkId, this.props.exchangeContractIfExists,
                                          this.props.sideToAssetToken, this.props.orderExpiryTimestamp,
                                          this.props.orderTakerAddress, this.props.orderMakerAddress,
                                          this.props.orderMakerFee, this.props.orderTakerFee,
                                          this.props.orderFeeRecipient, this.props.orderSignatureData,
                                          this.props.tokenByAddress, this.props.orderSalt);
        const orderJSON = JSON.stringify(order);
        return (
            <div>
                <div className="pb2">
                    You have successfully generated and cryptographically signed an order! The{' '}
                    following JSON contains the order parameters and cryptographic signature that{' '}
                    your counterparty will need to execute a trade with you.
                </div>
                <div className="pb2 flex">
                    <div
                        className="inline-block pl1"
                        style={{top: 1}}
                    >
                        <CopyIcon data={orderJSON} callToAction="Copy" />
                    </div>
                </div>
                <Paper className="center overflow-hidden">
                    <TextField
                        id="orderJSON"
                        style={{width: 710}}
                        value={JSON.stringify(order, null, '\t')}
                        multiLine={true}
                        rows={2}
                        rowsMax={8}
                        underlineStyle={{display: 'none'}}
                    />
                </Paper>
                <div className="pt3 pb2 center">
                    <div>
                        Share your signed order with someone willing to fill it
                    </div>
                    <div className="mx-auto pt2 flex" style={{width: 91}}>
                        <div>
                            <i
                                style={{cursor: 'pointer', fontSize: 29}}
                                onClick={this.shareViaFacebook.bind(this)}
                                className="zmdi zmdi-facebook-box"
                            />
                        </div>
                        <div className="pl1" style={{position: 'relative', width: 28}}>
                            <i
                                style={{cursor: 'pointer', fontSize: 32, position: 'absolute', top: -2, left: 8}}
                                onClick={this.shareViaEmailAsync.bind(this)}
                                className="zmdi zmdi-email"
                            />
                        </div>
                        <div className="pl1">
                            <i
                                style={{cursor: 'pointer', fontSize: 29}}
                                onClick={this.shareViaTwitterAsync.bind(this)}
                                className="zmdi zmdi-twitter-box"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    private async shareViaTwitterAsync() {
        const shareLink = await this.generateShareLinkAsync();
        const tweetText = encodeURIComponent(`Fill my order using the 0x protocol: ${shareLink}`);
        window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, 'Share your order', 'width=500,height=400');
    }
    private async shareViaFacebook() {
        const shareLink = this.getOrderUrl();
        (window as any).FB.ui({
            display: 'popup',
            href: shareLink,
            method: 'share',
        }, _.noop);
    }
    private async shareViaEmailAsync() {
        const shareLink = await this.generateShareLinkAsync();
        const encodedSubject = encodeURIComponent('Let\'s trade using the 0x protocol');
        const encodedBody = encodeURIComponent(`I generated an order with the 0x protocol.
You can see and fill it here: ${shareLink}`);
        const mailToLink = `mailto:mail@example.org?subject=${encodedSubject}&body=${encodedBody}`;
        window.location.href = mailToLink;
    }
    private async generateShareLinkAsync(): Promise<string> {
        const longUrl = encodeURIComponent(this.getOrderUrl());
        const bitlyRequestUrl = constants.BITLY_ENDPOINT + '/v3/shorten?' +
                                     'access_token=' + constants.BITLY_ACCESS_TOKEN +
                                     '&longUrl=' + longUrl;
        const response = await fetch(bitlyRequestUrl);
        const responseBody = await response.text();
        const bodyObj = JSON.parse(responseBody);
        if (response.status !== 200 || bodyObj.status_code !== 200) {
            // TODO: Show error message in UI
            utils.consoleLog(`Unexpected status code: ${response.status} -> ${responseBody}`);
            await errorReporter.reportAsync(new Error(`Bitly returned non-200: ${JSON.stringify(response)}`));
            return '';
        }
        return (bodyObj as any).data.url;
    }
    private getOrderUrl() {
        const order = utils.generateOrder(this.props.networkId, this.props.exchangeContractIfExists,
            this.props.sideToAssetToken, this.props.orderExpiryTimestamp, this.props.orderTakerAddress,
            this.props.orderMakerAddress, this.props.orderMakerFee, this.props.orderTakerFee,
            this.props.orderFeeRecipient, this.props.orderSignatureData, this.props.tokenByAddress,
            this.props.orderSalt);
        const orderJSONString = JSON.stringify(order);
        const orderUrl = `${configs.BASE_URL}/demo/fill?order=${orderJSONString}`;
        return orderUrl;
    }
}
