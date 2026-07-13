import { Prettify } from "@/utils";
import { View, ViewNullType } from "../dto";
import { AllModelMembers, AnyModel } from "../model";
import { 
    ScalarPropContract,
    EmbeddedPropContract, 
    ReferencePropContract,
    CollectionPropContract,
    FormulaPropContract, 
    CalculatedValuePropContract, 
    ParameterizedCalculatedValuePropContract,  
    CalculatedReferencePropContract, 
    ParameterizedCalculatedReferencePropContract, 
    CalculatedCollectionPropContract, 
    ParameterizedCalculatedCollectionPropContract
} from "../prop_contract";
import { AllScalarsArgs, AllScalarsViewTypeRef } from "./all_scalars";
import { CollectionPropArgs } from "./collection";
import { ActionKeys, PropType, RestrictKeys } from "./common";
import { EmbeddedPropArgs } from "./embedded";
import { ReferencePropArgs } from "./reference";
import { ScalarPropArgs } from "./scalar";
import { ApplyPolymorphism, PolymorphismArgs } from "./polymorphism";
import { Fold, MakeFoldType } from "./fold";
import { Flat, FlatArgs, MakeFlatType } from "./flat";
import { ApplyRecursive, Recursive, RecursiveArgs } from "./recursive";
import { CalcuatedAssociationArgs, MakeParameterizedCalculatedAssociations, ParameterizedCalcuatedAssociationArgs, ParameterizedCalculatedValueArgs } from "./calculator";
import { RefereenceKeyPropType, ReferenceKeys, ReferenceKeysArgs } from "./reference_key";
import { AssociatedKeyTypeRef, AssociatedKeysArgs, AssociatedKeys } from "./associated_keys";
import { DtoCreator } from "@/impl/old_dto_creator";
import { Entity } from "@/impl";
import { dtoMapper } from "@/impl/dto_mapper";

export type ViewArgs<TModel extends AnyModel> = 
    ViewArgsImpl<TModel, AllModelMembers<TModel>, "ENTITY">;

export type ViewArgsImpl<TModel extends AnyModel, TMembers, TKind extends ViewArgsKind> = 
    (
        TKind extends "EMBEDDABLE"
            ? BaseViewArgs<TModel, TMembers, TKind>
            : EntityViewArgs<TModel, TMembers, TKind>
    )
    & (
        TKind extends "DERIVED_ENTITY"
            ? object
            : { $allScalars?: AllScalarsArgs<TMembers> }
    )
    & ViewDynmicArgs<TModel, TMembers>;

export type ViewArgsKind = "ENTITY" | "EMBEDDABLE" | "DERIVED_ENTITY";

interface BaseViewArgs<
    TModel extends AnyModel,
    TMembers,
    TKind extends ViewArgsKind
> {
    readonly $flat?: Flat<TModel, TMembers, FlatArgs<TModel, TMembers>>;
    readonly $fold?: Fold<TModel, TMembers, TKind, ViewArgsImpl<TModel, TMembers, TKind>>;
}

interface EntityViewArgs<
    TModel extends AnyModel,
    TMembers,
    TKind extends ViewArgsKind
> extends BaseViewArgs<TModel, TMembers, TKind> {
    readonly $polymorphism?: PolymorphismArgs<TModel>;
    readonly $associatedKeys?: AssociatedKeys<TMembers, AssociatedKeysArgs<TMembers>>;
    readonly $recursive?: Recursive<TModel, TMembers, RecursiveArgs<TModel, TMembers>>;
}

export type ViewDynmicArgs<TModel extends AnyModel, TMembers> = {
    readonly [
        K in keyof TMembers as 
            K extends ActionKeys 
                ? never
            : K
    ]?: PropArgs<TModel, TMembers[K]>;
} & ReferenceKeysArgs<TMembers>;

