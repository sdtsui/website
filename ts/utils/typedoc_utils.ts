import * as _ from 'lodash';
import compareVersions = require('compare-versions');
import {constants} from 'ts/utils/constants';
import {TypeDocNode, KindString, ZeroExJsDocSections, MenuSubsectionsBySection} from 'ts/types';

const TYPES_MODULE_PATH = '"src/types"';

export const sectionNameToPossibleModulePaths: {[name: string]: string[]} = {
    [ZeroExJsDocSections.zeroEx]: ['"src/0x"'],
    [ZeroExJsDocSections.exchange]: ['"src/contract_wrappers/exchange_wrapper"'],
    [ZeroExJsDocSections.tokenRegistry]: ['"src/contract_wrappers/token_registry_wrapper"'],
    [ZeroExJsDocSections.token]: ['"src/contract_wrappers/token_wrapper"'],
    [ZeroExJsDocSections.etherToken]: ['"src/contract_wrappers/ether_token_wrapper"'],
    [ZeroExJsDocSections.proxy]: [
        '"src/contract_wrappers/proxy_wrapper"',
        '"src/contract_wrappers/token_transfer_proxy_wrapper"',
    ],
    [ZeroExJsDocSections.types]: [TYPES_MODULE_PATH],
};

export const typeDocUtils = {
    isType(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Interface ||
               entity.kindString === KindString.Function ||
               entity.kindString === KindString['Type alias'] ||
               entity.kindString === KindString.Variable ||
               entity.kindString === KindString.Enumeration;
    },
    isMethod(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Method;
    },
    isConstructor(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Constructor;
    },
    isProperty(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Property;
    },
    isPrivateOrProtectedProperty(propertyName: string): boolean {
        return _.startsWith(propertyName, '_');
    },
    isPublicType(typeName: string): boolean {
        return _.includes(constants.public0xjsTypes, typeName);
    },
    getModuleDefinitionBySectionNameIfExists(versionDocObj: TypeDocNode, sectionName: string): TypeDocNode|undefined {
        const possibleModulePathNames = sectionNameToPossibleModulePaths[sectionName];
        const modules = versionDocObj.children;
        for (const mod of modules) {
            if (_.includes(possibleModulePathNames, mod.name)) {
                const moduleWithName = mod;
                return moduleWithName;
            }
        }
        return undefined;
    },
    getMenuSubsectionsBySection(versionDocObj: TypeDocNode): MenuSubsectionsBySection {
        const menuSubsectionsBySection = {} as MenuSubsectionsBySection;
        if (_.isUndefined(versionDocObj)) {
            return menuSubsectionsBySection;
        }
        const docSections = _.keys(ZeroExJsDocSections);
        _.each(docSections, menuItemName => {
            // Since the `types.ts` file is the only file that does not export a module/class but
            // instead has each type export itself, we do not need to go down two levels of nesting
            // for it.
            if (menuItemName === ZeroExJsDocSections.types) {
                const allModules = versionDocObj.children;
                const typesModule = _.find(allModules, {name: TYPES_MODULE_PATH}) as TypeDocNode;
                const allTypes = _.filter(typesModule.children, typeDocUtils.isType);
                const publicTypes = _.filter(allTypes, type => {
                    return typeDocUtils.isPublicType(type.name);
                });
                const typeNames = _.map(publicTypes, t => t.name);
                menuSubsectionsBySection[menuItemName] = typeNames;
            } else {
                const moduleDefinition = typeDocUtils.getModuleDefinitionBySectionNameIfExists(
                    versionDocObj, menuItemName,
                );
                if (_.isUndefined(moduleDefinition)) {
                    return;
                }
                const mainModuleExport = moduleDefinition.children[0];
                const allMembers = mainModuleExport.children;
                const allMethods = _.filter(allMembers, typeDocUtils.isMethod);
                const publicMethods = _.filter(allMethods, method => method.flags.isPublic);
                const methodNames = _.map(publicMethods, t => t.name);
                menuSubsectionsBySection[menuItemName] = methodNames;
            }
        });
        return menuSubsectionsBySection;
    },
    getFinal0xjsMenu(selectedVersion: string) {
        const finalMenu = _.cloneDeep(constants.menu0xjs);
        finalMenu.contracts = _.filter(finalMenu.contracts, (contractName: string) => {
            const versionIntroducedIfExists = constants.menuSubsectionToVersionWhenIntroduced[contractName];
            if (!_.isUndefined(versionIntroducedIfExists)) {
                const existsInSelectedVersion = compareVersions(selectedVersion,
                                                                versionIntroducedIfExists) >= 0;
                return existsInSelectedVersion;
            } else {
                return true;
            }
        });
        return finalMenu;
    },
};
