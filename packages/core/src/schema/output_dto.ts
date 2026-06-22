import { AtLeastOne } from "../dsl/utils";
import { AllModelMembers, AnyModel, DerivedModel, Extends, RequiredModelKey, ModelName, ModelSuperNames, DeclaredModelMembers } from "@/schema/model";
import { CollectionProp, EmbeddedProp, NullityOf, ReferenceProp, DirectTypeOf, ScalarProp, NullityType, AssociatedProp, Prop, FormulaProp, CalculatedValueProp, ParameterizedCalculatedValueProp, CalculatedReferenceProp, ParameterizedCalculatedReferenceProp, CalculatedCollectionProp, ParameterizedCalculatedCollectionProp } from "@/schema/prop";
import { UnionToIntersection } from "@/utils";
import { ModelOrder } from "./order";
import { EntityTable, Table } from "../dsl/table";
import { Predicate } from "@/dsl/expression";
import { ViewNullType } from "./dto";

export type ViewBuilder<
    TModel extends AnyModel,
    TMembers, 
    TViewNullType extends ViewNullType,
    TCurrent, 
    TRecursiveKindMap extends RecursiveKindMap,
    TLastProp, 
    TLastName extends string
> = {
    [K in keyof TMembers]:
        TMembers[K] extends ScalarProp<infer R, infer Nullity>
            ? ViewBuilder<
                TModel,
                TMembers, 
                TViewNullType,
                TransformedType<
                    TViewNullType,
                    TCurrent, 
                    XTypeOfView<K, R, Nullity, TViewNullType>, 
                    TRecursiveKindMap
                >,
                TRecursiveKindMap,
                TMembers[K],
                K & string
            >
        : TMembers[K] extends ReferenceProp<infer R, infer Nullity, any, any, any, any>
            ? <X = AllScalarsType<AllModelMembers<R>, TViewNullType>>(
                fn?: (
                    builder: ViewBuilder<R, AllModelMembers<R>, TViewNullType, {}, {}, any, any>
                ) => ViewBuilder<R, AllModelMembers<R>, TViewNullType, X, any, any, any>
            ) => ViewBuilder<
                TModel,
                TMembers,
                TViewNullType,
                TransformedType<
                    TViewNullType,
                    TCurrent, 
                    XTypeOfView<K, X, Nullity, TViewNullType>, 
                    TRecursiveKindMap
                >,
                TRecursiveKindMap,
                TMembers[K],
                K & string
            >
        : TMembers[K] extends CollectionProp<infer R>
            ? <X = AllScalarsType<AllModelMembers<R>, TViewNullType>>(
                fn?: (
                    builder: ViewBuilder<R, AllModelMembers<R>, TViewNullType, {}, {}, any, any>
                ) => ViewBuilder<R, AllModelMembers<R>, TViewNullType, X, any, any, any>
            ) => ViewBuilder<
                TModel,
                TMembers,
                TViewNullType,
                TransformedType<
                    TViewNullType,
                    TCurrent, 
                    XTypeOfView<K, X[], "NONNULL", TViewNullType>, 
                    TRecursiveKindMap
                >,
                TRecursiveKindMap,
                TMembers[K],
                K & string
            >
        : TMembers[K] extends EmbeddedProp<infer R, infer Nullity, any>
            ? EmbeddedMethods<TModel, TMembers, TViewNullType, TCurrent, TRecursiveKindMap, K, R, Nullity>
        : TMembers[K] extends FormulaProp<infer R, infer Nullity>
            ? ViewBuilder<
                TModel,
                TMembers, 
                TViewNullType,
                TransformedType<
                    TViewNullType,
                    TCurrent, 
                    XTypeOfView<K, R, Nullity, TViewNullType>, 
                    TRecursiveKindMap
                >,
                TRecursiveKindMap,
                TMembers[K],
                K & string
            >
        : TMembers[K] extends CalculatedValueProp<infer R, infer Nullity>
            ? ViewBuilder<
                TModel,
                TMembers, 
                TViewNullType,
                TransformedType<
                    TViewNullType,
                    TCurrent, 
                    XTypeOfView<K, R, Nullity, TViewNullType>, 
                    TRecursiveKindMap
                >,
                TRecursiveKindMap,
                TMembers[K],
                K & string
            >
        : TMembers[K] extends ParameterizedCalculatedValueProp<
            infer Parameter, 
            infer R, 
            infer Nullity
        >
            ? (parameter: Parameter) => ViewBuilder<
                TModel,
                TMembers, 
                TViewNullType,
                TransformedType<
                    TViewNullType,
                    TCurrent, 
                    XTypeOfView<K, R, Nullity, TViewNullType>, 
                    TRecursiveKindMap
                >,
                TRecursiveKindMap,
                TMembers[K],
                K & string
            >
        : TMembers[K] extends CalculatedReferenceProp<infer R, infer Nullity>
            ? <X = AllScalarsType<AllModelMembers<R>, TViewNullType>>(
                fn?: (
                    builder: ViewBuilder<R, AllModelMembers<R>, TViewNullType, {}, {}, any, any>
                ) => ViewBuilder<R, AllModelMembers<R>, TViewNullType, X, any, any, any>
            ) => ViewBuilder<
                TModel,
                TMembers,
                TViewNullType,
                TransformedType<
                    TViewNullType,
                    TCurrent, 
                    XTypeOfView<K, X, Nullity, TViewNullType>, 
                    TRecursiveKindMap
                >,
                TRecursiveKindMap,
                TMembers[K],
                K & string
            >
        : TMembers[K] extends ParameterizedCalculatedReferenceProp<
            infer Parameter, 
            infer R, 
            infer Nullity
        >
            ? <X = AllScalarsType<AllModelMembers<R>, TViewNullType>>(
                parameter: Parameter,
                fn?: (
                    builder: ViewBuilder<R, AllModelMembers<R>, TViewNullType, {}, {}, any, any>
                ) => ViewBuilder<R, AllModelMembers<R>, TViewNullType, X, any, any, any>
            ) => ViewBuilder<
                TModel,
                TMembers,
                TViewNullType,
                TransformedType<
                    TViewNullType,
                    TCurrent, 
                    XTypeOfView<K, X, Nullity, TViewNullType>, 
                    TRecursiveKindMap
                >,
                TRecursiveKindMap,
                TMembers[K],
                K & string
            >
        : TMembers[K] extends CalculatedCollectionProp<infer R>
            ? <X = AllScalarsType<AllModelMembers<R>, TViewNullType>>(
                fn?: (
                    builder: ViewBuilder<R, AllModelMembers<R>, TViewNullType, {}, {}, any, any>
                ) => ViewBuilder<R, AllModelMembers<R>, TViewNullType, X, any, any, any>
            ) => ViewBuilder<
                TModel,
                TMembers,
                TViewNullType,
                TransformedType<
                    TViewNullType,
                    TCurrent, 
                    XTypeOfView<K, X[], "NONNULL", TViewNullType>, 
                    TRecursiveKindMap
                >,
                TRecursiveKindMap,
                TMembers[K],
                K & string
            >
        : TMembers[K] extends ParameterizedCalculatedCollectionProp<
            infer Parameter,
            infer R
        >
            ? <X = AllScalarsType<AllModelMembers<R>, TViewNullType>>(
                parameter: Parameter,
                fn?: (
                    builder: ViewBuilder<R, AllModelMembers<R>, TViewNullType, {}, {}, any, any>
                ) => ViewBuilder<R, AllModelMembers<R>, TViewNullType, X, any, any, any>
            ) => ViewBuilder<
                TModel,
                TMembers,
                TViewNullType,
                TransformedType<
                    TViewNullType,
                    TCurrent, 
                    XTypeOfView<K, X[], "NONNULL", TViewNullType>, 
                    TRecursiveKindMap
                >,
                TRecursiveKindMap,
                TMembers[K],
                K & string
            >
        : never
}
& AllScalars<TModel, TMembers, TViewNullType, TCurrent, TRecursiveKindMap>
& Fold<TModel, TMembers, TViewNullType, TCurrent, TRecursiveKindMap>
& Flat<TModel, TMembers, TViewNullType, TCurrent, TRecursiveKindMap>
& Recursive<TModel, TMembers, TViewNullType, TCurrent, TRecursiveKindMap>
& Remove<TModel, TMembers, TViewNullType, TCurrent, TRecursiveKindMap>
& ReferenceKeyMembers<TModel, TMembers, TViewNullType, TCurrent, TRecursiveKindMap>
& As<TModel, TMembers, TViewNullType, TCurrent, TRecursiveKindMap, TLastProp, TLastName>
& InstanceOf<TModel, TMembers, TViewNullType, TCurrent, TRecursiveKindMap>
& ReferenceActions<TModel, TMembers, TViewNullType, TCurrent, TRecursiveKindMap, TLastProp, TLastName> 
& CollectionActions<TModel, TMembers, TViewNullType, TCurrent, TRecursiveKindMap, TLastProp, TLastName>;

