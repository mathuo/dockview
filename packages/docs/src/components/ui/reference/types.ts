export type ExportedTypeFile = Record<string, TypeSystem.Type>;

export function firstLevelTypes(value: TypeDescriptor.Type | null) {
    if (!value) {
        return null;
    }

    switch (value.type) {
        case 'array':
            return firstLevelTypes(value.value);
        case 'literal':
            return [];
        case 'intrinsic':
            return [];
        case 'or':
            return value.values.flatMap(firstLevelTypes);
        case 'intersection':
            return value.values.flatMap(firstLevelTypes);
        case 'predicate':
            return [];
        case 'reference': {
            const result = [];
            if (
                value.source.startsWith('dockview') &&
                !value.refersToTypeParameter
            ) {
                result.push(value.value);
            }
            if (value.typeArguments) {
                result.push(...value.typeArguments.flatMap(firstLevelTypes));
            }
            return result;
        }
        case 'reflection':
            return firstLevel(value.value);
        case 'tuple':
            return value.value.map(codifyType);
        default:
            throw new Error('unreachable');
    }
}

export function firstLevel(value: TypeSystem.Type | null) {
    if (!value) {
        return [];
    }

    if (value.kind === 'property') {
        return firstLevelTypes(value.type);
    }

    if (value.kind === 'accessor') {
        return firstLevelTypes(value.value.returnType);
    }

    if (value.kind === 'method') {
        return value.signature.flatMap(firstLevel);
    }

    if (value.kind === 'callSignature') {
        const result = [];

        result.push(
            ...firstLevelTypes(value.returnType),
            ...value.typeParameters.flatMap((_) => {
                return [...firstLevelTypes(_.extends)];
            }),
            ...value.parameters.map(firstLevel)
        );

        return result;
    }

    if (value.kind === 'parameter') {
        return firstLevelTypes(value.type);
    }

    console.log('test', value);
    throw new Error('unreachable');
}

export function codifyType(value: TypeDescriptor.Type | null) {
    if (!value) {
        return null;
    }

    switch (value.type) {
        case 'array':
            return `${codifyType(value.value)}[]`;
        case 'literal':
            return `'${value.value}'`;
        case 'intrinsic':
            return value.value;
        case 'or':
            return `${value.values
                .map((_) => {
                    const isComparator =
                        _.type === 'or' || _.type === 'intersection';
                    const code = codifyType(_);
                    return isComparator ? `(${code})` : code;
                })
                .join(' | ')}`;
        case 'intersection':
            return `${value.values
                .map((_) => {
                    const isComparator =
                        _.type === 'or' || _.type === 'intersection';
                    const code = codifyType(_);
                    return isComparator ? `(${code})` : code;
                })
                .join(' & ')}`;
        case 'predicate':
            return `${value.lhs} is ${value.rhs}`;

        case 'reference': {
            if (value.typeArguments) {
                return `${value.value}<${value.typeArguments.map(codifyType)}>`;
            }
            return `${value.value}`;
        }
        case 'reflection':
            return codify(value.value);
        case 'tuple':
            return `[${value.value.map(codifyType).join(', ')}]`;
        default:
            throw new Error('unreachable');
    }
}

export function codify(value: TypeSystem.Type | null) {
    if (!value) {
        return null;
    }

    if (value.kind === 'accessor') {
        const signature = value.value;
        return `${signature.name}: ${codifyType(signature.returnType)}`;
    }

    if (value.kind === 'property') {
        let code = '';
        if (value.flags.isReadonly) {
            code += 'readonly ';
        }
        code += value.name;
        if (value.flags.isOptional) {
            code += '?';
        }

        code += `: ${codifyType(value.type)}`;
        return code;
    }

    if (value.kind === 'method') {
        return value.signature.map(codify).join('\n');
    }

    if (value.kind === 'callSignature') {
        let code = ``;

        if (value.typeParameters.length > 0) {
            code += '<';
            code += value.typeParameters.map((typeParameter) => {
                let typeCode = `${typeParameter.name}`;

                if (typeParameter.extends) {
                    typeCode += ' extends';
                    typeCode += ` ${codifyType(typeParameter.extends)}`;
                }

                if (typeParameter.default) {
                    typeCode += ' =';
                    typeCode += ` ${typeParameter.default}`;
                }
                return typeCode;
            });
            code += '>';
        }

        code += '(';

        code += value.parameters
            .map((parameter) => {
                return codify(parameter);
            })
            .join(', ');

        code += `): ${codifyType(value.returnType)}`;

        return code;
    }

    if (value.kind === 'parameter') {
        return `${value.name}: ${codifyType(value.type)}`;
    }

    if (value.kind === 'typeLiteral') {
        if (value.properties) {
            return `{ ${value.properties.map(codify).join(', ')} }`;
        }
        if (value.signatures) {
            return value.signatures.map(codify).join('\n');
        }
    }

    if (value.kind === 'constructor') {
        return '';
    }

    console.log('unreachable', value);
    throw new Error(`unreachable`);
}

