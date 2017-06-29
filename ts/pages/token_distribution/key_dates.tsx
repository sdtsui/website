import * as _ from 'lodash';
import * as React from 'react';
import {Step, Stepper, StepLabel} from 'material-ui/Stepper';

const CUSTOM_GRAY = '#4A4A4A';

interface KeyDatesProps {}

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

export function KeyDates(props: KeyDatesProps) {
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
    return (
        <div className="pb4" style={{backgroundColor: 'rgb(234, 234, 234)'}}>
            <div className="mx-auto max-width-4 center pt3">
                <h1 className="thin">KEY DATES</h1>
                <div>
                    <Stepper activeStep={0}>
                        {steps}
                    </Stepper>
                </div>
            </div>
        </div>
    );
}