export type As<
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType,
    TCurrent, 
    TRecursiveKindMap extends RecursiveKindMap,
    TLastProp, 
    TLastName extends string
> =
    TLastName extends ""
        ? object
        : {
            $as: <TNewName extends string>(
                name: TNewName
            ) => ViewBuilder<
                TModel,
                TMembers, 
                TViewNullType,
                RecursivedType<
                    TViewNullType,
                    {[K in keyof TCurrent as K extends TLastName ? TNewName : K]: TCurrent[K]}, 
                    TRecursiveKindMap
                >,
                TRecursiveKindMap,
                TLastProp, 
                TNewName
            >;
        };

export type ReferenceActions<
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType,
    TCurrent, 
    TRecursiveKindMap extends RecursiveKindMap,
    TLastProp, 
    TLastName extends string
> =
    TLastProp extends ReferenceProp<infer TTargetModel, any, any, any, any, any>
        ? {
            $where: (
                fn: (table: EntityTable<TTargetModel>) => Predicate | null | undefined
            ) => ViewBuilder<
                TModel, 
                TMembers, 
                TViewNullType,
                TCurrent, 
                TRecursiveKindMap, 
                TLastProp, 
                TLastName
            >;

            $fetch: (
                fetchType: ReferenceFetchType
            ) => ViewBuilder<
                TModel, 
                TMembers, 
                TViewNullType,
                TCurrent, 
                TRecursiveKindMap, 
                TLastProp, 
                TLastName
            > 
        }
        : object;

