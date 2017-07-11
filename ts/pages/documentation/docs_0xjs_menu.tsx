import * as _ from 'lodash';
import * as React from 'react';
import MenuItem from 'material-ui/MenuItem';
import {colors} from 'material-ui/styles';
import {utils} from 'ts/utils/utils';
import {constants} from 'ts/utils/constants';
import compareVersions = require('compare-versions');
import {VersionDropDown} from 'ts/pages/documentation/version_drop_down';
import {DocSections, Styles, TypeDocNode} from 'ts/types';
import {moduleResolver} from 'ts/pages/documentation/module_resolver';
import {typeDocUtils} from 'ts/utils/typedoc_utils';
import {Link as ScrollLink} from 'react-scroll';

export const menu = {
    introduction: [
        DocSections.introduction,
    ],
    install: [
        DocSections.installation,
    ],
    topics: [
        DocSections.async,
        DocSections.errors,
        DocSections.versioning,
    ],
    zeroEx: [
        DocSections.zeroEx,
    ],
    contracts: [
        DocSections.exchange,
        DocSections.token,
        DocSections.tokenRegistry,
        DocSections.etherToken,
        DocSections.proxy,
    ],
    types: [
        DocSections.types,
    ],
};

const menuSubsectionToVersionWhenIntroduced = {
    [DocSections.etherToken]: '0.7.1',
    [DocSections.proxy]: '0.8.0',
};

interface Docs0xjsMenuProps {
    shouldDisplaySectionHeaders?: boolean;
    onMenuItemClick?: () => void;
    selectedVersion: string;
    versions: string[];
    versionDocObj?: TypeDocNode;
}

interface Docs0xjsMenuState {}

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

export class Docs0xjsMenu extends React.Component<Docs0xjsMenuProps, Docs0xjsMenuState> {
    public static defaultProps: Partial<Docs0xjsMenuProps> = {
        shouldDisplaySectionHeaders: true,
        onMenuItemClick: _.noop,
    };
    public render() {
        const finalMenu = _.cloneDeep(menu);
        finalMenu.contracts = _.filter(finalMenu.contracts, (contractName: string) => {
            const versionIntroducedIfExists = menuSubsectionToVersionWhenIntroduced[contractName];
            if (!_.isUndefined(versionIntroducedIfExists)) {
                const existsInSelectedVersion = compareVersions(this.props.selectedVersion,
                                                                versionIntroducedIfExists) >= 0;
                return existsInSelectedVersion;
            } else {
                return true;
            }
        });

        const navigation = _.map(finalMenu, (menuItems: string[], sectionName: string) => {
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
    private renderMenuItems(menuItemNames: string[]) {
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
                        offset={0}
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
        if (_.isUndefined(this.props.versionDocObj)) {
            return null;
        }
        if (menuItemName === 'types') {
            return this.renderTypesMenuSubsection();
        }
        const moduleDefinition = moduleResolver.getModuleDefinitionBySectionNameIfExists(
            this.props.versionDocObj, menuItemName,
        );
        if (_.isUndefined(moduleDefinition)) {
            return null;
        }
        const mainModuleExport = moduleDefinition.children[0];
        const allMembers = mainModuleExport.children;
        const allMethods = _.filter(allMembers, member => member.kindString === 'Method');
        const publicMethods = _.filter(allMethods, method => method.flags.isPublic);
        return (
            <ul style={{margin: 0}} key={menuItemName}>
            {_.map(publicMethods, method => {
                return (
                    <li key={method.id}>
                        <ScrollLink
                            to={method.name}
                            duration={constants.DOCS_SCROLL_DURATION_MS}
                            containerId={constants.DOCS_CONTAINER_ID}
                            onTouchTap={this.onMenuItemClick.bind(this, method.name)}
                        >
                            {method.name}
                        </ScrollLink>
                    </li>
                );
            })}
            </ul>
        );
    }
    private renderTypesMenuSubsection(): React.ReactNode {
        const allModules = this.props.versionDocObj.children;
        const typesModule = _.find(allModules, {name: '"src/types"'}) as TypeDocNode;
        const allTypes = _.filter(typesModule.children, typeDocUtils.isType);
        const publicTypes = _.filter(allTypes, typeDocUtils.isPublicType);
        return (
            <ul style={{margin: 0}} key={'types'}>
                {_.map(publicTypes, type => {
                    return (
                        <li key={type.id}>
                            <ScrollLink
                                to={type.name}
                                duration={constants.DOCS_SCROLL_DURATION_MS}
                                containerId={constants.DOCS_CONTAINER_ID}
                                onTouchTap={this.onMenuItemClick.bind(this, type.name)}
                            >
                                {type.name}
                            </ScrollLink>
                        </li>
                    );
                })}
            </ul>
        );
    }
    private onMenuItemClick(menuItemName: string) {
        utils.setUrlHash(menuItemName);
        this.props.onMenuItemClick();
    }
}
