import * as _ from 'lodash';
import * as React from 'react';

export interface RegisterButtonProps {
    onClick: () => void;
    isDisabled?: boolean;
}

interface RegisterButtonState {
    isHovering: boolean;
}

export class RegisterButton extends React.Component<RegisterButtonProps, RegisterButtonState> {
    public static defaultProps: Partial<RegisterButtonProps> = {
        isDisabled: false,
    };
    constructor(props: RegisterButtonProps) {
        super(props);
        this.state = {
            isHovering: false,
        };
    }
    public render() {
        let opacity = 1;
        if (this.props.isDisabled) {
            opacity = 0.5;
        } else if (this.state.isHovering) {
            opacity = 0.8;
        }
        const buttonStyles = {
            width: 190,
            cursor: 'pointer',
            opacity,
        };
        return (
            <div
                className="mx-auto"
                onClick={this.onClick.bind(this)}
                style={buttonStyles}
                onMouseOver={this.setHoverState.bind(this, true)}
                onMouseOut={this.setHoverState.bind(this, false)}
            >
                <img style={{width: 190}} src="/images/register_with_civic.png" />
            </div>
        );
    }
    private onClick() {
        if (this.props.isDisabled) {
            return;
        }
        this.props.onClick();
    }
    private setHoverState(isHovering: boolean) {
        this.setState({
            isHovering,
        });
    }
}
