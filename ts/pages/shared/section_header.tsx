import * as React from 'react';
import {Element as ScrollElement} from 'react-scroll';
import {AnchorTitle} from 'ts/pages/shared/anchor_title';
import {utils} from 'ts/utils/utils';

interface SectionHeaderProps {
    sectionName: string;
}

interface SectionHeaderState {
    shouldShowAnchor: boolean;
}

export class SectionHeader extends React.Component<SectionHeaderProps, SectionHeaderState> {
    constructor(props: SectionHeaderProps) {
        super(props);
        this.state = {
            shouldShowAnchor: false,
        };
    }
    public render() {
        const sectionName = this.props.sectionName;
        const id = utils.getIdFromName(sectionName);
        return (
            <div
                onMouseOver={this.setAnchorVisibility.bind(this, true)}
                onMouseOut={this.setAnchorVisibility.bind(this, false)}
            >
                <ScrollElement name={id}>
                    <AnchorTitle
                        headerType="h2"
                        title={<span style={{textTransform: 'capitalize'}}>{sectionName}</span>}
                        id={id}
                        shouldShowAnchor={this.state.shouldShowAnchor}
                    />
                </ScrollElement>
            </div>
        );
    }
    private setAnchorVisibility(shouldShowAnchor: boolean) {
        this.setState({
            shouldShowAnchor,
        });
    }
}