export type CollectionActions<
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType,
    TCurrent, 
    TRecursiveKindMap extends RecursiveKindMap,
    TLastProp, 
    TLastName extends string
> =
    TLastProp extends CollectionProp<infer TItemModel>
        ? {
            $where: (
                fn: (table: EntityTable<TItemModel>) => Predicate | null | undefined
            ) => ViewBuilder<
                TModel, 
                TMembers, 
                TViewNullType,
                TCurrent, 
                TRecursiveKindMap, 
                TLastProp, 
                TLastName
            >;

            $orderBy: (
                ...orders: ReadonlyArray<ModelOrder<TItemModel>>
            ) => ViewBuilder<
                TModel, 
                TMembers, 
                TViewNullType,
                TCurrent, 
                TRecursiveKindMap, 
                TLastProp, 
                TLastName
            >;

            $limit: (
                limit: number | undefined
            ) => ViewBuilder<
                TModel, 
                TMembers, 
                TViewNullType,
                TCurrent, 
                TRecursiveKindMap, 
                TLastProp, 
                TLastName
            >;
        }
        : object;

export type Flat<
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType,
    TCurrent,
    TRecursiveKindMap extends RecursiveKindMap
> = FlatReference<TModel, TMembers, TViewNullType, TCurrent, TRecursiveKindMap>
    & FlatEmbedded<TModel, TMembers, TViewNullType, TCurrent, TRecursiveKindMap>;

export type FlatReference<
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType,
    TCurrent,
    TRecursiveKindMap extends RecursiveKindMap
