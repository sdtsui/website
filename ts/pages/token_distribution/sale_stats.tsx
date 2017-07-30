import * as _ from 'lodash';
import * as React from 'react';
import * as moment from 'moment';
import LinearProgress from 'material-ui/LinearProgress';
import CircularProgress from 'material-ui/CircularProgress';
import {constants} from 'ts/utils/constants';
import {SaleCountdown} from 'ts/pages/token_distribution/sale_countdown';

const CUSTOM_LIGHT_GRAY = '#BBBBBB';

export interface SaleStatsProps {
    isLoading: boolean;
    totalZrxSupply: BigNumber.BigNumber;
    zrxSold: BigNumber.BigNumber;
    capPeriodEnd: number;
}

interface SaleStatsState {}

export class SaleStats extends React.Component<SaleStatsProps, SaleStatsState> {
    public render() {
        const percentRaised = this.props.zrxSold.div(this.props.totalZrxSupply).mul(100);
        const roundedPercentRaised = percentRaised.round().toString();
        const roundedZrxSold = Math.round(this.props.zrxSold.toNumber() * 100000) / 100000;
        return (
            <div
                className="sm-mx-auto"
                style={{color: CUSTOM_LIGHT_GRAY, maxWidth: 230}}
            >
                <div className="pb1 pl1">Crowdsale stats</div>
                <div
                    className="p1 rounded"
                    style={{border: `3px solid #ebebeb`, height: 200}}
                >
                    {this.props.isLoading ?
                        <div className="center pt4 mt2">
                            <CircularProgress size={30} />
                        </div> :
                        <div className="pt3 px1 relative">
                            <div className="absolute" style={{right: 8, top: 7}}>
                                <div style={{fontSize: 12}}>500M Cap</div>
                                <div
                                    className="right"
                                    style={{width: 2, height: 15, backgroundColor: CUSTOM_LIGHT_GRAY}}
                                />
                            </div>
                            <LinearProgress
                                mode="determinate"
                                value={percentRaised.toNumber()}
                                style={{height: 10, backgroundColor: '#ebebeb'}}
                            />
                            <div
                                className="center"
                                style={{color: constants.CUSTOM_BLUE, fontSize: 13, paddingTop: 10}}
                            >
                                {roundedZrxSold} ZRX ({roundedPercentRaised}%) sold
                            </div>
                            <div
                                className="pt3 center"
                                style={{color: CUSTOM_LIGHT_GRAY, fontSize: 12}}
                            >
                                <div>Time remaining</div>
                                <div>(if cap not reached)</div>
                                <SaleCountdown capPeriodEnd={this.props.capPeriodEnd} />
                            </div>
                        </div>
                    }
                </div>
            </div>
        );
    }
}
