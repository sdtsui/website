import * as _ from 'lodash';
import {DocSections, TypeDocNode} from 'ts/types';

export const sectionNameToModulePath: {[name: string]: string} = {
    [DocSections.zeroEx]: '"src/0x"',
    [DocSections.exchange]: '"src/contract_wrappers/exchange_wrapper"',
    [DocSections.tokenRegistry]: '"src/contract_wrappers/token_registry_wrapper"',
    [DocSections.token]: '"src/contract_wrappers/token_wrapper"',
    [DocSections.etherToken]: '"src/contract_wrappers/ether_token_wrapper"',
    [DocSections.proxy]: '"src/contract_wrappers/proxy_wrapper"',
    [DocSections.types]: '"src/types"',
};

export const moduleResolver = {
    getModuleDefinitionBySectionNameIfExists(versionDocObj: TypeDocNode, sectionName: string): TypeDocNode|undefined {
        const modulePathName = sectionNameToModulePath[sectionName];
        const modules = versionDocObj.children;
        const moduleWithName = _.find(modules, {name: modulePathName});
        return moduleWithName;
    },
};
