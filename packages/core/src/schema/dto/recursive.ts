import { AnyModel, IsDerivedModelOf, ModelName } from "../model";
import { AssociatedPropContract, CollectionPropContract } from "../prop_contract";
import { DtoKind, DtoMapping } from "./dto_context";
import { AtLeastOne, EntityTable, Predicate } from "@/dsl";
import { WithNullity } from "./utils";

export interface RecursiveContext<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TMembers
> {

    $recursive<
        TKey extends RecursiveKeys<TModel, TMembers>
    >(
        key: TKey
    ): TMembers[TKey] extends CollectionPropContract<any, any, any, any, any>
        ? CollectionRecursiveMapping<TModel, TDtoKind, TKey, false>
        : ReferenceRecursiveMapping<TModel, TDtoKind, TKey>;
}

export type RecursiveMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TKey extends string,
> = 
    ReferenceRecursiveMapping<TModel, TDtoKind, TKey>
    | CollectionRecursiveMapping<TModel, TDtoKind, TKey, any>;

export interface ReferenceRecursiveMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TKey extends string,
> {
    readonly __mappingType: "RECURSIVE";
    readonly __recursiveType: "REFERENCE";

    as<TAlias extends string>(
        alias: TAlias
    ): ReferenceRecursiveMapping<TModel, TDtoKind, TAlias>;

    depth(
        depth: number
    ): ReferenceRecursiveMapping<TModel, TDtoKind, TKey>;

    where(
        filter: (table: EntityTable<TModel>) => Predicate | undefined
    ): ReferenceRecursiveMapping<TModel, TDtoKind, TKey>;
}

export interface CollectionRecursiveMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TKey extends string,
    THasDepth extends boolean
> {
    readonly __mappingType: "RECURSIVE";
    readonly __recursiveType: "COLLECTION";

    as<TAlias extends string>(
        alias: TAlias
    ): CollectionRecursiveMapping<TModel, TDtoKind, TAlias, THasDepth>;

    depth(
        depth: number
    ): CollectionRecursiveMapping<TModel, TDtoKind, TKey, true>;

    where(
        filter: (table: EntityTable<TModel>) => Predicate | undefined
    ): CollectionRecursiveMapping<TModel, TDtoKind, TKey, THasDepth>;

    orderBy(
        ...orders: AtLeastOne<TModel>
    ): CollectionRecursiveMapping<TModel, TDtoKind, TKey, THasDepth>;
    
    limit(
        maxRows: number
    ): CollectionRecursiveMapping<TModel, TDtoKind, TKey, THasDepth>;
}

export type RecursiveKeys<TModel extends AnyModel, TMembers> = 
    keyof {
        [K in keyof TMembers
            as IsRecursiveProp<TModel, TMembers[K]> extends true
                ? K & string
                : never
        ]: never
    };

type IsRecursiveProp<TModel extends AnyModel, TProp> =
    TProp extends AssociatedPropContract<infer TargetModel, any, any, any, any, any>
        ? Extends<TModel, TargetModel> extends true
            ? true
            : false
        : false;

type Extends<
    TModel1 extends AnyModel,
    TModel2 extends AnyModel
> =
    ModelName<TModel1> extends ModelName<TModel2>
        ? true
        : IsDerivedModelOf<TModel1, TModel2>;

export type ApplyRecursiveMappings<
    TPrevData,
    TMappings extends ReadonlyArray<DtoMapping<any>>
> = 
    TPrevData 
    & WithRecursiveMappings<TPrevData, TMappings>;

type WithRecursiveMappings<
    TPrevData,
    TMappings extends ReadonlyArray<DtoMapping<any>>
> = 
    TMappings extends readonly [infer First, ...infer Rest extends ReadonlyArray<DtoMapping<any>>]
        ? (
            First extends ReferenceRecursiveMapping<any, infer DtoKind, infer Key>
                ? WithRecursiveReference<TPrevData, DtoKind, Key>
                    & WithRecursiveMappings<TPrevData, Rest>
            : First extends CollectionRecursiveMapping<any, infer DtoKind, infer Key, infer HasDepth>
                ? WithRecursiveCollection<TPrevData, DtoKind, Key, HasDepth>
                    & WithRecursiveMappings<TPrevData, Rest>
            : WithRecursiveMappings<TPrevData, Rest>
        )
        : object;

type WithRecursiveReference<
    TPrevData,
    TDtoKind extends DtoKind,
    TKey extends string
> =
    {
        [K in TKey]: WithNullity<
            TPrevData & WithRecursiveReference<TPrevData, TDtoKind, K>,
            "NULLABLE",
            TDtoKind
        >
    };

type WithRecursiveCollection<
    TPrevData,
    TDtoKind extends DtoKind,
    TKey extends string,
    THasDepth
> =
    {
        [K in TKey]: 
            THasDepth extends true 
                ?
                WithNullity<
                    Array<
                        TPrevData & WithRecursiveCollection<TPrevData, TDtoKind, K, THasDepth>
                    >,
                    "NULLABLE",
                    TDtoKind
                >
                : Array<
                    TPrevData & WithRecursiveCollection<TPrevData, TDtoKind, K, THasDepth>
                >
    };
