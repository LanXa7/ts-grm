import { AllModelMembers, AnyModel, DerivedModel, RequiredModelKey } from "@/schema/model";
import { 
    CollectionProp, 
    EmbeddedProp, 
    I64Prop, 
    NullityType, 
    ReferenceProp, 
    ScalarProp, 
    CombinedNullity,
} from "@/schema/prop";
import { Expression, MakeExpression, MakeType, Predicate } from "./expression";
import { FilterNever } from "@/utils";
import { View } from "@/schema/dto";
import { FetchedView } from "./root_query";
import { BaseQuerySelectMapArgs, BaseModel, BaseQueryMapOf } from "./base_query";
import { AnyAssociationModel, AssociationKeys, AssociationTable, MakeAssociationTableMembers } from "./association";

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
    & AssociationAction<TModel, TRiskAccepted>
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
            : TMembers[K] extends ReferenceProp<infer TargetModel, any, any, any, any, any>
                ? ReferenceJoinAction<TModel, TargetModel, AllModelMembers<TargetModel>, TRiskAccepted>
            : TMembers[K] extends CollectionProp<infer TargetModel>
                ? CollectionJoinAction<TModel, TargetModel, AllModelMembers<TargetModel>, TRiskAccepted>
            : never
        } & ReferenceKeyMembers<TModel, TMembers, TNullity>
    >;

type ReferenceKeyMembers<TModel extends AnyModel, TMembers, TNullity extends NullityType> = {
    [
        K in keyof TMembers as
            TMembers[K] extends ReferenceProp<infer _, any, "OWNING", false, any, infer TKey>
                ? TKey extends string
                    ? `${K & string}${Capitalize<RequiredModelKey<TModel, TKey>>}`
                    : never
                : never
    ]: TMembers[K] extends ReferenceProp<infer TargetModel, infer Nullity, "OWNING", false, any, infer Key>
        ? Key extends string
            ? AllModelMembers<TargetModel>[RequiredModelKey<TargetModel, Key>] extends EmbeddedProp<infer R, any, any>
                ? () => DslMembers<TModel, R, CombinedNullity<TNullity, Nullity>, false>
            : MakeExpression<
                AllModelMembers<TargetModel>[RequiredModelKey<TModel, Key>],
                CombinedNullity<TNullity, Nullity>
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
    (): TableRiskWrapper<
        EntityTableMembers<TModel, TMembers, "NONNULL", true>,
        TRiskAccepted
    >; 
    
    <TJoinType extends JoinType>(
        joinType: TJoinType
    ): TableRiskWrapper<
        EntityTableMembers<
            TModel,
            TMembers, 
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL",
            true
        >,
        TRiskAccepted
    >;
    
    <TJoinType extends JoinType = "INNER">(
        options: {
            readonly joinType?: TJoinType,
            readonly filter?: FilterType<TParentModel, TModel>
        }
    ): TableRiskWrapper<
        EntityTableMembers<
            TModel,
            TMembers, 
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL",
            true
        >,
        TRiskAccepted
    >;
};

type TableRiskWrapper<T extends TableLike, TRiskAccepted extends boolean> = 
    TRiskAccepted extends true
        ? T
        : { $acceptRisk(): T; };

type WeakJoinAction<
    TModel extends ModelLike,
    TRiskAccepted extends boolean
> = {

    join<
        TTargetModel extends AnyModel,
    >(
        targetModel: TTargetModel,
        filter: FilterType<TModel, TTargetModel>
    ): TableRiskWrapper<EntityTableMembers<
            TTargetModel, 
            AllModelMembers<TTargetModel>, 
            "NONNULL", 
            TRiskAccepted
        >,
        TRiskAccepted
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
    ): TableRiskWrapper<
        EntityTableMembers<
            TTargetModel, 
            AllModelMembers<TTargetModel>, 
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL", 
            TRiskAccepted
        >,
        TRiskAccepted
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

type AssociationAction<TModel extends AnyModel, TRiskAccepted extends boolean> = 
    AssociationActionImpl<TModel, AssociationKeys<TModel>, TRiskAccepted>;

type AssociationActionImpl<
    TModel extends AnyModel, 
    TAssociationKeys extends AssociationKeys<TModel>,
    TRiskAccepted extends boolean
> = {
    association<
        TKey extends TAssociationKeys,
        TJoinType extends JoinType = "INNER"
    >(
        key: TAssociationKeys,
        joinType?: JoinType
    ): TableRiskWrapper<
        MakeAssociationTableMembers<
            TModel,
            TKey,
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL"
        >,
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