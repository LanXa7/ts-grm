import { AnyModel } from "../model";
import { 
    __CalculatedCollectionPropContract, 
    __CalculatedReferencePropContract, 
    __CalculatedValuePropContract, 
    __CollectionPropContract, 
    __EmbeddedPropContract, 
    __NullityOf, 
    __ReferencePropContract, 
    __ScalarLikePropContract, 
    __ScalarPropContract 
} from "../prop_internal_types";
import { __CalculatedCollectionMapping, __CalculatedReferenceMapping } from "./calculator";
import { __CollectionMapping } from "./collection";
import { __DtoKind } from "./dto_context";
import { __EmbeddedMapping } from "./embedded";
import { __ReferenceMapping } from "./reference";
import { __ScalarLikeMapping } from "./scalar_like";
import { __DefaultTargetMappings } from "./utils";

export type __DirectContext<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TMembers
> = {
    [
        K in keyof TMembers as 
            __IsScalarLikeProp<TMembers[K], TDtoKind> extends true
                ? K
            : TMembers[K] extends __EmbeddedPropContract<any, any, any>
                ? K
            : TMembers[K] extends __ReferencePropContract<any, any, any, any, any, any>
                ? K
            : TMembers[K] extends __CollectionPropContract<any, any, any, any, any>
                ? K
            : TMembers[K] extends __CalculatedValuePropContract<any, any>
                ? __IfView<K, TDtoKind>
            : TMembers[K] extends __CalculatedReferencePropContract<any, any>
                ? __IfView<K, TDtoKind>
            : TMembers[K] extends __CalculatedCollectionPropContract<any>
                ? __IfView<K, TDtoKind>
            : never
    ]: 
        __IsScalarLikeProp<TMembers[K], TDtoKind> extends true
            ? __ScalarLikeMapping<
                TModel, 
                TDtoKind,
                K & string, 
                __ScalarTypeOf<TMembers[K]>,
                __NullityOf<TMembers[K]>
            >
        : TMembers[K] extends __EmbeddedPropContract<any, any, any>
            ? __EmbeddedMapping<
                TModel, 
                TDtoKind,
                K & string, 
                TMembers[K], 
                __DefaultTargetMappings<TModel, TDtoKind, TMembers[K]>
            >
        : TMembers[K] extends __ReferencePropContract<any, any, any, any, any, any>
            ? __ReferenceMapping<
                TModel, 
                TDtoKind,
                K & string, 
                TMembers[K],
                __DefaultTargetMappings<TModel, TDtoKind, TMembers[K]>,
                __NullityOf<TMembers[K]>
            >
        : TMembers[K] extends __CollectionPropContract<any, any, any, any, any>
            ? __CollectionMapping<
                TModel, 
                TDtoKind,
                K & string, 
                TMembers[K],
                __DefaultTargetMappings<TModel, TDtoKind, TMembers[K]>
            >
        : TMembers[K] extends __CalculatedValuePropContract<infer Value, infer Nullity>
            ? __IfView<
                __ScalarLikeMapping<
                    TModel, 
                    TDtoKind,
                    K & string, 
                    Value, 
                    Nullity
                >,
                TDtoKind
            >
        : TMembers[K] extends __CalculatedReferencePropContract<any, infer Nullity>
            ? __IfView<
                __CalculatedReferenceMapping<
                    TModel, 
                    TDtoKind,
                    K & string, 
                    TMembers[K],
                    __DefaultTargetMappings<TModel, TDtoKind, TMembers[K]>,
                    Nullity
                >,
                TDtoKind
            >
        : TMembers[K] extends __CalculatedCollectionPropContract<any>
            ? __IfView<
                __CalculatedCollectionMapping<
                    TModel, 
                    TDtoKind,
                    K & string, 
                    TMembers[K],
                    __DefaultTargetMappings<TModel, TDtoKind, TMembers[K]>
                >,
                TDtoKind
            >
        : never;
}

export type __IsScalarLikeProp<TMember, TDtoKind extends __DtoKind> =
    TDtoKind extends "INPUT"
        ? TMember extends __ScalarPropContract<any, any> ? true : false
        : TMember extends __ScalarLikePropContract<any, any> ? true : false;

export type __ScalarTypeOf<TMember> =
    TMember extends __ScalarLikePropContract<infer Value, any> 
        ? Value 
        : never

export type __IfView<T, TDtoKind> = 
    TDtoKind extends "INPUT"
        ? never
        : T;