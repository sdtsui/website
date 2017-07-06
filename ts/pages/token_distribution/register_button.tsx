import * as _ from 'lodash';
import * as React from 'react';

export interface RegisterButtonProps {
    onClick: () => void;
}

interface RegisterButtonState {
    isHovering: boolean;
}

export class RegisterButton extends React.Component<RegisterButtonProps, RegisterButtonState> {
    constructor(props: RegisterButtonProps) {
        super(props);
        this.state = {
            isHovering: false,
        };
    }
    public render() {
        return (
            <div
                className="mx-auto"
                onClick={this.props.onClick}
                style={{width: 210, cursor: 'pointer', opacity: this.state.isHovering ? 0.8 : 1}}
                onMouseOver={this.setHoverState.bind(this, true)}
                onMouseOut={this.setHoverState.bind(this, false)}
            >
                <img style={{width: 210}} src="/images/register_with_civic.png" />
            </div>
        );
    }
    private setHoverState(isHovering: boolean) {
        this.setState({
            isHovering,
        });
    }
}
