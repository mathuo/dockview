namespace TypeSystem {
    export type Accessor = {
        kind: 'accessor';
        value: TypeSystem.GetSignature;
    };

    export type GetSignature = {
        returnType: TypeDescriptor.Type;
    };

    export type TypeParameter = {
        name: string;
        extends: TypeSystem.TSType;
        default: string;
    };

    export type CallSignature = {
        typeParameters: TypeSystem.TypeParameter[];
        parameters: TypeSystem.TSType[];
        returnType: TypeDescriptor.Type;
    };

    export type Method = {
        kind: 'method';
        signature: TypeSystem.CallSignature;
    };

    export type TSType =
        | TypeSystem.Accessor
        | TypeSystem.GetSignature
        | TypeSystem.CallSignature
        | TypeSystem.Method;
}

namespace TypeDescriptor {
    export interface Union {
        type: 'or';
        value: TypeDescriptor.Type[];
    }

    export interface Intrinsic {
        type: 'intrinsic';
        value: string;
    }

    export interface Literal {
        type: 'intrinsic';
        value: string;
    }

    export type Reflection = TSType;

    export interface Reference {
        type: 'reference';
        value: string;
    }

    export interface Array {
        type: 'array';
        value: TypeDescriptor.Type;
    }

    export interface Intersection {
        type: 'reference';
        value: TypeDescriptor.Type[];
    }

    export interface Predicate {
        type: 'predicate';
        lhs: string;
        rhs: TypeDescriptor.Type;
    }

    export interface Tuple {
        type: 'tuple';
        value: TypeDescriptor.Type;
    }

    export type Type =
        | TypeDescriptor.Union
        | TypeDescriptor.Intrinsic
        | TypeDescriptor.Literal
        | TypeDescriptor.Reflection
        | TypeDescriptor.Array
        | TypeDescriptor.Intersection
        | TypeDescriptor.Predicate
        | TypeDescriptor.Tuple;
}
