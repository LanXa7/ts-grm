import { AllModelMembers, AnyModel } from "../model";
import { AssociatedLikePropContract, EmbeddedPropContract, NullityType, PropContract } from "../prop_contract";
import { AllScalarsMapping } from "./all_scalars";
import { DtoMapping, DtoKind } from "./common";

export type TargetModelOf<
    TModel extends AnyModel, 
    TMember
> =
    TMember extends EmbeddedPropContract<any, any, any>
        ? TModel
    : TMember extends AssociatedLikePropContract<infer TargetModel, any>
        ? TargetModel
    : never;

export type TargetMembersOf<
    TMember
> =
    TMember extends EmbeddedPropContract<infer NestedProps, any, any>
        ? NestedProps
    : TMember extends AssociatedLikePropContract<infer TargetModel, any>
        ? AllModelMembers<TargetModel>
    : never;

export type TargetContextKindOf<
    TMember
> =
    TMember extends EmbeddedPropContract<any, any, any>
        ? "EMBEDDABLE"
    : TMember extends AssociatedLikePropContract<any, any>
        ? "ENTITY"
    : never;

export type TargetMappings<
    TModel extends AnyModel, 
    TMember
> = ReadonlyArray<DtoMapping<TargetModelOf<TModel, TMember>>>;

export type DefaultTargetMappings<
    TModel extends AnyModel, 
    TDtoKind extends DtoKind,
    TMember
> = [ 
    AllScalarsMapping<TargetModelOf<TModel, TMember>, TDtoKind, TargetMembersOf<TMember>, never> 
];

export type WithNullity<T, TNullity extends NullityType, TDtoKind extends DtoKind> =
    TNullity extends "NULLABLE"
        ? TDtoKind extends "NULL_VIEW"
            ? T | null
        : TDtoKind extends "UNDFINED_VIEW"
            ? T | undefined
        : T | null | undefined
    : TNullity extends "INPUT_NONNULL"
        ? TDtoKind extends "NULL_VIEW"
            ? T | null
        : TDtoKind extends "UNDFINED_VIEW"
            ? T | undefined
        : T
    : T;

export type NullityOf<TMember> =
    TMember extends PropContract<any, infer Nullity>
        ? Nullity
        : "NONNULL";

export type SelfMappings<
    TModel extends AnyModel, 
> = ReadonlyArray<DtoMapping<TModel>>;