import * as _ from 'lodash';
import {constants} from 'ts/utils/constants';
import {TypeDocNode, KindString} from 'ts/types';

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
};
