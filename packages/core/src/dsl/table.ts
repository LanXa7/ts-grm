import { AllModelMembers, AnyModel, CtorMembers, DerivedModel, ModelCtor } from "@/schema/model";
import { 
    CollectionProp, 
    EmbeddedProp, 
    I64Prop, 
    NullityType, 
    ReferenceProp, 
    DirectTypeOf, 
    ScalarProp, 
    CombinedNullity 
} from "@/schema/prop";
import { Expression, MakeType, Predicate } from "./expression";
import { FilterNever } from "@/utils";
import { View } from "@/schema/dto";
import { FetchedView } from "./root_query";
import { BaseQuerySelectMapArgs, BaseModel, BaseQueryMapOf } from "./base_query";
import { AnyAssociationModel, AssociationTable } from "./association";

export type TableLike = {

    __type(): { 
        readonly tableLike: true; 
    };
};

export type EntityTableLike = {

    __type(): {
        readonly tableLike: true;
        readonly entityTableLike: true;
    };
};

export type ModelLike = AnyModel | BaseModel<any> | AnyAssociationModel;

export type Table<T extends ModelLike, TRiskAccepted extends boolean = false> =
    T extends AnyModel
        ? EntityTable<T, TRiskAccepted>
    : T extends BaseModel<infer TMap>
        ? BaseTable<TMap, TRiskAccepted>
    : T extends AnyAssociationModel
        ? AssociationTable<T>
    : never;

export type EntityTable<TModel extends AnyModel, TRiskAccepted extends boolean = false> = 
    EntityTableMembers<TModel, AllModelMembers<TModel>, "NONNULL", TRiskAccepted>;

export type EntityTableMembers<
    TModel extends AnyModel, 
    TMembers extends object, 
    TNullity extends NullityType, 
    TRiskAccepted extends boolean
> = DslMembers<TModel, TMembers, TNullity, TRiskAccepted>
    & WeakJoinAction<TModel, TRiskAccepted> 
    & { 
        __type(): {
            tableLike: true;
            entityTableLike: true;
            entityTable: TModel | true;
        };

        fetch<X>(
            view: View<TModel, X>
        ): FetchedView<
            TModel, 
            TNullity extends "NULLABLE" ? X | null | undefined : X
        >;

        is<TDerivedModel extends AnyModel>(
            derivedModel: DerivedModel<TDerivedModel, TModel>
        ): Predicate;

        as<TDerivedModel extends AnyModel>(
            derivedModel: DerivedModel<TDerivedModel, TModel>
        ): EntityTableMembers<TModel, AllModelMembers<TDerivedModel>, "NULLABLE", TRiskAccepted>;
    };

type DslMembers<
    TModel extends AnyModel, 
    TMembers extends object, 
    TNullity extends NullityType, 
    TRiskAccepted extends boolean
> = 
    FilterNever<{
        [K in keyof TMembers]:
            TMembers[K] extends I64Prop<infer R, infer Nullity>
                ? Expression<
                    MakeType<R, CombinedNullity<TNullity, Nullity>>,
                    R extends string ? "AS_NUMBER" : ""
                >
            : TMembers[K] extends ScalarProp<infer R, infer Nullity>
                ? Expression<MakeType<R, CombinedNullity<TNullity, Nullity>>>
            : TMembers[K] extends EmbeddedProp<infer R, infer Nullity, any>
                ? () => DslMembers<TModel, R, CombinedNullity<TNullity, Nullity>, TRiskAccepted>
            : TMembers[K] extends ReferenceProp<infer TTargetModel, any, any, any, any>
                ? ReferenceJoinAction<TModel, TTargetModel, CtorMembers<ModelCtor<TTargetModel>>, TRiskAccepted>
            : TMembers[K] extends CollectionProp<infer TTargetModel>
                ? CollectionJoinAction<TModel, TTargetModel, CtorMembers<ModelCtor<TTargetModel>>, TRiskAccepted>
            : never
        } & ReferenceKeyMembers<TModel, TMembers,TNullity>
    >;

type ReferenceKeyMembers<TModel extends AnyModel, TMembers, TNullity extends NullityType> = {
    [
        K in keyof TMembers as
            TMembers[K] extends ReferenceProp<infer _, any, "OWNING", any, infer TKey>
                ? TKey extends string
                    ? `${K & string}${Capitalize<TKey>}`
                    : never
                : never
    ]: TMembers[K] extends ReferenceProp<infer TTargetModel, infer Nullity, "OWNING", any, infer TKey>
        ? TKey extends string
            ? AllModelMembers<TTargetModel>[TKey] extends EmbeddedProp<infer R, any, any>
                ? () => DslMembers<TModel, R, CombinedNullity<TNullity, Nullity>, false>
            : AllModelMembers<TTargetModel>[TKey] extends I64Prop<infer R, any>
                ? Expression<
                    MakeType<R, CombinedNullity<TNullity, Nullity>>, 
                    R extends string ? "AS_NUMBER" : ""
                >
                : Expression<
                    MakeType<
                        DirectTypeOf<AllModelMembers<TTargetModel>[TKey]>, 
                        CombinedNullity<TNullity, Nullity>
                    >
                > 
            : never
        : never
};

export type JoinType = "INNER" | "LEFT";

type ReferenceJoinAction<
    TParentModel extends AnyModel, 
    TModel extends AnyModel, 
    TMembers extends object, 
    TRiskAccepted extends boolean
