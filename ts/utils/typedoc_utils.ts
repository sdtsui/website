import * as _ from 'lodash';
import {constants} from 'ts/utils/constants';
import {TypeDocNode, KindString, DocSections} from 'ts/types';

export const sectionNameToModulePath: {[name: string]: string} = {
    [DocSections.zeroEx]: '"src/0x"',
    [DocSections.exchange]: '"src/contract_wrappers/exchange_wrapper"',
    [DocSections.tokenRegistry]: '"src/contract_wrappers/token_registry_wrapper"',
    [DocSections.token]: '"src/contract_wrappers/token_wrapper"',
    [DocSections.etherToken]: '"src/contract_wrappers/ether_token_wrapper"',
    [DocSections.proxy]: '"src/contract_wrappers/proxy_wrapper"',
    [DocSections.types]: '"src/types"',
};

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
};
