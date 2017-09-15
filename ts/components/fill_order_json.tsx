import * as _ from 'lodash';
import * as React from 'react';
import * as BigNumber from 'bignumber.js';
import {ZeroEx} from '0x.js';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import {Side, TokenByAddress} from 'ts/types';
import {utils} from 'ts/utils/utils';
import {Blockchain} from 'ts/blockchain';
import {constants} from 'ts/utils/constants';

interface FillOrderJSONProps {
    blockchain: Blockchain;
    tokenByAddress: TokenByAddress;
    networkId: number;
    orderJSON: string;
    onFillOrderJSONChanged: (event: any) => void;
}

interface FillOrderJSONState {}

export class FillOrderJSON extends React.Component<FillOrderJSONProps, FillOrderJSONState> {
    public render() {
        const tokenAddresses = _.keys(this.props.tokenByAddress);
        const exchangeContract = this.props.blockchain.getExchangeContractAddressIfExists();
        const hintSideToAssetToken = {
            [Side.deposit]: {
                amount: new BigNumber(35),
                address: tokenAddresses[0],
            },
            [Side.receive]: {
                amount: new BigNumber(89),
                address: tokenAddresses[1],
            },
        };
        const hintOrderExpiryTimestamp = utils.initialOrderExpiryUnixTimestampSec();
        const hintSignatureData = {
            hash: '0xf965a9978a0381ab58f5a2408ad967c...',
            r: '0xf01103f759e2289a28593eaf22e5820032...',
            s: '937862111edcba395f8a9e0cc1b2c5e12320...',
            v: 27,
        };
        const hintSalt = ZeroEx.generatePseudoRandomSalt();
        const hintOrder = utils.generateOrder(this.props.networkId, exchangeContract, hintSideToAssetToken,
                                              hintOrderExpiryTimestamp, '', '', constants.MAKER_FEE,
                                              constants.TAKER_FEE, constants.FEE_RECIPIENT_ADDRESS,
                                              hintSignatureData, this.props.tokenByAddress, hintSalt);
        const hintOrderJSON = `${JSON.stringify(hintOrder, null, '\t').substring(0, 500)}...`;
        return (
            <div>
                <Paper className="p1 overflow-hidden" style={{height: 164}}>
                    <TextField
                        id="orderJSON"
                        hintStyle={{bottom: 0, top: 0}}
                        fullWidth={true}
                        value={this.props.orderJSON}
                        onChange={this.props.onFillOrderJSONChanged.bind(this)}
                        hintText={hintOrderJSON}
                        multiLine={true}
                        rows={6}
                        rowsMax={6}
                        underlineStyle={{display: 'none'}}
                        textareaStyle={{marginTop: 0}}
                    />
                </Paper>
            </div>
        );
    }
}
