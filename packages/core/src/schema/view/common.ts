import { ViewArgsImpl } from ".";
import { ViewNullType } from "../dto";
import { AnyModel } from "../model";
import { 
    NullityType, 
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
import { MakeEmbeddedDataType } from "./embedded";
import { MakeReferenceDataType } from "./reference";
import { MakeCollectionDataType } from "./collection";
import { ReferenceKeys } from "./reference_key";

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

export type With<
    TModel extends AnyModel, 
    TMembers,
    TArgs extends ViewArgsImpl<TModel, TMembers>
> = (ctx: WithContext<TModel, TMembers>) => TArgs

export interface WithContext<
    TModel extends AnyModel, 
    TMembers,
> {
    <const TArgs extends ViewArgsImpl<TModel, TMembers>>(
        args: RestrictKeys<TArgs, keyof TMembers | ReferenceKeys<TMembers> | ActionKeys>
    ): TArgs;
}

export type ActionKeys = ExplicitActionKeys | "$explicit";

export type ExplicitActionKeys = "$allScalars" | "$flat" | "$fold" | "$polymorphism" | "$associatedKeys" | "$recursive";

export type RestrictKeys<T, TKeys extends string | number | symbol> = {
    [K in keyof T]: K extends TKeys ? T[K] : never;
};

export type PropType<
    TKey extends keyof TMembers, 
    TArgs, 
    TModel extends AnyModel, 
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
    : TMembers[TKey] extends FormulaPropContract<infer R, infer Nullity>
        ? TypeWithNullity<R, Nullity, TViewNullType>
    : TMembers[TKey] extends CalculatedValuePropContract<infer R, infer Nullity>
        ? TypeWithNullity<R, Nullity, TViewNullType>
    : TMembers[TKey] extends ParameterizedCalculatedValuePropContract<any, infer R, infer Nullity>
        ? TypeWithNullity<R, Nullity, TViewNullType>
    : TMembers[TKey] extends CalculatedReferencePropContract<infer TargetModel, infer Nullity>
        ? TypeWithNullity<
            MakeReferenceDataType<TArgs, TargetModel, TViewNullType>,
            Nullity,
            TViewNullType
        >
    : TMembers[TKey] extends ParameterizedCalculatedReferencePropContract<any, infer TargetModel, infer Nullity>
        ? TypeWithNullity<
            MakeReferenceDataType<TArgs, TargetModel, TViewNullType>,
            Nullity,
            TViewNullType
        >
    : TMembers[TKey] extends CalculatedCollectionPropContract<infer TargetModel>
        ? MakeCollectionDataType<TArgs, TargetModel, TViewNullType>
    : TMembers[TKey] extends ParameterizedCalculatedCollectionPropContract<any, infer TargetModel>
        ? MakeCollectionDataType<TArgs, TargetModel, TViewNullType>
    : never;
