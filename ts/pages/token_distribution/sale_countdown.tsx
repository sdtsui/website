import * as _ from 'lodash';
import * as React from 'react';
import * as moment from 'moment';
import LinearProgress from 'material-ui/LinearProgress';
import {constants} from 'ts/utils/constants';

const UPDATE_INTERVAL_MS = 1000;

export interface SaleCountdownProps {
    capTimeRemainingSec: number;
}

interface SaleCountdownState {}

export class SaleCountdown extends React.Component<SaleCountdownProps, SaleCountdownState> {
    private refreshTimeoutId: number;
    public componentDidMount() {
        this.refreshTimeoutId = window.setInterval(() => {
            this.forceUpdate();
        }, UPDATE_INTERVAL_MS);
    }
    public componentWillUnmount() {
        window.clearInterval(this.refreshTimeoutId);
    }
    public render() {
        const remainingMoment = moment(this.props.capTimeRemainingSec);
        const currentMoment = moment();
        const days = remainingMoment.diff(currentMoment, 'days');
        const remainingMomentHoursAndLess = remainingMoment.subtract(days, 'days');
        const hours = remainingMomentHoursAndLess.diff(currentMoment, 'hours');
        const remainingMomentMinutesOrLess = remainingMomentHoursAndLess.subtract(hours, 'hours');
        const minutes = remainingMomentMinutesOrLess.diff(currentMoment, 'minutes');
        const remainingMomentSecondsOrLess = remainingMomentMinutesOrLess.subtract(minutes, 'minutes');
        const seconds = remainingMomentSecondsOrLess.diff(currentMoment, 'seconds');
        return (
            <div className="clearfix pt2 pb1">
                <div className="col col-3">
                    <div>{days}</div>
                    <div>DAY</div>
                </div>
                <div className="col col-3">
                    <div>{hours}</div>
                    <div>HR</div>
                </div>
                <div className="col col-3">
                    <div>{minutes}</div>
                    <div>MIN</div>
                </div>
                <div className="col col-3">
                    <div>{seconds}</div>
                    <div>SEC</div>
                </div>
            </div>
        );
    }
}