> = 
    FlatReferenceKeys<TMembers> extends never
        ? object
        : {
            flat: <TName extends FlatReferenceKeys<TMembers> & string, X, TPrefix extends string = TName>(
                options: TName | { 
                    prop: TName, 
                    prefix?: TPrefix,
                    fetchType?: ReferenceFetchType
                },
                fn: (
                    builder: ViewBuilder<
                        FlatTargetModel<TModel, TMembers[TName]>, 
                        FlatTargetMembers<TMembers[TName]>, 
                        TViewNullType,
                        {}, 
                        {},
                        any, 
                        any
                    >
                ) => ViewBuilder<
                    FlatTargetModel<TModel, TMembers[TName]>, 
                    FlatTargetMembers<TMembers[TName]>, 
                    TViewNullType,
                    X, 
                    any,
                    any, 
                    any
                >
            ) => ViewBuilder<
                TModel,
                TMembers, 
                TViewNullType,
                RecursivedType<
                    TViewNullType,
                    TCurrent & MakeTypeByNullity<
                        NullityOf<TMembers[TName]>, 
                        TViewNullType, 
                        PrefixType<TPrefix, X>
                    >,
                    TRecursiveKindMap
                >, 
                TRecursiveKindMap,
                any, 
                ""
            >
        };

export type FlatEmbedded<
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType,
    TCurrent,
    TRecursiveKindMap extends RecursiveKindMap
> = 
    FlatEmbeddedKeys<TMembers> extends never
        ? object
        : {
            flat<TName extends FlatEmbeddedKeys<TMembers> & string, X, TPrefix extends string = TName>(
                options: TName | { prop: TName, prefix?: TPrefix },
                fn: (
                    builder: ViewBuilder<
                        FlatTargetModel<TModel, TMembers[TName]>, 
                        FlatTargetMembers<TMembers[TName]>, 
                        TViewNullType,
                        {}, 
                        {},
                        any, 
                        any
                    >
                ) => ViewBuilder<
                    FlatTargetModel<TModel, TMembers[TName]>, 
                    FlatTargetMembers<TMembers[TName]>, 
                    TViewNullType,
                    X, 
                    any,
                    any, 
                    any
                >
            ): ViewBuilder<
                TModel,
                TMembers, 
                TViewNullType,
                RecursivedType<
                    TViewNullType,
                    TCurrent & MakeTypeByNullity<
                        NullityOf<TMembers[TName]>, 
                        TViewNullType, 
                        PrefixType<TPrefix, X>
                    >,
                    TRecursiveKindMap
                >, 
                TRecursiveKindMap,
                any, 
                ""
            >;

            flat<TName extends FlatEmbeddedKeys<TMembers> & string, TPrefix extends string = TName>(
                options: TName | { prop: TName, prefix?: TPrefix }
            ): ViewBuilder<
                TModel,
                TMembers, 
                TViewNullType,
                RecursivedType<
                    TViewNullType,
                    TCurrent & MakeTypeByNullity<
                        NullityOf<TMembers[TName]>, 
                        TViewNullType, 
                        PrefixType<
                            TPrefix, 
                            AllScalarsType<DirectTypeOf<TMembers[TName]>, TViewNullType>
                        >
                    >,
                    TRecursiveKindMap
                >, 
                TRecursiveKindMap,
                any, 
                ""
            >;
        };

export type FlatReferenceKeys<TMembers> = 
    keyof {
        [K in keyof TMembers
            as TMembers[K] extends ReferenceProp<any, any, any, any, any, any> 
                ? K
                : never
        ]: number
    };

export type FlatEmbeddedKeys<TMembers> = 
    keyof {
        [K in keyof TMembers
            as TMembers[K] extends EmbeddedProp<any, any, any>
                ? K
                : never
        ]: number
    };

export type FlatTargetModel<TModel extends AnyModel, TProp> =
    TProp extends ReferenceProp<infer TargetModel, any, any, any, any, any>
        ? TargetModel
        : TModel;

export type FlatTargetMembers<TProp> =
    TProp extends ReferenceProp<infer TargetModel, any, any, any, any, any>
        ? AllModelMembers<TargetModel>
        : DirectTypeOf<TProp>;

export type ReferenceKeyMembers<
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType,
    TCurrent, 
    TRecursiveKindMap extends RecursiveKindMap
