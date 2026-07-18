import { AnyModel } from "../model";
import { __AllModelMembers } from "../model_internal_types";
import { __AssociatedLikePropContract, __EmbeddedPropContract, __NullityType } from "../prop_internal_types";
import { __AllScalarsMapping } from "./all_scalars";
import { __DtoMapping, __DtoKind } from "./dto_context";

export type __PropModelOf<
    TModel extends AnyModel, 
    TMember
> =
    TMember extends __EmbeddedPropContract<any, any, any>
        ? TModel
    : TMember extends __AssociatedLikePropContract<infer TargetModel, any>
        ? TargetModel
    : never;

export type __TargetMembersOf<
    TMember
> =
    TMember extends __EmbeddedPropContract<infer NestedProps, any, any>
        ? NestedProps
    : TMember extends __AssociatedLikePropContract<infer TargetModel, any>
        ? __AllModelMembers<TargetModel>
    : never;

export type __TargetContextKindOf<
    TMember
> =
    TMember extends __EmbeddedPropContract<any, any, any>
        ? "EMBEDDABLE"
    : TMember extends __AssociatedLikePropContract<any, any>
        ? "ENTITY"
    : never;

export type __TargetMappings<
    TModel extends AnyModel, 
    TMember
> = ReadonlyArray<__DtoMapping<__PropModelOf<TModel, TMember>>>;

export type __DefaultTargetMappings<
    TModel extends AnyModel, 
    TDtoKind extends __DtoKind,
    TMember
> = [ 
    __AllScalarsMapping<__PropModelOf<TModel, TMember>, TDtoKind, __TargetMembersOf<TMember>, never> 
];

export type __WithNullity<T, TNullity extends __NullityType, TDtoKind extends __DtoKind> =
    TNullity extends "NULLABLE"
        ? TDtoKind extends "NULL_VIEW"
            ? T | null
        : TDtoKind extends "UNDEFINED_VIEW"
            ? T | undefined
        : T | null | undefined
    : TNullity extends "INPUT_NONNULL"
        ? TDtoKind extends "NULL_VIEW"
            ? T | null
        : TDtoKind extends "UNDEFINED_VIEW"
            ? T | undefined
        : T
    : T;

export type __SelfMappings<
    TModel extends AnyModel, 
> = ReadonlyArray<__DtoMapping<TModel>>;