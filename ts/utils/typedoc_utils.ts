import * as _ from 'lodash';
import {constants} from 'ts/utils/constants';
import {TypeDocNode, KindString, DocSections, MenuSubsectionsBySection} from 'ts/types';

export const sectionNameToModulePath: {[name: string]: string} = {
    [DocSections.zeroEx]: '"src/0x"',
    [DocSections.exchange]: '"src/contract_wrappers/exchange_wrapper"',
    [DocSections.tokenRegistry]: '"src/contract_wrappers/token_registry_wrapper"',
    [DocSections.token]: '"src/contract_wrappers/token_wrapper"',
    [DocSections.etherToken]: '"src/contract_wrappers/ether_token_wrapper"',
    [DocSections.proxy]: '"src/contract_wrappers/proxy_wrapper"',
    [DocSections.types]: '"src/types"',
};

const TYPES_MODULE_PATH = '"src/types"';

export const typeDocUtils = {
    isType(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Interface ||
               entity.kindString === KindString.Function ||
               entity.kindString === KindString['Type alias'] ||
               entity.kindString === KindString.Variable;
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
    isPublicType(type: TypeDocNode): boolean {
        return _.includes(constants.public0xjsTypes, type.name);
    },
    getModuleDefinitionBySectionNameIfExists(versionDocObj: TypeDocNode, sectionName: string): TypeDocNode|undefined {
        const modulePathName = sectionNameToModulePath[sectionName];
        const modules = versionDocObj.children;
        const moduleWithName = _.find(modules, {name: modulePathName});
        return moduleWithName;
    },
    getMenuSubsectionsBySection(versionDocObj?: TypeDocNode): MenuSubsectionsBySection {
        const menuSubsectionsBySection = {} as MenuSubsectionsBySection;
        if (_.isUndefined(versionDocObj)) {
            return menuSubsectionsBySection;
        }
        const docSections = _.keys(DocSections);
        _.each(docSections, menuItemName => {
            // Since the `types.ts` file is the only file that does not export a module/class but
            // instead has each type export itself, we do not need to go down two levels of nesting
            // for it.
            if (menuItemName === DocSections.types) {
                const allModules = versionDocObj.children;
                const typesModule = _.find(allModules, {name: TYPES_MODULE_PATH}) as TypeDocNode;
                const allTypes = _.filter(typesModule.children, typeDocUtils.isType);
                const publicTypes = _.filter(allTypes, typeDocUtils.isPublicType);
                menuSubsectionsBySection[menuItemName] = publicTypes;
            }
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
            menuSubsectionsBySection[menuItemName] = publicMethods;
        });
        return menuSubsectionsBySection;
    },
};
