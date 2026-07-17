import { AllModelMembers, DerivedModel, RequiredModelKey } from "@/schema/model_internal_types";
import { Expression, MakeExpression, MakeType, Predicate } from "./expression";
import { FilterNever } from "@/utils";
import { View } from "@/schema/dto/api";
import { FetchedView } from "./root_query";
import { BaseQuerySelectMapArgs, BaseModel, BaseQueryMapOf } from "./base_query";
import { 
    EmbeddedPropContract, 
    I64PropContract, 
    ScalarPropContract, 
    AssociatedPropContract,
    EnumSetPropContract,
    CollectionPropContract, 
    NullityType, 
    ReferencePropContract 
} from "@/schema/prop_internal_types";
import { CombinedNullity } from "@/schema/prop_internal_behavior";
import { BaseTable, EntityTable, JoinType, Table } from "./table";
import { AssociationKeys, MakeAssociationModel, MakeAssociationTableMembers } from "./association_internal_types";
import { AnyAssociationModel } from "./association";
import { AnyModel } from "@/schema/model";

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

export type JoinPolicyType = "NONE" | "REFERENCE" | "ARBITRARY";

export type EntityTableMembers<
    TModel extends AnyModel, 
    TMembers extends object, 
    TNullity extends NullityType, 
    TJoinPolicy extends JoinPolicyType
> = PrettifyDsl<
    DslMembers<TModel, TMembers, TNullity, TJoinPolicy>
    & WeakJoinAction<TModel, TJoinPolicy> 
    & StaticMembers<TModel, TMembers, TNullity, TJoinPolicy>
>;

export type DslMembers<
    TModel extends AnyModel, 
    TMembers extends object, 
    TNullity extends NullityType, 
    TJoinPolicy extends JoinPolicyType
> = 
    FilterNever<{
        [K in keyof TMembers]:
            TMembers[K] extends ScalarPropContract<infer R, infer Nullity>
                ? TMembers[K] extends I64PropContract<infer R, infer Nullity>
                    ? Expression<
                        MakeType<R, CombinedNullity<TNullity, Nullity>>,
                        R extends string ? "AS_NUMBER" : ""
                    >
                : TMembers[K] extends EnumSetPropContract<infer R>
                    ? Expression<
                        MakeType<R, TNullity>,
                        R extends string ? "AS_ENUM_SET" : ""
                    >
                : Expression<MakeType<R, CombinedNullity<TNullity, Nullity>>>
            : TMembers[K] extends EmbeddedPropContract<infer R, infer Nullity, any>
                ? () => DslMembers<TModel, R, CombinedNullity<TNullity, Nullity>, TJoinPolicy>
            : TJoinPolicy extends "NONE"
                ? never
            : TMembers[K] extends ReferencePropContract<infer TargetModel, any, any, any, any, any>
                ? ReferenceJoinAction<TModel, TargetModel, AllModelMembers<TargetModel>, TJoinPolicy>
            : TMembers[K] extends CollectionPropContract<infer TargetModel, any, any, any, any>
                ? CollectionJoinAction<TModel, TargetModel, AllModelMembers<TargetModel>, TJoinPolicy>
            : never
        } & DslReferenceKeyMembers<TModel, TMembers, TNullity>
    >;

export type DslReferenceKeyMembers<TModel extends AnyModel, TMembers, TNullity extends NullityType> = {
    [
        K in keyof TMembers as
            TMembers[K] extends ReferencePropContract<infer _, any, "OWNING", false, any, infer TKey>
                ? TKey extends string
                    ? `${K & string}${Capitalize<RequiredModelKey<TModel, TKey>>}`
                    : never
                : never
    ]: TMembers[K] extends ReferencePropContract<infer TargetModel, infer Nullity, "OWNING", false, any, infer Key>
        ? Key extends string
            ? AllModelMembers<TargetModel>[RequiredModelKey<TargetModel, Key>] extends EmbeddedPropContract<infer R, any, any>
                ? () => DslMembers<TModel, R, CombinedNullity<TNullity, Nullity>, "REFERENCE">
            : MakeExpression<
                AllModelMembers<TargetModel>[RequiredModelKey<TModel, Key>],
                CombinedNullity<TNullity, Nullity>
            >
            : never
        : never
};

