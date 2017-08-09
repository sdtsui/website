import * as React from 'react';
import Paper from 'material-ui/Paper';

export interface ContributionNoticeProps {}

interface ContributionNoticeSteps {}

export class ContributionNotice extends React.Component<ContributionNoticeProps, ContributionNoticeSteps> {
    public render() {
        return (
            <div className="pt4 my4 mx-auto max-width-3">
                <div className="center pt4">
                    <img
                        src="/images/zrx_token.png"
                        style={{width: 150}}
                    />
                </div>
                <div>
                    {this.props.children}
                </div>
            </div>
        );
    }
}