> = {
    [
        K in keyof TMembers
        as TMembers[K] extends ReferenceProp<
            infer _, 
            any, 
            "OWNING", 
            false,
            any, 
            infer Key
        > 
            ? Key extends string
                ? PrefixString<K & string, RequiredModelKey<TModel, Key>>
                : never
            : never
    ]: 
        TMembers[K] extends ReferenceProp<
            infer TargetModel, 
            infer Nullity,
            any,
            any,
            any,
            infer Key
        >
            ? AllModelMembers<TargetModel>[RequiredModelKey<TModel, Key>] extends EmbeddedProp<infer R, infer Nullity, any>
                ? <X = SimpleDataTypeOf<AllModelMembers<TargetModel>[RequiredModelKey<TModel, Key>], TViewNullType>>(
                    fn?: (builder: ViewBuilder<
                        never,
                        R, 
                        TViewNullType,
                        {},
                        TRecursiveKindMap,
                        any,
                        ""
                    >) => ViewBuilder<
                        never,
                        R, 
                        TViewNullType,
                        X,
                        TRecursiveKindMap,
                        any,
                        any
                    >
                ) => ViewBuilder<
                    TModel,
                    TMembers, 
                    TViewNullType,
                    TransformedType<
                        TViewNullType,
                        TCurrent, 
                        XTypeOfView<
                            PrefixString<K & string, RequiredModelKey<TModel, Key>>,
                            X,
                            Nullity,
                            TViewNullType
                        >,
                        TRecursiveKindMap
                    >,
                    TRecursiveKindMap,
                    TMembers[K],
                    PrefixString<K & string, RequiredModelKey<TModel, Key>>
                >
                : ViewBuilder<
                    TModel,
                    TMembers, 
                    TViewNullType,
                    TransformedType<
                        TViewNullType,
                        TCurrent, 
                        XTypeOfView<
                            PrefixString<K & string, RequiredModelKey<TModel, Key>>,
                            SimpleDataTypeOf<AllModelMembers<TargetModel>[RequiredModelKey<TModel, Key>], TViewNullType>,
                            Nullity,
                            TViewNullType
                        >,
                        TRecursiveKindMap
                    >,
                    TRecursiveKindMap,
                    TMembers[K],
                    PrefixString<K & string, RequiredModelKey<TModel, Key>>
                >
            : never
};

export type AllScalars<
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType,
    TCurrent,
    TRecursiveKindMap extends RecursiveKindMap
> = {
    allScalars: () => ViewBuilder<
        TModel,
        TMembers,
        TViewNullType,
        RecursivedType<
            TViewNullType,
            TCurrent & AllScalarsType<TMembers, TViewNullType>, 
            TRecursiveKindMap
        >,
        TRecursiveKindMap,
        undefined,
        any
    >;
};

export type AllScalarsType<TMembers, TViewNullType extends ViewNullType> = {
    [K in keyof TMembers 
        as IsPartOfAllScalars<TMembers[K], "NONNULL"> extends true 
            ? K 
            : never
    ]: SimpleDataTypeOf<TMembers[K], TViewNullType>
} & (
    TViewNullType extends "NULL" ? {
            [K in keyof TMembers
                as IsPartOfAllScalars<TMembers[K], "NULLABLE" | "INPUT_NONNULL"> extends true 
                    ? K 
                    : never
            ]: SimpleDataTypeOf<TMembers[K], TViewNullType> | null
        } : {
            [K in keyof TMembers
                as IsPartOfAllScalars<TMembers[K], "NULLABLE" | "INPUT_NONNULL"> extends true 
                    ? K 
                    : never
            ]?: SimpleDataTypeOf<TMembers[K], TViewNullType> | undefined
        } 
)

export type IsPartOfAllScalars<TProp, TNullity extends NullityType> =
    TProp extends ScalarProp<any, TNullity>
            ? true
        : TProp extends EmbeddedProp<any, TNullity, any>
            ? true
        : false;

export type MakeTypeByNullity<
    TNullity, 
    TViewNullType extends ViewNullType,
    T
