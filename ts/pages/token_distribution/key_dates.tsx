import * as _ from 'lodash';
import * as React from 'react';
import {Step, Stepper, StepLabel} from 'material-ui/Stepper';
import {utils} from 'ts/utils/utils';
import {ScreenWidths} from 'ts/types';

const CUSTOM_GRAY = '#4A4A4A';
const THROTTLE_TIMEOUT = 100;

type StepperOrientation = 'vertical'|'horizontal';

const keyDates = [
    {
        date: 'June 25',
        description: '0x announces token sale',
    },
    {
        date: 'August 9',
        description: 'Registration begins',
    },
    {
        date: 'August 12',
        description: 'Registration ends',
    },
    {
        date: 'August 15',
        description: 'Sale begins',
    },
];

interface KeyDatesProps {}

interface KeyDatesState {
    screenWidth: ScreenWidths;
}

export class KeyDates extends React.Component<KeyDatesProps, KeyDatesState> {
    private throttledScreenWidthUpdate: () => void;
    constructor(props: KeyDatesProps) {
        super(props);
        this.state = {
            screenWidth: undefined,
        };
        this.throttledScreenWidthUpdate = _.throttle(this.updateScreenWidth.bind(this), THROTTLE_TIMEOUT);
    }
    public componentWillMount() {
        this.updateScreenWidth();
    }
    public componentDidMount() {
        window.addEventListener('resize', this.throttledScreenWidthUpdate);
    }
    public componentWillUnmount() {
        window.removeEventListener('resize', this.throttledScreenWidthUpdate);
    }
    public render() {
        const steps = _.map(keyDates, keyDate => {
            return (
                <Step key={keyDate.date}>
                    <StepLabel>
                        <div>
                            <div className="bold">{keyDate.date}</div>
                            <div style={{fontSize: 14, color: CUSTOM_GRAY}}>
                                {keyDate.description}
                            </div>
                        </div>
                    </StepLabel>
                </Step>
            );
        });
        const orientation: StepperOrientation = this.state.screenWidth === ScreenWidths.SM ? 'vertical' : 'horizontal';
        return (
            <div className="pb4" style={{backgroundColor: 'rgb(234, 234, 234)'}}>
                <div className="mx-auto max-width-4 center pt3">
                    <h1 className="thin">KEY DATES</h1>
                    <div className="sm-px4 sm-mx2">
                        <Stepper
                            orientation={orientation}
                            activeStep={0}
                        >
                            {steps}
                        </Stepper>
                    </div>
                </div>
            </div>
        );
    }
    private updateScreenWidth() {
        const newScreenWidth = utils.getScreenWidth();
        this.setState({
            screenWidth: newScreenWidth,
        });
    }
}
