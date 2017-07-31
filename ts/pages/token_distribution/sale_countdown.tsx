import * as React from 'react';
import * as moment from 'moment';

const UPDATE_INTERVAL_MS = 1000;

export interface SaleCountdownProps {
    capPeriodEnd: number;
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
        const periodEndMoment = moment.unix(this.props.capPeriodEnd);
        const now = moment();
        const hours = periodEndMoment.diff(now, 'hours');
        const periodEndMomentMinutesOrLess = periodEndMoment.subtract(hours, 'hours');
        const minutes = periodEndMomentMinutesOrLess.diff(now, 'minutes');
        const periodEndMomentSecondsOrLess = periodEndMomentMinutesOrLess.subtract(minutes, 'minutes');
        const seconds = periodEndMomentSecondsOrLess.diff(now, 'seconds');
        return (
            <div className="clearfix pt2 pb1">
                <div className="col col-4">
                    <div>{hours}</div>
                    <div>HR</div>
                </div>
                <div className="col col-4">
                    <div>{minutes}</div>
                    <div>MIN</div>
                </div>
                <div className="col col-4">
                    <div>{seconds}</div>
                    <div>SEC</div>
                </div>
            </div>
        );
    }
}