> =
    TNullity extends "NONNULL"
        ? T
        : TViewNullType extends "NULL"
            ? {[K in keyof T]: T[K] | null}
            : {[K in keyof T]?: T[K] | undefined};

export type Fold<
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType,
    TCurrent,
    TRecursiveKindMap extends RecursiveKindMap
> = {
    fold: <TName extends string, X>(
        name: TName,
        fn: (
            builder: ViewBuilder<TModel, TMembers, TViewNullType, {}, {}, any, "">
        ) => ViewBuilder<TModel, TMembers, TViewNullType, X, any, any, any>
    ) => ViewBuilder<
        TModel, 
        TMembers, 
        TViewNullType,
        TransformedType<
            TViewNullType,
            TCurrent, XTypeOfView<TName, X, "NONNULL", TViewNullType>, 
            TRecursiveKindMap
        >, 
        TRecursiveKindMap,
        any, 
        ""
    >;
};

export type InstanceOf<
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType,
    TCurrent,
    TRecursiveKindMap extends RecursiveKindMap
> = {
    instanceOf<TDerivedModel extends AnyModel, X>(
        derivedModel: DerivedModel<TDerivedModel, TModel>,
        fn: (
            builder: ViewBuilder<
                TDerivedModel, 
                DeclaredModelMembers<TDerivedModel>, 
                TViewNullType,
                {}, 
                {}, 
                any, 
                ""
            >
        ) => ViewBuilder<
            TDerivedModel, 
            DeclaredModelMembers<TDerivedModel>, 
            TViewNullType, 
            X, 
            any, 
            any, 
            any
        >
    ): ViewBuilder<
        TModel, 
        TMembers, 
        TViewNullType,
        RecursivedType<
            TViewNullType,
            DerivedFields<TDerivedModel, TModel, X, TCurrent>,
            TRecursiveKindMap
        >, 
        TRecursiveKindMap,
        any, 
        ""
    >;
};

export type DerivedFields<
    TDerivedModel extends AnyModel,
    TModel extends AnyModel,
    X,
    TCurrent
> = ( 
    [X] extends [{__typename: string}]
        ? X
            & SuperFields<
                TCurrent, 
                ModelSuperNames<TDerivedModel>
            >
        : { __typename: ModelName<TDerivedModel> } 
            & X
            & SuperFields<
                TCurrent, 
                ModelSuperNames<TDerivedModel>
            >
) | (
    [TCurrent] extends [{__typename: string}]
        ? TCurrent
        : { __typename: ModelName<TModel> } & TCurrent
);

export type SuperFields<
    TPrevData,
    TTypeNames extends string
> = [TPrevData] extends [{ __typename: string }]
    ? UnionToIntersection<
        ExtractSuperFields<TPrevData, TTypeNames>
    >
    : TPrevData;

export type ExtractSuperFields<
    TPrevData,
    TTypeNames extends string,
> = TTypeNames extends any
    ? ExtractByTypeName<TPrevData, TTypeNames> extends infer ST
        ? ST extends { __typename: string }
            ? Omit<ST, "__typename">
            : never
        : never
    : never;

export type ExtractByTypeName<TUnion, TTypeNames> = 
    TUnion extends { __typename: TTypeNames } 
        ? TUnion 
        : never;

export type ReferenceFetchType = "LOAD" | "JOIN";

export type PrefixString<TPrefix extends string, T extends string> =
    `${TPrefix}${Capitalize<T>}`;

export type PrefixType<TPrefix extends string, T> = 
    TPrefix extends "" 
        ? T 
        : {[K in keyof T & string as PrefixString<TPrefix, K>]: T[K]};

export type Recursive<
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType,
    TCurrent, 
    TRecursiveKindMap extends RecursiveKindMap