> = {

    (): EntityTableMembers<TModel, TMembers, "NONNULL", TRiskAccepted>;
    
    <TJoinType extends JoinType>(
        joinType: TJoinType
    ): EntityTableMembers<
        TModel, 
        TMembers, 
        TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL", 
        TRiskAccepted
    >;
    
    <TJoinType extends JoinType = "INNER">(
        options: {
            readonly joinType?: TJoinType,
            readonly filter?: FilterType<TParentModel, TModel>
        }
    ): EntityTableMembers<
        TModel, 
        TMembers, 
        TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL", 
        TRiskAccepted
    >;
};

type CollectionJoinAction<
    TParentModel extends AnyModel, 
    TModel extends AnyModel, 
    TMembers extends object, 
    TRiskAccepted extends boolean
> = {
    (): TRiskAccepted extends true
        ? EntityTableMembers<TModel, TMembers, "NONNULL", true>
        : RiskUnknownJoinedTable<TModel, TMembers, "NONNULL">;
    
    <TJoinType extends JoinType>(
        joinType: TJoinType
    ): TRiskAccepted extends true
        ? EntityTableMembers<
            TModel, 
            TMembers, 
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL", 
            TRiskAccepted
        >
        : RiskUnknownJoinedTable<
            TModel,
            TMembers, 
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL"
        >;
    
    <TJoinType extends JoinType = "INNER">(
        options: {
            readonly joinType?: TJoinType,
            readonly filter?: FilterType<TParentModel, TModel>
        }
    ): TRiskAccepted extends true
        ? EntityTableMembers<
            TModel, 
            TMembers, 
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL", 
            TRiskAccepted
        >
        : RiskUnknownJoinedTable<
            TModel,
            TMembers, 
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL"
        >;
};

type RiskUnknownJoinedTable<
    TModel extends AnyModel, 
    TMembers extends object, 
    TNullity extends NullityType
> = {
    $acceptRisk(): EntityTableMembers<TModel, TMembers, TNullity, true>;
};

type WeakJoinAction<
    TModel extends ModelLike,
    TRiskAccepted extends boolean
> = {

    join<
        TTargetModel extends AnyModel,
    >(
        targetModel: TTargetModel,
        filter: FilterType<TModel, TTargetModel>
    ): TRiskAccepted extends true
        ? EntityTableMembers<
            TTargetModel, 
            AllModelMembers<TTargetModel>, 
            "NONNULL", 
            TRiskAccepted
        >
        : RiskUnknownJoinedTable<
            TTargetModel,
            AllModelMembers<TTargetModel>, 
            "NONNULL"
        >;

    join<
        TTargetModel extends AnyModel,
        TJoinType extends JoinType = "INNER",
    >(
        targetModel: TTargetModel,
        options: {
            readonly joinType?: TJoinType,
            readonly filter: FilterType<TModel, TTargetModel>
        }
    ): TRiskAccepted extends true
        ? EntityTableMembers<
            TTargetModel, 
            AllModelMembers<TTargetModel>, 
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL", 
            TRiskAccepted
        >
        : RiskUnknownJoinedTable<
            TTargetModel,
            AllModelMembers<TTargetModel>, 
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL"
        >;

    join<
        TTargetModel extends BaseModel<any>,
    >(
        targetModel: TTargetModel,
        filter: FilterType<TModel, TTargetModel>
    ): BaseTable<BaseQueryMapOf<TTargetModel>, TRiskAccepted>;

    join<
        TTargetModel extends BaseModel<any>,
        TJoinType extends JoinType = "INNER",
    >(
        targetModel: TTargetModel,
        options: {
            readonly joinType?: TJoinType,
            readonly filter: FilterType<TModel, TTargetModel>
        }
    ): BaseTable<
        TJoinType extends "LEFT"
            ? NullableBaseQuerySelectMapOf<BaseQueryMapOf<TTargetModel>>
            : BaseQueryMapOf<TTargetModel>, 
        TRiskAccepted
    >;
};

export type FilterType<
    TParentModel extends ModelLike, 
    TModel extends ModelLike
> =
    (ctx: FilterContextType<TParentModel, TModel>) => Predicate | undefined;

export type FilterContextType<
    TParentModel extends ModelLike, 
    TModel extends ModelLike
> = {
    readonly source: Table<TParentModel>;
    readonly target: Table<TModel>
};

export type BaseTable<
    TMap extends BaseQuerySelectMapArgs,
    TRiskAccepted extends boolean = false
> = {
    __type(): { 
        tableLike: true; 
        baseTable: true; 
    };
} & {
    readonly [K in keyof TMap]: 
        TMap[K] extends EntityTableMembers<any, any, any, any>
            ? MakeRiskAcceptedTable<TMap[K], TRiskAccepted>
            : TMap[K];
} & WeakJoinAction<BaseModel<TMap>, TRiskAccepted>;

export type NullableBaseQuerySelectMapOf<
    TMap extends BaseQuerySelectMapArgs
> = {
    readonly [K in keyof TMap]: 
        TMap[K] extends Expression<infer R, infer AsNumber> 
            ? Expression<R | null | undefined, AsNumber>
        : NullableEntityTableOf<TMap[K]>;
};

type MakeRiskAcceptedTable<TEntityTable, TRiskAccepted extends boolean = false> =
    TEntityTable extends EntityTable<infer M extends AnyModel, any>
        ? EntityTable<M, TRiskAccepted>
        : never;

export type NullableEntityTableOf<TEntityTable> =
    TEntityTable extends EntityTableMembers<infer Model, infer _ extends object, any, infer RiskAccepted>
        ? EntityTableMembers<Model, AllModelMembers<Model>, "NULLABLE", RiskAccepted>
        : never;