export namespace TypeSystem {
    export type Comment = any;

    export type TypeParameter = {
        name: string;
        extends: TypeDescriptor.Type;
        default: string;
        comment?: Comment;
    };

    export type Accessor = {
        name: string;
        kind: 'accessor';
        comment?: Comment;
        value: TypeSystem.GetSignature;
    };

    export type GetSignature = {
        kind: 'getSignature';
        name: string;
        returnType: TypeDescriptor.Type;
        comment?: Comment;
    };

    export type CallSignature = {
        kind: 'callSignature';
        typeParameters: TypeSystem.TypeParameter[];
        parameters: TypeSystem.Type[];
        returnType: TypeDescriptor.Type;
        name: string;
        comment?: Comment;
    };

    export type Method = {
        name: string;
        kind: 'method';
        signature: TypeSystem.CallSignature[];
        comment?: Comment;
    };

    export type Property = {
        kind: 'property';
        name: string;
        type: TypeDescriptor.Type;
        flags: TypeDescriptor.Flags;
        comment?: Comment;
    };

    export type TypeAlias = {
        name: string;
        kind: 'typealias';
        typeParameters: TypeSystem.TypeParameter[];
        type: TypeDescriptor.Type;
        comment?: Comment;
    };

    export type Enum = {
        name: string;
        kind: 'enum';
        children: TypeSystem.EnumMember[];
        comment?: Comment;
    };

    export type EnumMember = {
        kind: 'enumMember';
        name: string;
        comment?: Comment;
    };

    export type Class = {
        name: string;
        kind: 'class';
        children: TypeSystem.Type[];
        comment?: Comment;
    };

    export type Parameter = {
        name: string;
        kind: 'parameter';
        type: TypeDescriptor.Type;
        comment?: Comment;
    };

    export type Constructor = {
        kind: 'constructor';
        name: string;
        comment?: Comment;
    };

    export type ConstructorSignature = {
        kind: 'constructorSignature';
        name: string;
        comment?: Comment;
    };

    export type TypeLiteral = {
        kind: 'typeLiteral';
        name: string;
        signatures?: (ConstructorSignature | TypeSystem.CallSignature)[];
        properties?: TypeSystem.Property[];
        comment?: Comment;
    };

    export type Type =
        | TypeSystem.Accessor
        | TypeSystem.GetSignature
        | TypeSystem.CallSignature
        | TypeSystem.Method
        | TypeSystem.Property
        | TypeSystem.TypeAlias
        | TypeSystem.Enum
        | TypeSystem.EnumMember
        | TypeSystem.Class
        | TypeSystem.Constructor
        | TypeSystem.ConstructorSignature
        | TypeSystem.TypeLiteral
        | TypeSystem.Parameter;
}

export namespace TypeDescriptor {
    export interface Union {
        type: 'or';
        values: TypeDescriptor.Type[];
    }

    export interface Intrinsic {
        type: 'intrinsic';
        value: string;
    }

    export interface Literal {
        type: 'literal';
        value: string;
    }

    export type Reflection = { type: 'reflection'; value: TypeSystem.Type };

    export interface Reference {
        type: 'reference';
        value: string;
        source: string;
        typeArguments?: TypeDescriptor.Type[];
        refersToTypeParameter?: boolean;
    }

    export interface Array {
        type: 'array';
        value: TypeDescriptor.Type;
    }

    export interface Intersection {
        type: 'intersection';
        values: TypeDescriptor.Type[];
    }

    export interface Predicate {
        type: 'predicate';
        lhs: string;
        rhs: TypeDescriptor.Type;
    }

    export interface Tuple {
        type: 'tuple';
        value: TypeDescriptor.Type[];
    }

    export type Type =
        | TypeDescriptor.Union
        | TypeDescriptor.Intrinsic
        | TypeDescriptor.Literal
        | TypeDescriptor.Reflection
        | TypeDescriptor.Reference
        | TypeDescriptor.Array
        | TypeDescriptor.Intersection
        | TypeDescriptor.Predicate
        | TypeDescriptor.Tuple;

    export type Flags = {
        isReadonly?: boolean;
        isProtected?: boolean;
        isOptional?: boolean;
    };
}
