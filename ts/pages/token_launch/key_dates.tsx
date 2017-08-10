import * as _ from 'lodash';
import * as React from 'react';
import {Step, Stepper, StepLabel} from 'material-ui/Stepper';
import {utils} from 'ts/utils/utils';
import {ScreenWidths} from 'ts/types';

type StepperOrientation = 'vertical'|'horizontal';

const keyDates = [
    {
        date: 'June 25',
        description: 'Launch announcement',
    },
    {
        date: 'August 9',
        description: 'Registration begins',
    },
    {
        date: 'August 11',
        description: 'Registration ends',
    },
    {
        date: 'August 15',
        description: 'Token sale',
    },
];

interface KeyDatesProps {
    screenWidth: ScreenWidths;
}

interface KeyDatesState {}

export class KeyDates extends React.Component<KeyDatesProps, KeyDatesState> {
    public render() {
        const steps = _.map(keyDates, keyDate => {
            return (
                <Step key={keyDate.date}>
                    <StepLabel>
                        <div>
                            <div className="bold" style={{color: 'white'}}>{keyDate.date}</div>
                            <div style={{fontSize: 14, color: '#cecece'}}>
                                {keyDate.description}
                            </div>
                        </div>
                    </StepLabel>
                </Step>
            );
        });
        const orientation: StepperOrientation = this.props.screenWidth === ScreenWidths.SM ? 'vertical' : 'horizontal';
        return (
            <div className="pb4" style={{backgroundColor: '#272727', color: 'white'}}>
                <div className="mx-auto max-width-4 center pt3">
                    <h1 className="thin pt1">KEY DATES</h1>
                    <div className="sm-px4 sm-mx2">
                        <Stepper
                            orientation={orientation}
                            activeStep={1}
                        >
                            {steps}
                        </Stepper>
                    </div>
                </div>
            </div>
        );
    }
}
