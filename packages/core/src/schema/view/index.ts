import { Prettify, suppressUnused } from "@/utils";
import { View, ViewNullType } from "../dto";
import { AllModelMembers, AnyModel } from "../model";
import { CollectionPropContract, EmbeddedPropContract, ReferencePropContract, ScalarPropContract } from "../prop_contract";
import { AllScalarsArgs, AllScalarsViewTypeRef } from "./all_scalars";
import { CollectionPropArgs, MakeCollectionDataType } from "./collection";
import { ActionKeys, RestrictKeys, TypeWithNullity } from "./common";
import { EmbeddedPropArgs, MakeEmbeddedDataType } from "./embedded";
import { MakeReferenceDataType, ReferencePropArgs } from "./reference";
import { ScalarPropArgs } from "./scalar";
//import { ApplyPolymorphism, PolymorphismArgs } from "./polymorphism";

export type ViewArgs<TModel extends AnyModel> = 
    ViewArgsImpl<TModel, AllModelMembers<TModel>>;

export type ViewArgsImpl<TModel extends AnyModel, TMembers> = 
    ExplicitViewStaticArgs<TModel>
    & { $allScalars?: AllScalarsArgs<TMembers> }
    & ViewDynmicArgs<TModel, TMembers>;

export type ExplicitViewArgs<TModel extends AnyModel, TMembers> = 
    ExplicitViewStaticArgs<TModel>
    & ViewDynmicArgs<TModel, TMembers>;

export interface ExplicitViewStaticArgs<
    _TModel extends AnyModel
> {
    //readonly $polymorphism?: PolymorphismArgs<TModel>;
}

export type ViewDynmicArgs<TModel extends AnyModel, TMembers> = {
    readonly [
        K in keyof TMembers as 
            K extends ActionKeys 
                ? never
            : K
    ]?: PropArgs<TModel, TMembers[K]>;
};

export type PropArgs<TModel extends AnyModel, TProp> = 
    TProp extends ScalarPropContract<any, any>
        ? ScalarPropArgs
    : TProp extends EmbeddedPropContract<infer Props, any, any>
        ? EmbeddedPropArgs<TModel, Props>
    : TProp extends ReferencePropContract<infer TargetModel, any, any, any, any, any>
        ? ReferencePropArgs<TargetModel>
    : TProp extends CollectionPropContract<infer TargetModel, any, any, any, any>
        ? CollectionPropArgs<TargetModel>
    : never;

export type ViewType<TModel extends AnyModel, TViewArgs, TViewNullType extends ViewNullType> =
    ViewTypeImpl<TModel, TViewArgs, AllModelMembers<TModel>, TViewNullType>
    
export type ViewTypeImpl<TModel extends AnyModel, TViewArgs, TMembers, TViewNullType extends ViewNullType> = 
    // ApplyPolymorphism<
    //     CoreViewTypeImpl<TModel, TViewArgs, TMembers, TViewNullType>,
    //     TViewArgs,
    //     TModel,
    //     TViewNullType
    // >;
    CoreViewTypeImpl<TModel, TViewArgs, TMembers, TViewNullType>;

type CoreViewTypeImpl<TModel extends AnyModel, TViewArgs, TMembers, TViewNullType extends ViewNullType> =
    AllScalarsViewTypeRef<TViewArgs, TMembers, TViewNullType>
    & DynamicViewType<TModel, TViewArgs, TMembers, TViewNullType>;

type DynamicViewType<TModel extends AnyModel, TViewArgs, TMembers, TViewNullType extends ViewNullType> = {
    [
        K in keyof TViewArgs as
            K extends ActionKeys
                ? never
                : TViewArgs[K] extends { alias: infer Alias extends string }
                    ? Alias
                    : K
    ]: PropType<TModel, K & keyof TMembers, TViewArgs[K], TMembers, TViewNullType>;
};

type PropType<TModel extends AnyModel, TKey extends keyof TMembers, TArgs, TMembers, TViewNullType extends ViewNullType> =
    TMembers[TKey] extends ScalarPropContract<infer R, infer Nullity>
        ? TypeWithNullity<R, Nullity, TViewNullType>
    : TMembers[TKey] extends EmbeddedPropContract<infer Props, infer Nullity, any>
        ? TypeWithNullity<
            MakeEmbeddedDataType<TArgs, TModel, Props, TViewNullType>,
            Nullity,
            TViewNullType
        >
    : TMembers[TKey] extends ReferencePropContract<infer TargetModel, infer Nullity, any, any, any, any>
        ? TypeWithNullity<
            MakeReferenceDataType<TArgs, TargetModel, TViewNullType>,
            TArgs extends { where: any} ? "NULLABLE" : Nullity,
            TViewNullType
        >
    : TMembers[TKey] extends CollectionPropContract<infer TargetModel, any, any, any, any>
        ? MakeCollectionDataType<TArgs, TargetModel, TViewNullType>
    : string;

export function createView<
    TModel extends AnyModel,
    const TViewArgs extends ViewArgs<TModel>
>(
    model: TModel,
    viewArgs: RestrictKeys<TViewArgs, keyof AllModelMembers<TModel> | ActionKeys>
): View<TModel, Prettify<ViewType<TModel, TViewArgs, "NULL">>> {
    suppressUnused(model);
    suppressUnused(viewArgs);
    throw new Error();
}
