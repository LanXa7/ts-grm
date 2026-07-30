import { __UnionToIntersection } from "@/auxiliary_types";
import { AnyModel } from "../model";
import { __AllScalarsContext, __AllScalarsDtoType, __AllScalarsMapping } from "./all_scalars";
import { __AssociatedKeysContext, __AssociatedKeysDtoType, __AssociatedKeysMapping } from "./associated_keys";
import { __CollectionDtoType, __CollectionMapping } from "./collection";
import { __EmbeddedDtoType, __EmbeddedMapping } from "./embedded";
import { __FlatContext, __FlatDtoType, __FlatMapping } from "./flat";
import { __FoldContext, __FoldDtoType, __FoldMapping } from "./fold";
import { __ReferenceDtoType, __ReferenceMapping } from "./reference";
import { __ReferenceKeyContext, __ReferenceKeyDtoType, __ReferenceKeyMapping } from "./reference_key";
import { __ScalarLikeDtoType, __ScalarLikeMapping } from "./scalar_like";
import { __DirectContext } from "./direct";
import { __ApplyInstanceOfMappings, __InstanceOfContext, __InstanceOfMappping } from "./instance_of";
import { ApplyRecursiveMappings, __RecursiveContext, __RecursiveMapping } from "./recursive";
import { __CalculatedCollectionDtoType, __CalculatedCollectionMapping, __CalculatedReferenceDtoType, __CalculatedReferenceMapping, __ParameterizedContext } from "./calculator";
import { __FormulaContext } from "./formula";

export type __DtoContext<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TContextKind extends __ContextKind,
    TMembers
> = 
    __DirectContext<TModel, TDtoKind, TMembers>
    & __FoldContext<TModel, TDtoKind, TContextKind, TMembers>
    & __FlatContext<TModel, TDtoKind, TMembers>
    & __ParameterizedContext<TModel, TDtoKind, TMembers>
    & __InstanceOfContext<TModel, TDtoKind>
    & __RecursiveContext<TModel, TDtoKind, TMembers>
    & (
        TContextKind extends "EMBEDDABLE"
            ? object
            : __ReferenceKeyContext<TModel, TDtoKind, TMembers>
    )
    & (
        TContextKind extends "EMBEDDABLE"
            ? object
            : __AssociatedKeysContext<TModel, TDtoKind, TMembers>
    )
    & (
        TContextKind extends "DERIVED_ENTITY"
            ? object
            : __AllScalarsContext<TModel, TDtoKind, TMembers>
    )
    & (
        TContextKind extends "EMBEDDABLE"
            ? object
            : __FormulaContext<TModel, TDtoKind, "ENTITY", TMembers>
    );

export type __ContextKind = "ENTITY" | "EMBEDDABLE" | "DERIVED_ENTITY";

export type __DtoKind = "NULL_VIEW" | "UNDEFINED_VIEW" | "INPUT";

export interface __DtoBody<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TContextKind extends __ContextKind,
    TMembers,
    TMappings extends ReadonlyArray<__DtoMapping<TModel>>
> {

    (
        ctx: __DtoContext<TModel, TDtoKind, TContextKind, TMembers>
    ): TMappings;
}

export type __DtoMapping<
    TModel extends AnyModel
> = 
    __AllScalarsMapping<TModel, any, any, any> 
    | __FoldMapping<TModel, any, any, any>
    | __FlatMapping<TModel, any, any, any, any, any>
    | __InstanceOfMappping<TModel, any, any, any>
    | __RecursiveMapping<TModel, any, any>
    | __ScalarLikeMapping<TModel, any, any, any, any>
    | __EmbeddedMapping<TModel, any, any, any, any>
    | __ReferenceKeyMapping<TModel, any, any, any>
    | __AssociatedKeysMapping<TModel, any, any, any>
    | __ReferenceMapping<TModel, any, any, any, any, any>
    | __CollectionMapping<TModel, any, any, any, any>
    | __CalculatedReferenceMapping<TModel, any, any, any, any, any>
    | __CalculatedCollectionMapping<TModel, any, any, any, any>;

export type __DtoType<
    TMappings extends ReadonlyArray<__DtoMapping<any>>
> = 
    ApplyRecursiveMappings<
        __ApplyInstanceOfMappings<
            __UnionToIntersection<{
                [K in keyof TMappings]: __DtoMappingType<TMappings[K]>
            }[number]>,
            TMappings
        >,
        TMappings
    >;
    
export type __DtoMappingType<
    TMapping extends __DtoMapping<any>
> =
    TMapping["__mappingType"] extends "SCALAR_LIKE"
        ? __ScalarLikeDtoType<TMapping>
    : TMapping["__mappingType"] extends "ALL_SCALARS"
        ? __AllScalarsDtoType<TMapping>
    : TMapping["__mappingType"] extends "EMBEDDED"
        ? __EmbeddedDtoType<TMapping>
    : TMapping["__mappingType"] extends "REFERENCE"
        ? __ReferenceDtoType<TMapping>
    : TMapping["__mappingType"] extends "COLLECTION"
        ? __CollectionDtoType<TMapping>
    : TMapping["__mappingType"] extends "REFERENCE_KEY"
        ? __ReferenceKeyDtoType<TMapping>
    : TMapping["__mappingType"] extends "ASSOCIATED_KEYS"
        ? __AssociatedKeysDtoType<TMapping>
    : TMapping["__mappingType"] extends "FOLD"
        ? __FoldDtoType<TMapping>
    : TMapping["__mappingType"] extends "FLAT"
        ? __FlatDtoType<TMapping>
    : TMapping["__mappingType"] extends "CALCULATED_REFERENCE"
        ? __CalculatedReferenceDtoType<TMapping>
    : TMapping["__mappingType"] extends "CALCULATED_COLLECTION"
        ? __CalculatedCollectionDtoType<TMapping>
    : never;