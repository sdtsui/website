import * as React from 'react';
import Paper from 'material-ui/Paper';

export interface ContributionNoticeProps {}

interface ContributionNoticeSteps {}

export class ContributionNotice extends React.Component<ContributionNoticeProps, ContributionNoticeSteps> {
    public render() {
        const style = {
            height: '60vh',
            width: '60vw',
            display: 'inline-block',
        };
        return (
            <div className="block mx-auto pt4">
                <Paper style={style} zDepth={1}>
                    <div className="flex items-center justify-center fit" style={{height: '100%'}}>
                        <div className="self-center">
                            {this.props.children}
                        </div>
                    </div>
                </Paper>
            </div>
        );
    }
}
