import * as _ from 'lodash';
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import * as Waypoint from 'react-waypoint';
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
    didScrollToTheEnd: boolean;
    didAcceptTermsAndCondition: boolean;
}

export class TermsAndConditions extends React.Component<TermsAndConditionsProps, TermsAndConditionsState> {
    constructor(props: TermsAndConditionsProps) {
        super(props);
        this.state = {
            didScrollToTheEnd: false,
            didAcceptTermsAndCondition: false,
        };
    }
    public render() {
        return (
            <div
                className="mx-auto"
                style={{maxWidth: 500, color: CUSTOM_GRAY}}
            >
                <div className="h2 pt3 lg-left-align md-left-align sm-center">
                    Terms & conditions
                </div>
                <div className="my3">
                    <div
                        id="termsAndConditons"
                        className="left-align overflow-scroll sm-px3 px2 sm-mx2"
                        style={{height: 300}}
                    >
                        <ReactMarkdown
                            source={termsAndConditionsMd}
                        />
                        <Waypoint
                            onEnter={this.onScrollToTheEnd.bind(this)}
                        />
                    </div>
                    <div className="clearfix left-align pb3 pt3">
                        <div className="col lg-col-7 md-col-7 col-12 left-align pt1 sm-pl3 sm-pb3">
                            <Checkbox
                                label="I agree to the terms & conditions"
                                disabled={!this.state.didScrollToTheEnd}
                                onCheck={this.onAcceptTermsCheckboxChecked.bind(this)}
                            />
                        </div>
                        <div className="col lg-col-5 md-col-5 col-12 lg-right-align md-right-align sm-center">
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
    private onScrollToTheEnd() {
        this.setState({
            didScrollToTheEnd: true,
        });
    }
    private onAcceptTermsCheckboxChecked(event: any, isInputChecked: boolean) {
        this.setState({
            didAcceptTermsAndCondition: isInputChecked,
        });
    }
}