export type ReferenceJoinAction<
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

export type CollectionJoinAction<
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

export type TableRiskWrapper<T extends TableLike, TJoinPolicy extends JoinPolicyType> = 
    TJoinPolicy extends "ARBITRARY"
        ? T
        : { $acceptMulti(): T; };

export type WeakJoinAction<
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

export interface StaticMembers<
    TModel extends AnyModel,
    TMembers extends object,
    TNullity extends NullityType, 
    TJoinPolicy extends JoinPolicyType
> extends AssociatedAction<TMembers>, AssociationAction<TModel, TJoinPolicy>, CollectionAction<TMembers> { 
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

export interface AssociationAction<TModel extends AnyModel, TJoinPolicy extends JoinPolicyType> {
    
    association<
        TKey extends AssociationKeys<TModel>
    >(
        key: TKey,
    ): TableRiskWrapper<
        MakeAssociationTableMembers<
            TModel,
            TKey,
            "NONNULL"
        >,
        TJoinPolicy
    >;

    association<
        TKey extends AssociationKeys<TModel>,
        TJoinType extends JoinType = "INNER"
    >(
        key: TKey,
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
        TKey extends AssociationKeys<TModel>
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
        TKey extends AssociationKeys<TModel>,
        TJoinType extends JoinType = "INNER"
    >(
        key: TKey,
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

export interface AssociatedAction<TModelMembers> {
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

export type AssociatedKeys<TModelMembers> =
    TModelMembers extends object 
        ? { 
            [K in keyof TModelMembers]: 
                TModelMembers[K] extends AssociatedPropContract<any, any, any, any, any, any>
                    ? K
                    : never
        }[keyof TModelMembers] :
        never;

export type AssociatedFilter<TProp> =
    TProp extends AssociatedPropContract<infer TargetModel, any, any, any, any, any>
        ? (
            table: EntityTableMembers<
                TargetModel, 
                AllModelMembers<TargetModel>, 
                "NONNULL", 
                "ARBITRARY"
            >
        ) => Predicate | undefined
        : never;

export interface CollectionAction<TModelMembers> {
    every<TKey extends CollectionKeys<TModelMembers>>(
        key: TKey,
        fn: AssociatedFilter<TModelMembers[TKey]>
    ): Predicate | undefined;

    size<TKey extends CollectionKeys<TModelMembers>>(
        key: TKey,
        fn?: AssociatedFilter<TModelMembers[TKey]>
    ): Expression<number>;
}

export type CollectionKeys<TModelMembers> =
    TModelMembers extends object 
        ? { 
            [K in keyof TModelMembers]: 
                TModelMembers[K] extends CollectionPropContract<any, any, any, any, any>
                    ? K
                    : never
        }[keyof TModelMembers] :
        never;

export interface FilterType<
    TParentModel extends ModelLike, 
    TModel extends ModelLike
> {
    (ctx: FilterContextType<TParentModel, TModel>): Predicate | undefined;
}

export interface FilterContextType<
    TParentModel extends ModelLike, 
    TModel extends ModelLike
> {
    readonly source: Table<TParentModel>;
    readonly target: Table<TModel>;
};

export type NullableBaseQuerySelectMapOf<
    TMap extends BaseQuerySelectMapArgs
> = {
    readonly [K in keyof TMap]: 
        TMap[K] extends Expression<infer R, infer AsNumber> 
            ? Expression<R | null, AsNumber>
        : NullableEntityTableOf<TMap[K]>;
};

export type MakeTableWithJoinPolicy<TEntityTable, TJoinPolicy extends JoinPolicyType = "REFERENCE"> =
    TEntityTable extends EntityTable<infer M extends AnyModel, any>
        ? EntityTable<M, TJoinPolicy>
        : never;

export type NullableEntityTableOf<TEntityTable> =
    TEntityTable extends EntityTableMembers<infer Model, infer _ extends object, any, infer JoinPolicy extends JoinPolicyType>
        ? EntityTableMembers<Model, AllModelMembers<Model>, "NULLABLE", JoinPolicy>
        : never;

export type PrettifyDsl<T> = {
    readonly [K in keyof T]: T[K];
};