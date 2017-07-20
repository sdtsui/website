import * as _ from 'lodash';
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import {colors} from 'material-ui/styles';
import Checkbox from 'material-ui/Checkbox';
import RaisedButton from 'material-ui/RaisedButton';
/* tslint:disable:no-var-requires */
const termsAndConditionsMd = require('md/launch_terms_and_conditions');
/* tslint:enable:no-var-requires */

const CUSTOM_GRAY = '#635F5E';

export interface TermsAndConditionsProps {
    onContinueClick: () => void;
}

interface TermsAndConditionsState {
    didAcceptTermsAndCondition: boolean;
}

export class TermsAndConditions extends React.Component<TermsAndConditionsProps, TermsAndConditionsState> {
    constructor(props: TermsAndConditionsProps) {
        super(props);
        this.state = {
            didAcceptTermsAndCondition: false,
        };
    }
    public render() {
        return (
            <div
                className="mx-auto"
                style={{width: 500, color: CUSTOM_GRAY}}
            >
                <div className="h2 pt3 left-align">Terms & conditions</div>
                <div className="my3">
                    <div
                        id="termsAndConditons"
                        className="left-align overflow-scroll"
                        style={{height: 300}}
                    >
                        <ReactMarkdown
                            source={termsAndConditionsMd}
                        />
                    </div>
                    <div className="clearfix left-align pb3 pt3">
                        <div className="col col-7 left-align pt1">
                            <Checkbox
                                label="I agree to the terms & conditions"
                                onCheck={this.onAcceptTermsCheckboxChecked.bind(this)}
                            />
                        </div>
                        <div className="col col-5 right-align">
                            <RaisedButton
                                label="Continue"
                                primary={true}
                                disabled={!this.state.didAcceptTermsAndCondition}
                                onClick={this.props.onContinueClick}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    private onAcceptTermsCheckboxChecked(event: any, isInputChecked: boolean) {
        this.setState({
            didAcceptTermsAndCondition: isInputChecked,
        });
    }
}
