import { AllModelMembers, AnyModel, DerivedModel, RequiredModelKey } from "@/schema/model";
import { 
    CollectionProp, 
    EmbeddedProp, 
    I64Prop, 
    NullityType, 
    ReferenceProp, 
    ScalarProp, 
    CombinedNullity,
    AssociatedProp,
} from "@/schema/prop";
import { Expression, MakeExpression, MakeType, Predicate } from "./expression";
import { FilterNever } from "@/utils";
import { View } from "@/schema/dto";
import { FetchedView } from "./root_query";
import { BaseQuerySelectMapArgs, BaseModel, BaseQueryMapOf } from "./base_query";
import { AnyAssociationModel, AssociationKeys, AssociationTable, MakeAssociationModel, MakeAssociationTableMembers } from "./association";

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

export type Table<T extends ModelLike, TJoinPolicy extends JoinPolicyType = "REFERENCE"> =
    T extends AnyModel
        ? EntityTable<T, TJoinPolicy>
    : T extends BaseModel<infer TMap>
        ? BaseTable<TMap, TJoinPolicy>
    : T extends AnyAssociationModel
        ? AssociationTable<T>
    : never;

export type EntityTable<TModel extends AnyModel, TJoinPolicy extends JoinPolicyType = "REFERENCE"> = 
    EntityTableMembers<TModel, AllModelMembers<TModel>, "NONNULL", TJoinPolicy>;

export type JoinPolicyType = "NONE" | "REFERENCE" | "ARBITRARY";

export type EntityTableMembers<
    TModel extends AnyModel, 
    TMembers extends object, 
    TNullity extends NullityType, 
    TJoinPolicy extends JoinPolicyType
> = PrettifyDsl<
    DslMembers<TModel, TMembers, TNullity, TJoinPolicy>
    & WeakJoinAction<TModel, TJoinPolicy> 
    & AssociationAction<TModel, TJoinPolicy>
    & AssociatedAction<TMembers>
    & CollectionAction<TMembers>
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
            TNullity extends "NULLABLE" ? X | null : X
        >;

        is<TDerivedModel extends AnyModel>(
            derivedModel: DerivedModel<TDerivedModel, TModel>
        ): Predicate;

        as<TDerivedModel extends AnyModel>(
            derivedModel: DerivedModel<TDerivedModel, TModel>
        ): EntityTableMembers<TModel, AllModelMembers<TDerivedModel>, "NULLABLE", TJoinPolicy>;
    }
>;

type DslMembers<
    TModel extends AnyModel, 
    TMembers extends object, 
    TNullity extends NullityType, 
    TJoinPolicy extends JoinPolicyType
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
                ? () => DslMembers<TModel, R, CombinedNullity<TNullity, Nullity>, TJoinPolicy>
            : TJoinPolicy extends "NONE"
                ? never
            : TMembers[K] extends ReferenceProp<infer TargetModel, any, any, any, any, any>
                ? ReferenceJoinAction<TModel, TargetModel, AllModelMembers<TargetModel>, TJoinPolicy>
            : TMembers[K] extends CollectionProp<infer TargetModel>
                ? CollectionJoinAction<TModel, TargetModel, AllModelMembers<TargetModel>, TJoinPolicy>
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
                ? () => DslMembers<TModel, R, CombinedNullity<TNullity, Nullity>, "REFERENCE">
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
    TJoinPolicy extends JoinPolicyType
> = {

    (): EntityTableMembers<TModel, TMembers, "NONNULL", TJoinPolicy>;
    
    <TJoinType extends JoinType>(
        joinType: TJoinType
    ): EntityTableMembers<
        TModel, 
        TMembers, 
        TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL", 
        TJoinPolicy
    >;

    (filter: FilterType<TParentModel, TModel>): EntityTableMembers<
        TModel, 
        TMembers, 
        "NONNULL", 
        TJoinPolicy
    >;
    
    <TJoinType extends JoinType = "INNER">(
        options: {
            readonly joinType?: TJoinType,
            readonly filter?: FilterType<TParentModel, TModel>
            readonly ignoreTargetFilters?: boolean
        }
    ): EntityTableMembers<
        TModel, 
        TMembers, 
        TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL", 
        TJoinPolicy
    >;
};

type CollectionJoinAction<
    TParentModel extends AnyModel, 
    TModel extends AnyModel, 
    TMembers extends object, 
    TJoinPolicy extends JoinPolicyType
