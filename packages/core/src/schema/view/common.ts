import { suppressUnused } from "@/index";
import { ViewArgsImpl } from ".";
import { ViewNullType } from "../dto";
import { AnyModel } from "../model";
import { NullityType, ScalarPropContract, EmbeddedPropContract, ReferencePropContract, CollectionPropContract } from "../prop_contract";
import { MakeEmbeddedDataType } from "./embedded";
import { MakeReferenceDataType } from "./reference";
import { MakeCollectionDataType } from "./collection";

export type TypeWithNullity<
    T, 
    TNullity extends NullityType, 
    TViewNullType extends ViewNullType
> = 
    TNullity extends "NONNULL"
        ? T
        : TViewNullType extends "NULL"
            ? T | null
            : T | undefined;

export interface With<TArgs extends ViewArgsImpl<AnyModel, any>> {

    readonly __with: true;

    readonly __fnPtr: () => TArgs;
}

export function $<const TArgs extends ViewArgsImpl<AnyModel, any>>(
    args: TArgs
): With<TArgs> {
    suppressUnused(args);
    throw new Error("Implement later"); 
}

export type ActionKeys = ExplicitActionKeys | "$explicit";

export type ExplicitActionKeys = "$allScalars" | "$flat" | "$fold" | "$polymorphism" | "$recursive";

export type RestrictKeys<T, TKeys extends string | number | symbol> = {
    [K in keyof T]: K extends TKeys ? T[K] : never;
};

export type PropType<
    TModel extends AnyModel, 
    TKey extends keyof TMembers, 
    TArgs, 
    TMembers, 
    TViewNullType extends ViewNullType
> =
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
    : never;