> =
    RecursiveKeys<TModel, TMembers> extends never
        ? object
        : {
            recursive: <
                TPropName extends RecursiveKeys<TModel, TMembers>,
                TAlias extends string = TPropName,
                TDepth extends number = -1
            >(
                options: TPropName 
                | (
                    TMembers[TPropName] extends CollectionProp<any>
                        ? {
                            prop: TPropName,
                            alias?: TAlias,
                            depth?: TDepth,
                            filter?: (table: Table<TModel>) => Predicate | null,
                            orders?: ReadonlyArray<ModelOrder<TModel>>
                            limit?: number
                        } 
                        : {
                            prop: TPropName,
                            alias?: TAlias,
                            depth?: TDepth,
                            filter?: (table: Table<TModel>) => Predicate | null | undefined
                        }
                )
            ) => ViewBuilder<
                TModel,
                TMembers,
                TViewNullType,
                RecursivedType<
                    TViewNullType,
                    TCurrent,
                    NewRecursiveKindMap<TRecursiveKindMap, TMembers, TPropName, TAlias, TDepth>
                >,
                NewRecursiveKindMap<TRecursiveKindMap, TMembers, TPropName, TAlias, TDepth>,
                undefined,
                ""
            >;
        };

export type RecursiveKeys<TModel extends AnyModel, TMembers> = 
    keyof {
        [K in keyof TMembers
            as IsRecursiveProp<TModel, TMembers[K]> extends true
                ? K & string
                : never
        ]: K
    };

export type IsRecursiveProp<TModel extends AnyModel, TProp> =
    TProp extends AssociatedProp<infer TargetModel, any, any, any, any, any>
        ? Extends<TModel, TargetModel> extends true
            ? true
            : false
        : false;

export type TransformedType<
    TViewNullType extends ViewNullType,
    TCurrent, 
    TXType,
    TRecursiveKindMap extends RecursiveKindMap
> = RecursivedType<
    TViewNullType,
    TXType extends never
        ? TCurrent
        : TCurrent & TXType,
    TRecursiveKindMap
>;

export type NewRecursiveKindMap<
    TRecursiveKindMap extends RecursiveKindMap,
    TMembers,
    TPropName extends keyof TMembers,
    TAlias extends string,
    TDepth extends number
> = TRecursiveKindMap & { 
    [P in TAlias]: TMembers[TPropName] extends CollectionProp<any>
            ? TDepth extends -1
                ? "COLLECTION"
                : "UNDEFINED_COLLECTION"
            : "REFERENCE"
    }

export type RecursivedType<
    TViewNullType extends ViewNullType,
    T,
    TRecursiveKindMap extends RecursiveKindMap
> = {} extends TRecursiveKindMap 
    ? T
    : RecursivingType<
        TViewNullType,
        Omit<T, keyof TRecursiveKindMap>, 
        TRecursiveKindMap
    >;

export type RecursivingType<
    TViewNullType extends ViewNullType,
    TCore,
    TRecursiveKindMap extends RecursiveKindMap
> = 
    TCore
    & (
        TViewNullType extends "NULL"
            ? {
                [K in keyof TRecursiveKindMap
                    as TRecursiveKindMap[K] extends "REFERENCE"
                        ? K
                        : never
                ]: RecursivingType<TViewNullType, TCore, Pick<TRecursiveKindMap, K>> | null;        
            } : {
                [K in keyof TRecursiveKindMap
                    as TRecursiveKindMap[K] extends "REFERENCE"
                        ? K
                        : never
                ]?: RecursivingType<TViewNullType, TCore, Pick<TRecursiveKindMap, K>> | undefined;        
            }
    ) 
    & {
        [K in keyof TRecursiveKindMap
            as TRecursiveKindMap[K] extends "COLLECTION"
                ? K
                : never
        ]: RecursivingType<TViewNullType, TCore, Pick<TRecursiveKindMap, K>>[];
    } & {
        [K in keyof TRecursiveKindMap
            as TRecursiveKindMap[K] extends "UNDEFINED_COLLECTION"
                ? K
                : never
        ]?: RecursivingType<TViewNullType, TCore, Pick<TRecursiveKindMap, K>>[] | undefined;          
    };

export type RecursiveKindMap = { [key:string]: RecursiveKind }

export type RecursiveKind = "REFERENCE" | "COLLECTION" | "UNDEFINED_COLLECTION";

export type XTypeOfView<K, X, TNullity extends NullityType, TViewNullType extends ViewNullType> =
    TNullity extends "NONNULL"
        ? {[P in K & string]: X}
        : TViewNullType extends "NULL"
            ? {[P in K & string]: X | null}
            : {[P in K & string]?: X | undefined};