> = {

    (): TableRiskWrapper<
        EntityTableMembers<TModel, TMembers, "NONNULL", "ARBITRARY">,
        TJoinPolicy
    >; 
    
    <TJoinType extends JoinType>(
        joinType: TJoinType
    ): TableRiskWrapper<
        EntityTableMembers<
            TModel,
            TMembers, 
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL",
            "ARBITRARY"
        >,
        TJoinPolicy
    >;

    (filter: FilterType<TParentModel, TModel>): TableRiskWrapper<
        EntityTableMembers<
            TModel,
            TMembers, 
            "NONNULL",
            "ARBITRARY"
        >,
        TJoinPolicy
    >;
    
    <TJoinType extends JoinType = "INNER">(
        options: {
            readonly joinType?: TJoinType,
            readonly filter?: FilterType<TParentModel, TModel>,
            readonly ignoreTargetFilters?: boolean
        }
    ): TableRiskWrapper<
        EntityTableMembers<
            TModel,
            TMembers, 
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL",
            "ARBITRARY"
        >,
        TJoinPolicy
    >;
};

type TableRiskWrapper<T extends TableLike, TJoinPolicy extends JoinPolicyType> = 
    TJoinPolicy extends "ARBITRARY"
        ? T
        : { $acceptMulti(): T; };

type WeakJoinAction<
    TModel extends ModelLike,
    TJoinPolicy extends JoinPolicyType
> = 
    TJoinPolicy extends "NONE"
        ? {}
        : {

            join<
                TTargetModel extends AnyModel,
            >(
                targetModel: TTargetModel,
                filter: FilterType<TModel, TTargetModel>
            ): TableRiskWrapper<EntityTableMembers<
                    TTargetModel, 
                    AllModelMembers<TTargetModel>, 
                    "NONNULL", 
                    TJoinPolicy
                >,
                TJoinPolicy
            >;

            join<
                TTargetModel extends AnyModel,
                TJoinType extends JoinType = "INNER",
            >(
                targetModel: TTargetModel,
                options: {
                    readonly joinType?: TJoinType,
                    readonly filter: FilterType<TModel, TTargetModel>,
                    readonly ignoreTargetFilters?: boolean
                }
            ): TableRiskWrapper<
                EntityTableMembers<
                    TTargetModel, 
                    AllModelMembers<TTargetModel>, 
                    TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL", 
                    TJoinPolicy
                >,
                TJoinPolicy
            >;

            join<
                TTargetModel extends BaseModel<any>,
            >(
                targetModel: TTargetModel,
                filter: FilterType<TModel, TTargetModel>
            ): BaseTable<BaseQueryMapOf<TTargetModel>, TJoinPolicy>;

            join<
                TTargetModel extends BaseModel<any>,
                TJoinType extends JoinType = "INNER",
            >(
                targetModel: TTargetModel,
                options: {
                    readonly joinType?: TJoinType,
                    readonly filter: FilterType<TModel, TTargetModel>,
                    readonly ignoreTargetFilters?: boolean
                }
            ): BaseTable<
                TJoinType extends "LEFT"
                    ? NullableBaseQuerySelectMapOf<BaseQueryMapOf<TTargetModel>>
                    : BaseQueryMapOf<TTargetModel>, 
                TJoinPolicy
            >;
        };

type AssociationAction<TModel extends AnyModel, TJoinPolicy extends JoinPolicyType> = 
    AssociationActionImpl<TModel, AssociationKeys<TModel>, TJoinPolicy>;

type AssociationActionImpl<
    TModel extends AnyModel, 
    TAssociationKeys extends AssociationKeys<TModel>,
    TJoinPolicy extends JoinPolicyType
> = {
    
    association<
        TKey extends TAssociationKeys
    >(
        key: TAssociationKeys,
    ): TableRiskWrapper<
        MakeAssociationTableMembers<
            TModel,
            TKey,
            "NONNULL"
        >,
        TJoinPolicy
    >;

    association<
        TKey extends TAssociationKeys,
        TJoinType extends JoinType = "INNER"
    >(
        key: TAssociationKeys,
        joinType: TJoinType
    ): TableRiskWrapper<
        MakeAssociationTableMembers<
            TModel,
            TKey,
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL"
        >,
        TJoinPolicy
    >;

    association<
        TKey extends TAssociationKeys
    >(
        key: TKey,
        filter: FilterType<TModel, MakeAssociationModel<TModel, TKey>>
    ): TableRiskWrapper<
        MakeAssociationTableMembers<
            TModel,
            TKey,
            "NONNULL"
        >,
        TJoinPolicy
    >;

    association<
        TKey extends TAssociationKeys,
        TJoinType extends JoinType = "INNER"
    >(
        key: TAssociationKeys,
        options: {
            readonly joinType?: TJoinType;
            readonly filter?: FilterType<TModel, MakeAssociationModel<TModel, TKey>>,
            readonly ignoreTargetFilters?: boolean
        }
    ): TableRiskWrapper<
        MakeAssociationTableMembers<
            TModel,
            TKey,
            TJoinType extends "LEFT" ? "NULLABLE" : "NONNULL"
        >,
        TJoinPolicy
    >;
};

