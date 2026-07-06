import { UnionToIntersection } from "@/utils";
import { ViewArgsImpl, ViewTypeImpl } from ".";
import { ViewNullType } from "../dto";
import { AnyModel, DeclaredModelMembers, DerivedModel, ModelName, ModelSuperNames } from "../model";
import { ExplicitActionKeys, RestrictKeys } from "./common";
import { ReferenceKeys } from "./reference_key";

export type PolymorphismArgs<TModel extends AnyModel> =
    (ctx: PolymorphismContext<TModel, []>) => PolymorphismContext<TModel, any>;

export interface PolymorphismContext<
    TModel extends AnyModel, 
    TEntries extends ReadonlyArray<PolymorphismEntry<any, TModel, any>>
> {
    
    readonly entries: TEntries;

    when<
        TDerivedModel extends AnyModel,
        const TArgs extends ViewArgsImpl<TDerivedModel, DeclaredModelMembers<TDerivedModel>, "DERIVED_ENTITY">
    >(
        derivedModel: DerivedModel<TDerivedModel, TModel>,
        args: RestrictKeys<TArgs, keyof DeclaredModelMembers<TDerivedModel> | ReferenceKeys<DeclaredModelMembers<TDerivedModel>> | ExplicitActionKeys>
    ): PolymorphismContext<TModel, [...TEntries, PolymorphismEntry<TDerivedModel, TModel, TArgs>]>;
}

export interface PolymorphismEntry<
    TDerivedModel extends AnyModel, 
    TModel extends AnyModel,
    TArgs extends ViewArgsImpl<TDerivedModel, DeclaredModelMembers<TDerivedModel>, "DERIVED_ENTITY">
> {
    readonly derivedModel: TDerivedModel;
    readonly model: TModel;
    readonly args: TArgs;
}

export type ApplyPolymorphism<T, TViewArgs, TModel extends AnyModel, TViewNullType extends ViewNullType> = 
    TViewArgs extends { $polymorphism: infer PolymorphismArgs }
        ? MakePolymorphismType<
            T,
            PolymorphismArgs,
            TModel,
            TViewNullType
        >
        : T;

type MakePolymorphismType<
    T, 
    TPolymorphismArgs, 
    TModel extends AnyModel, 
    TViewNullType extends ViewNullType
> = 
    TPolymorphismArgs extends (
        ctx: PolymorphismContext<TModel, []>
    ) => PolymorphismContext<TModel, infer Array>
        ? Array extends []
            ? T
        : ArrayToPolymorphismUnion<
            T,
            Array,
            TModel,
            TViewNullType
        >
    : T;

type DerivedType<
    T,
    X,
    TDerivedModel extends AnyModel,
    TModel extends AnyModel,
> = ( 
    [X] extends [{__typename: string}]
        ? X
            & SuperFields<
                T, 
                ModelSuperNames<TDerivedModel>
            >
        : { __typename: ModelName<TDerivedModel> } 
            & X
            & SuperFields<
                T, 
                ModelSuperNames<TDerivedModel>
            >
) | (
    [T] extends [{__typename: string}]
        ? T
        : { __typename: ModelName<TModel> } & T
);

type SuperFields<
    TPrevData,
    TTypeNames extends string
> = [TPrevData] extends [{ __typename: string }]
    ? UnionToIntersection<
        ExtractSuperFields<TPrevData, TTypeNames>
    >
    : TPrevData;

type ExtractSuperFields<
    TPrevData,
    TTypeNames extends string,
> = TTypeNames extends any
    ? ExtractByTypeName<TPrevData, TTypeNames> extends infer ST
        ? ST extends { __typename: string }
            ? Omit<ST, "__typename">
            : never
        : never
    : never;

type ExtractByTypeName<TUnion, TTypeNames> = 
    TUnion extends { __typename: TTypeNames } 
        ? TUnion 
        : never;

type ArrayToPolymorphismUnion<
    T,
    TArray extends ReadonlyArray<PolymorphismEntry<any, any, any>>,
    TModel extends AnyModel,
    TViewNullType extends ViewNullType
> = 
    TArray extends readonly [infer First, ...infer Rest]
        ? First extends PolymorphismEntry<infer DerivedModel, any, infer DerivedArgs>
            ? DerivedType<
                T,
                ViewTypeImpl<DerivedModel, DerivedArgs, DeclaredModelMembers<DerivedModel>, TViewNullType>,
                DerivedModel,
                TModel
            >
            | (Rest extends ReadonlyArray<PolymorphismEntry<any, any, any>>
                ? ArrayToPolymorphismUnion<T, Rest, TModel, TViewNullType>
                : never)
            : never
        : never;
