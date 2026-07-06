import { UnionToIntersection } from "@/utils";
import { ViewNullType } from "../dto";
import { AllModelMembers, AnyModel } from "../model";
import { ActionKeys, RestrictKeys, TypeWithNullity, With } from "./common";
import { EmbeddedPropContract, NullityType, ReferencePropContract } from "../prop_contract";
import { ViewArgs, ViewArgsImpl } from ".";
import { EntityTable, NullityOf, Predicate, ReferenceFetchType } from "@/internal_types";
import { MakeEmbeddedDataType } from "./embedded";
import { MakeReferenceDataType } from "./reference";

export interface Flat<
    TModel extends AnyModel, 
    TMembers,
    TArgs extends FlatArgs<TModel, TMembers>
> {

    (ctx: FlatContext<TModel, TMembers>): TArgs;
}

interface FlatContext<
    TModel extends AnyModel, 
    TMembers,
> {
    <const TArgs extends FlatArgs<TModel, TMembers>>(
        args: RestrictKeys<TArgs, keyof FlatArgs<TModel, TMembers>>
    ): TArgs;
}

export type FlatArgs<TModel extends AnyModel, TMembers> = {
    readonly [
        K in keyof TMembers as 
            K extends ActionKeys
                ? never
            : TMembers[K] extends EmbeddedPropContract<any, any, any>
                ? K
            : TMembers[K] extends ReferencePropContract<any, any, any, any, any, any>
                ? K
            : never
    ]?: FlatPropArgs<TModel, TMembers[K]>;
};

export type FlatPropArgs<TModel extends AnyModel, TProp> = 
    TProp extends EmbeddedPropContract<infer Props, any, any>
        ? FlatEmbeddedPropArgs<TModel, Props>
    : TProp extends ReferencePropContract<infer TargetModel, any, any, any, any, any>
        ? FlatReferencePropArgs<TargetModel>
    : never;

type FlatEmbeddedPropArgs<TModel extends AnyModel, TMembers> =
    true 
    | With<TModel, TMembers, "EMBEDDABLE", ViewArgsImpl<TModel, TMembers, "EMBEDDABLE">>
    | FlatEmbeddedPropArgsImpl<TModel, TMembers>;

interface FlatEmbeddedPropArgsImpl<TModel extends AnyModel, TMembers> { 
    readonly prefix?: string;
    readonly with?: With<TModel, TMembers, "EMBEDDABLE", ViewArgsImpl<TModel, TMembers, "EMBEDDABLE">>;
};

type FlatReferencePropArgs<
    TModel extends AnyModel,
> = 
    true 
    | With<TModel, AllModelMembers<TModel>, "ENTITY", ViewArgs<TModel>> 
    | FlatReferencePropArgsImpl<TModel>;

interface FlatReferencePropArgsImpl<
    TModel extends AnyModel
> {
    readonly prefix?: string;
    readonly fetchType?: ReferenceFetchType;
    readonly where?: (table: EntityTable<TModel>) => Predicate | undefined,
    readonly with?: With<TModel, AllModelMembers<TModel>, "ENTITY", ViewArgs<TModel>>;
}

export type MakeFlatType<
    TViewArgs, TModel extends AnyModel, TMembers, TViewNullType extends ViewNullType> =
    TViewArgs extends { readonly $flat: Flat<TModel, TMembers, infer FlatArgs> }
        ? UnionToIntersection<
            Values<
                MakeFlatItemType<FlatArgs, TModel, TMembers, TViewNullType>
            >
        >
        : object;

type Values<T> = T[keyof T];

type MakeFlatItemType<TFlatArgs, TModel extends AnyModel, TMembers, TViewNullType extends ViewNullType> =
    {
        [
            K in keyof TFlatArgs as
                PrefixOf<K & string, TFlatArgs[K]>
        ]: FlatType<
            RawBody<
                TMembers[K & keyof TMembers],
                TFlatArgs[K],
                TModel,
                TViewNullType
            >,
            PrefixOf<K & string, TFlatArgs[K]>,
            NullityOf<TMembers[K & keyof TMembers]>,
            TViewNullType
        >
    }

type PrefixOf<K extends string, TArgs> =
    TArgs extends { prefix: infer Prefix extends string }
        ? Prefix
        : K;

type FlatType<
    TRawType,
    TPrefix extends string,
    TNullitty extends NullityType,
    TViewNullType extends ViewNullType
> = 
    {
        [
            K in keyof TRawType as
                CapitalizeIfNeeded<TPrefix, K & string>
        ]: TypeWithNullity<TRawType[K], TNullitty, TViewNullType>
    };

type RawBody<
    TMember,
    TArg, 
    TModel extends AnyModel,
    TViewNullType extends ViewNullType
> =
    TMember extends EmbeddedPropContract<infer NestedProps, any, any>
        ? MakeEmbeddedDataType<TArg, TModel, NestedProps, TViewNullType>
    : TMember extends ReferencePropContract<infer TargetModel, any, any, any, any, any>
        ? MakeReferenceDataType<TArg, TargetModel, TViewNullType>
    : never;

type CapitalizeIfNeeded<K extends string, V extends string> = 
    K extends '' 
    ? V 
    : `${K}${Capitalize<V>}`;