type AssociatedAction<TModelMembers> =
    AssociatedKeys<TModelMembers> extends never
        ? {}
        : {
            none<TKey extends AssociatedKeys<TModelMembers>>(
                key: TKey,
                fn?: AssociatedFilter<TModelMembers[TKey]>
            ): Predicate;

            some<TKey extends AssociatedKeys<TModelMembers>>(
                key: TKey,
                fn?: AssociatedFilter<TModelMembers[TKey]>
            ): Predicate;

            noneIf<TKey extends AssociatedKeys<TModelMembers>>(
                key: TKey,
                fn: AssociatedFilter<TModelMembers[TKey]>
            ): Predicate | undefined;

            someIf<TKey extends AssociatedKeys<TModelMembers>>(
                key: TKey,
                fn: AssociatedFilter<TModelMembers[TKey]>
            ): Predicate | undefined;
        };

type AssociatedKeys<TModelMembers> =
    TModelMembers extends object 
        ? { 
            [K in keyof TModelMembers]: 
                TModelMembers[K] extends AssociatedProp<any, any, any, any, any, any>
                    ? K
                    : never
        }[keyof TModelMembers] :
        never;

type AssociatedFilter<TProp> =
    TProp extends AssociatedProp<infer TargetModel, any, any, any, any, any>
        ? (
            table: EntityTableMembers<
                TargetModel, 
                AllModelMembers<TargetModel>, 
                "NONNULL", 
                "ARBITRARY"
            >
        ) => Predicate | undefined
        : never;

type CollectionAction<TModelMembers> =
    CollectionKeys<TModelMembers> extends never
        ? {}
        : {
            every<TKey extends CollectionKeys<TModelMembers>>(
                key: TKey,
                fn: AssociatedFilter<TModelMembers[TKey]>
            ): Predicate | undefined;

            size<TKey extends CollectionKeys<TModelMembers>>(
                key: TKey,
                fn?: AssociatedFilter<TModelMembers[TKey]>
            ): Expression<number>;
        };

type CollectionKeys<TModelMembers> =
    TModelMembers extends object 
        ? { 
            [K in keyof TModelMembers]: 
                TModelMembers[K] extends CollectionProp<any>
                    ? K
                    : never
        }[keyof TModelMembers] :
        never;

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
    TJoinPolicy extends JoinPolicyType = "REFERENCE"
> = {
    __type(): { 
        tableLike: true; 
        baseTable: true; 
    };
} & {
    readonly [K in keyof TMap]: 
        TMap[K] extends EntityTableMembers<any, any, any, any>
            ? MakeTableWithJoinPolicy<TMap[K], TJoinPolicy>
            : TMap[K];
} & WeakJoinAction<BaseModel<TMap>, TJoinPolicy>;

export type NullableBaseQuerySelectMapOf<
    TMap extends BaseQuerySelectMapArgs
> = {
    readonly [K in keyof TMap]: 
        TMap[K] extends Expression<infer R, infer AsNumber> 
            ? Expression<R | null, AsNumber>
        : NullableEntityTableOf<TMap[K]>;
};

type MakeTableWithJoinPolicy<TEntityTable, TJoinPolicy extends JoinPolicyType = "REFERENCE"> =
    TEntityTable extends EntityTable<infer M extends AnyModel, any>
        ? EntityTable<M, TJoinPolicy>
        : never;

export type NullableEntityTableOf<TEntityTable> =
    TEntityTable extends EntityTableMembers<infer Model, infer _ extends object, any, infer JoinPolicy extends JoinPolicyType>
        ? EntityTableMembers<Model, AllModelMembers<Model>, "NULLABLE", JoinPolicy>
        : never;

type PrettifyDsl<T> = {
    readonly [K in keyof T]: T[K];
};