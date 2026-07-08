import { AllModelMembers, AnyModel } from "../model";
import { AssociatedPropContract, EmbeddedPropContract, NullityType, PropContract } from "../prop_contract";
import { AllScalarsMapping, DefaultKeys } from "./all_scalars";
import { DtoMapping, DtoKind } from "./common";

export type TargetModelOf<
    TModel extends AnyModel, 
    TMember
> =
    TMember extends EmbeddedPropContract<any, any, any>
        ? TModel
    : TMember extends AssociatedPropContract<infer TargetModel, any, any, any, any, any>
        ? TargetModel
    : never;

export type TargetMembersOf<
    TMember
> =
    TMember extends EmbeddedPropContract<infer NestedProps, any, any>
        ? NestedProps
    : TMember extends AssociatedPropContract<infer TargetModel, any, any, any, any, any>
        ? AllModelMembers<TargetModel>
    : never;

export type TargetContextKindOf<
    TMember
> =
    TMember extends EmbeddedPropContract<any, any, any>
        ? "EMBEDDABLE"
    : TMember extends AssociatedPropContract<any, any, any, any, any, any>
        ? "ENTITY"
    : never;

export type TargetMappings<
    TModel extends AnyModel, 
    TMember
> = ReadonlyArray<DtoMapping<TargetModelOf<TModel, TMember>>>;

export type DefaultTargetMappings<
    TModel extends AnyModel, 
    TMember
> = [ 
    AllScalarsMapping<TargetModelOf<TModel, TMember>, TargetMembersOf<TMember>, DefaultKeys<TargetMembersOf<TMember>>> 
];

export type WithNullity<T, TNullity extends NullityType, TDtoKind extends DtoKind> =
    TNullity extends "NULLABLE"
        ? TDtoKind extends "NULL_VIEW"
            ? T | null
        : TNullity extends "UNDFINED_VIEW"
            ? T | undefined
        : T | null | undefined
    : TNullity extends "INPUT_NONNULL"
        ? TDtoKind extends "NULL_VIEW"
            ? T | null
        : TNullity extends "UNDFINED_VIEW"
            ? T | undefined
        : T
    : T;

export type NullityOf<TMember> =
    TMember extends PropContract<any, infer Nullity>
        ? Nullity
        : "NONNULL";