export type PropArgs<TModel extends AnyModel, TProp> = 
    TProp extends ScalarPropContract<any, any>
        ? ScalarPropArgs
    : TProp extends EmbeddedPropContract<infer Props, any, any>
        ? EmbeddedPropArgs<TModel, Props>
    : TProp extends ReferencePropContract<infer TargetModel, any, any, any, any, any>
        ? ReferencePropArgs<TargetModel>
    : TProp extends CollectionPropContract<infer TargetModel, any, any, any, any>
        ? CollectionPropArgs<TargetModel>
    : TProp extends FormulaPropContract<any, any>
        ? ScalarPropArgs
    : TProp extends CalculatedValuePropContract<any, any>
        ? ScalarPropArgs
    : TProp extends ParameterizedCalculatedValuePropContract<infer Parameter, any, any>
        ? ParameterizedCalculatedValueArgs<Parameter>
    : TProp extends CalculatedReferencePropContract<infer TargetModel, any>
        ? CalcuatedAssociationArgs<TargetModel>
    : TProp extends ParameterizedCalculatedReferencePropContract<infer Parameter, infer TargetModel, any>
        ? ParameterizedCalcuatedAssociationArgs<Parameter, TargetModel>
    : TProp extends CalculatedCollectionPropContract<infer TargetModel>
        ? CalcuatedAssociationArgs<TargetModel>
    : TProp extends ParameterizedCalculatedCollectionPropContract<infer Parameter, infer TargetModel>
        ? ParameterizedCalcuatedAssociationArgs<Parameter, TargetModel>
    : never;

export type ViewType<TModel extends AnyModel, TViewArgs, TViewNullType extends ViewNullType> =
    ViewTypeImpl<TModel, TViewArgs, AllModelMembers<TModel>, TViewNullType>
    
export type ViewTypeImpl<TModel extends AnyModel, TViewArgs, TMembers, TViewNullType extends ViewNullType> = 
    ApplyRecursive<
        ApplyPolymorphism<
            CoreViewTypeImpl<TModel, TViewArgs, TMembers, TViewNullType>,
            TViewArgs,
            TModel,
            TViewNullType
        > & MakeFoldType<
            TViewArgs,
            TModel,
            TMembers,
            TViewNullType
        > & MakeFlatType<
            TViewArgs,
            TModel,
            TMembers,
            TViewNullType
        >,
        TViewArgs,
        TMembers,
        TViewNullType
    >;
    
type CoreViewTypeImpl<TModel extends AnyModel, TViewArgs, TMembers, TViewNullType extends ViewNullType> =
    AllScalarsViewTypeRef<TViewArgs, TMembers, TViewNullType>
    & AssociatedKeyTypeRef<TViewArgs, TMembers, TViewNullType>
    & DynamicViewType<TModel, TViewArgs, TMembers, TViewNullType>;

type DynamicViewType<TModel extends AnyModel, TViewArgs, TMembers, TViewNullType extends ViewNullType> = {
    [
        K in keyof TViewArgs as
            K extends ActionKeys
                ? never
                : TViewArgs[K] extends { flat: any }
                    ? never
                : TViewArgs[K] extends any[]
                    ? never
                : TViewArgs[K] extends { alias: infer Alias extends string }
                    ? Alias
                    : K
    ]: K extends keyof TMembers
        ? PropType<K & keyof TMembers, TViewArgs[K], TModel, TMembers, TViewNullType>
        : RefereenceKeyPropType<K, TViewArgs[K], TMembers, TViewNullType>;
} & MakeParameterizedCalculatedAssociations<TViewArgs, TMembers, TViewNullType>;

export function createView<
    TModel extends AnyModel,
    const TViewArgs extends ViewArgs<TModel>
>(
    model: TModel,
    viewArgs: RestrictKeys<TViewArgs, keyof AllModelMembers<TModel> | ReferenceKeys<AllModelMembers<TModel>> | ActionKeys>
): View<TModel, Prettify<ViewType<TModel, TViewArgs, "NULL">>> {
    const dtoCreator = DtoCreator.of(Entity.of(model), undefined);
    const dto = dtoCreator.create(viewArgs as any);
    return new View(dtoMapper(dto, false));
}
