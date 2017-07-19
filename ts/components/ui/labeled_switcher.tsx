import * as _ from 'lodash';
import * as React from 'react';
import {colors} from 'material-ui/styles';

const CUSTOM_BLUE = '#63A6F1';

export enum Labels {
    LEFT,
    RIGHT,
}

interface LabeledSwitcherProps {
    labelLeft: string;
    labelRight: string;
    initialSelectedLabel: Labels;
    onLeftLabelClick: () => void;
    onRightLabelClick: () => void;
}

interface LabeledSwitcherState {
    selectedLabel: Labels;
}

export class LabeledSwitcher extends React.Component<LabeledSwitcherProps, LabeledSwitcherState> {
    constructor(props: LabeledSwitcherProps) {
        super(props);
        this.state = {
            selectedLabel: props.initialSelectedLabel,
        };
    }
    public render() {
        const isLeftLabelSelected = this.state.selectedLabel === Labels.LEFT;
        return (
            <div
                className="rounded clearfix"
            >
                {this.renderLabel(this.props.labelLeft, Labels.LEFT, isLeftLabelSelected)}
                {this.renderLabel(this.props.labelRight, Labels.RIGHT, !isLeftLabelSelected)}
            </div>
        );
    }
    private renderLabel(title: string, label: Labels, isSelected: boolean) {
        const borderStyle = `2px solid ${isSelected ? '#4F8BCF' : '#DADADA'}`;
        const style = {
            cursor: 'pointer',
            backgroundColor: isSelected ? CUSTOM_BLUE : colors.grey200,
            color: isSelected ? 'white' : '#A5A5A5',
            boxShadow: isSelected ? `inset 0px 0px 4px #4083CE` : 'inset 0px 0px 4px #F7F6F6',
            borderTop: borderStyle,
            borderBottom: borderStyle,
            [label === Labels.LEFT ? 'borderLeft' : 'borderRight']: borderStyle,
            paddingTop: 12,
            paddingBottom: 12,
        };
        const isLeft = label === Labels.LEFT;
        return (
            <div
                className={`col col-6 center p1 ${isLeft ? 'rounded-left' : 'rounded-right'}`}
                style={style}
                onClick={this.onLabelClick.bind(this, label)}
            >
                {title}
            </div>
        );
    }
    private onLabelClick(label: Labels) {
        this.setState({
            selectedLabel: label,
        });
        if (label === Labels.LEFT) {
            this.props.onLeftLabelClick();
        } else {
            this.props.onRightLabelClick();
        }
    }
}
