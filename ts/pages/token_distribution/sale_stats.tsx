import * as React from 'react';
import LinearProgress from 'material-ui/LinearProgress';
import CircularProgress from 'material-ui/CircularProgress';
import {constants} from 'ts/utils/constants';

const CUSTOM_LIGHT_GRAY = '#BBBBBB';

export interface SaleStatsProps {
    isLoading: boolean;
    totalZrxSupply: BigNumber.BigNumber;
    zrxSold: BigNumber.BigNumber;
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
                <div
                    className="left"
                    style={{paddingTop: 7, color: 'gray', fontSize: 13, paddingBottom: 9, paddingLeft: 8}}
                >
                    ZRX sold
                </div>
                {this.props.isLoading ?
                    <div className="center pt4 mt2">
                        <CircularProgress size={30} />
                    </div> :
                    <div className="px1 relative" style={{paddingBottom: 7, paddingTop: 26}}>
                        <div className="absolute" style={{right: 8, top: 11}}>
                            <div style={{fontSize: 12}}>500M</div>
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
                            {roundedZrxSold} ZRX ({roundedPercentRaised}%)
                        </div>
                    </div>
                }
            </div>
        );
    }
}
