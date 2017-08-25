import * as _ from 'lodash';
import * as React from 'react';
import MenuItem from 'material-ui/MenuItem';
import {colors} from 'material-ui/styles';
import {utils} from 'ts/utils/utils';
import {constants} from 'ts/utils/constants';
import {VersionDropDown} from 'ts/pages/documentation/version_drop_down';
import {ZeroExJsDocSections, Styles, TypeDocNode, MenuSubsectionsBySection} from 'ts/types';
import {typeDocUtils} from 'ts/utils/typedoc_utils';
import {Link as ScrollLink} from 'react-scroll';

interface DocsMenuProps {
    shouldDisplaySectionHeaders?: boolean;
    onMenuItemClick?: () => void;
    selectedVersion: string;
    versions: string[];
    topLevelMenu: {[topLevel: string]: string[]};
    menuSubsectionsBySection: MenuSubsectionsBySection;
}

interface DocsMenuState {}

const styles: Styles = {
    menuItemWithHeaders: {
        minHeight: 0,
    },
    menuItemWithoutHeaders: {
        minHeight: 48,
    },
    menuItemInnerDivWithHeaders: {
        lineHeight: 2,
    },
};

export class DocsMenu extends React.Component<DocsMenuProps, DocsMenuState> {
    public static defaultProps: Partial<DocsMenuProps> = {
        shouldDisplaySectionHeaders: true,
        onMenuItemClick: _.noop,
    };
    public render() {
        const navigation = _.map(this.props.topLevelMenu, (menuItems: string[], sectionName: string) => {
            if (this.props.shouldDisplaySectionHeaders) {
                return (
                    <div
                        key={`section-${sectionName}`}
                        className="py1"
                    >
                        <div
                            style={{color: colors.grey500}}
                            className="pb1"
                        >
                            {sectionName.toUpperCase()}
                        </div>
                        {this.renderMenuItems(menuItems)}
                    </div>
                );
            } else {
                return (
                    <div key={`section-${sectionName}`} >
                        {this.renderMenuItems(menuItems)}
                    </div>
                );
            }
        });
        return (
            <div>
                {!_.isUndefined(this.props.versions) &&
                 !_.isUndefined(this.props.selectedVersion) &&
                    <VersionDropDown
                        selectedVersion={this.props.selectedVersion}
                        versions={this.props.versions}
                    />
                }
                {navigation}
            </div>
        );
    }
    private renderMenuItems(menuItemNames: string[]): React.ReactNode[] {
        const menuItemStyles = this.props.shouldDisplaySectionHeaders ?
                                    styles.menuItemWithHeaders :
                                    styles.menuItemWithoutHeaders;
        const menuItemInnerDivStyles = this.props.shouldDisplaySectionHeaders ?
                                    styles.menuItemInnerDivWithHeaders : {};
        const menuItems = _.map(menuItemNames, menuItemName => {
            return (
                <div key={menuItemName}>
                    <ScrollLink
                        key={`menuItem-${menuItemName}`}
                        to={menuItemName}
                        offset={-10}
                        duration={constants.DOCS_SCROLL_DURATION_MS}
                        containerId={constants.DOCS_CONTAINER_ID}
                    >
                        <MenuItem
                            onTouchTap={this.onMenuItemClick.bind(this, menuItemName)}
                            style={menuItemStyles}
                            innerDivStyle={menuItemInnerDivStyles}
                        >
                            <span style={{textTransform: 'capitalize'}}>
                                {menuItemName}
                            </span>
                        </MenuItem>
                    </ScrollLink>
                    {this.renderMenuItemSubsections(menuItemName)}
                </div>
            );
        });
        return menuItems;
    }
    private renderMenuItemSubsections(menuItemName: string): React.ReactNode {
        if (_.isUndefined(this.props.menuSubsectionsBySection[menuItemName])) {
            return null;
        }
        return this.renderMenuSubsectionsBySection(menuItemName, this.props.menuSubsectionsBySection[menuItemName]);
    }
    private renderMenuSubsectionsBySection(menuItemName: string, entityNames: string[]): React.ReactNode {
        return (
            <ul style={{margin: 0, listStyleType: 'none', paddingLeft: 0}} key={menuItemName}>
            {_.map(entityNames, entityName => {
                return (
                    <li key={`menuItem-${entityName}`}>
                        <ScrollLink
                            to={entityName}
                            offset={0}
                            duration={constants.DOCS_SCROLL_DURATION_MS}
                            containerId={constants.DOCS_CONTAINER_ID}
                            onTouchTap={this.onMenuItemClick.bind(this, entityName)}
                        >
                            <MenuItem
                                onTouchTap={this.onMenuItemClick.bind(this, menuItemName)}
                                style={{minHeight: 35}}
                                innerDivStyle={{paddingLeft: 36, fontSize: 14, lineHeight: '35px'}}
                            >
                                {entityName}
                            </MenuItem>
                        </ScrollLink>
                    </li>
                );
            })}
            </ul>
        );
    }
    private onMenuItemClick(menuItemName: string): void {
        utils.setUrlHash(menuItemName);
        this.props.onMenuItemClick();
    }
}