export type Remove<
    TModel extends AnyModel,
    TMembers,
    TViewNullType extends ViewNullType,
    TCurrent,
    TRecursiveKindMap extends RecursiveKindMap
> = {
    remove: <TNames extends AtLeastOne<keyof TCurrent>>(
        ...names: TNames
    ) => ViewBuilder<
        TModel,
        TMembers,
        TViewNullType,
        RecursivedType<
            TViewNullType, 
            Omit<TCurrent, TNames[number]>, 
            TRecursiveKindMap
        >,
        TRecursiveKindMap,
        undefined,
        ""
    >;
};

interface EmbeddedMethods<
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType,
    TCurrent, 
    TRecursiveKindMap extends RecursiveKindMap, 
    TK extends keyof TMembers, 
    TR, 
    TNullity extends NullityType
> {
    
    /**
     * Fetch all fields of embedded property
     */
    (): ViewBuilder<
        TModel,
        TMembers,
        TViewNullType,
        TransformedType<
            TViewNullType,
            TCurrent, 
            XTypeOfView<TK, EmbeddedDataType<TR, TViewNullType>, TNullity, TViewNullType>, 
            TRecursiveKindMap
        >,
        TRecursiveKindMap,
        TMembers[TK],
        TK & string
    >;

    /**
     * Fetch some fields of embeded property
     */
    <X>(
        fn: (
            builder: ViewBuilder<never, TR, TViewNullType, {}, {}, any, any>
        ) => ViewBuilder<never, TR, TViewNullType, X, any, any, any>
    ): ViewBuilder<
        TModel,
        TMembers,
        TViewNullType,
        TransformedType<
            TViewNullType,
            TCurrent, 
            XTypeOfView<TK, X, TNullity, TViewNullType>, 
            TRecursiveKindMap
        >,
        TRecursiveKindMap,
        TMembers[TK],
        TK & string
    >;
}

export type SimpleDataTypeOf<TProp, TViewNullType extends ViewNullType> =
    TProp extends ScalarProp<infer R, any>
        ? R
    : TProp extends EmbeddedProp<infer R, any, any>
        ? EmbeddedDataType<R, TViewNullType>
    : TProp extends ReferenceProp<infer TargetModel, any, "OWNING", false, any, infer Key>
        ? {
            [
                K in keyof Key
                    as AllModelMembers<TargetModel>[K & string] extends Prop<any, "NONNULL">
                        ? K 
                        : never
            ]: SimpleDataTypeOf<AllModelMembers<TargetModel>[K], TViewNullType>
        } & (
            TViewNullType extends "NULL" 
                ? {
                    [
                        K in keyof Key
                            as AllModelMembers<TargetModel>[K & string] extends Prop<any, "NONNULL">
                                ? K 
                                : never
                    ]: SimpleDataTypeOf<AllModelMembers<TargetModel>[K], TViewNullType> | null
                } : {
                    [
                        K in keyof Key
                            as AllModelMembers<TargetModel>[K & string] extends Prop<any, "NONNULL">
                                ? K 
                                : never
                    ]?: SimpleDataTypeOf<AllModelMembers<TargetModel>[K], TViewNullType> | undefined
                } 
        )
    : never;

export type EmbeddedDataType<T, TViewNullType extends ViewNullType> =
    {
        [
            K in keyof T
                as T[K] extends Prop<any, "NONNULL">
                    ? K 
                    : never
        ]: SimpleDataTypeOf<T[K], TViewNullType>
    } & (
        TViewNullType extends "NULL"
            ? {
                [
                    K in keyof T
                        as T[K] extends Prop<any, "NULLABLE" | "INPUT_NONNULL">
                            ? K 
                            : never
                ]: SimpleDataTypeOf<T[K], TViewNullType> | null
            } : {
                [
                    K in keyof T
                        as T[K] extends Prop<any, "NULLABLE" | "INPUT_NONNULL">
                            ? K 
                            : never
                ]?: SimpleDataTypeOf<T[K], TViewNullType> | undefined
            }
    );
