import { AllModelMembers, RequiredModelKey } from "@/schema/model_internal_types";
import { EntityTableMembers, FilterType, JoinPolicyType } from "./table_internal_types";
import { MakeExpression } from "./expression";
import { AssociatedPropContract, EmbeddedPropContract, NullityType, ReferencePropContract } from "@/schema/prop_internal_types";
import { CombinedNullity } from "@/schema/prop_internal_behavior";
import { AssociationModel } from "./association";
import { AnyModel } from "@/schema/model";

export type AssociationKeys<TModel extends AnyModel> =
    AssociationKeysImpl<AllModelMembers<TModel>>;

type AssociationKeysImpl<TModelMembers> =
    TModelMembers extends object 
        ? { 
            [K in keyof TModelMembers]: 
                TModelMembers[K] extends AssociatedPropContract<any, any, any, true, any, any>
                    ? K
                    : never
        }[keyof TModelMembers] :
        never;

export type MakeAssociationModel<
    TModel extends AnyModel,
    TAssociationKey extends AssociationKeys<TModel>
> = 
    AllModelMembers<TModel>[TAssociationKey] extends AssociatedPropContract<
        infer TargetModel, 
        any, 
        any, 
        true,
        infer SourceKey, 
        infer TargetKey
    >
        ? AssociationModel<
            TModel,
            RequiredModelKey<TModel, SourceKey>,
            TargetModel,
            RequiredModelKey<TargetModel, TargetKey>,
            AllModelMembers<TModel>[TAssociationKey] extends ReferencePropContract<any, any, any, any, any, any>
                ? "ARBITRARY"
                : "REFERENCE"
        >
        : never;

export type MakeAssociationTableMembers<
    TModel extends AnyModel,
    TAssociationKey extends AssociationKeys<TModel>,
    TNullity extends NullityType
> = 
    AllModelMembers<TModel>[TAssociationKey] extends AssociatedPropContract<
        infer TargetModel, 
        any, 
        any, 
        true,
        infer SourceKey, 
        infer TargetKey
    >
        ? AssociationTableMembers<
            TModel,
            RequiredModelKey<TModel, SourceKey>,
            TargetModel,
            RequiredModelKey<TargetModel, TargetKey>,
            TNullity,
            AllModelMembers<TModel>[TAssociationKey] extends ReferencePropContract<any, any, any, any, any, any>
                ? "ARBITRARY"
                : "REFERENCE"
        >
        : never;
      
export type AssociationTableMembers<
    TSourceModel extends AnyModel,
    TSourceKey extends keyof AllModelMembers<TSourceModel> & string,
    TTargetModel extends AnyModel,
    TTargetKey extends keyof AllModelMembers<TTargetModel> & string,
    TNullity extends NullityType,
    TJoinPolicy extends JoinPolicyType
> = {

    __type(): {
        readonly tableLike: true;
    };

    source(
        filter?: FilterType<
            AssociationModel<TSourceModel, TSourceKey, TTargetModel, TSourceKey, TJoinPolicy>, 
            TSourceModel
        >
    ): EntityTableMembers<
        TSourceModel, 
        AllModelMembers<TSourceModel>,
        TNullity,
        TJoinPolicy
    >;

    target(
        filter?: FilterType<
            AssociationModel<TSourceModel, TSourceKey, TTargetModel, TSourceKey, TJoinPolicy>, 
            TTargetModel
        >
    ): EntityTableMembers<
        TTargetModel,
        AllModelMembers<TTargetModel>,
        TNullity,
        TJoinPolicy
    >;
} & {
    readonly [K in `source${Capitalize<TSourceKey>}`]: 
        AssociationKeyType<AllModelMembers<TSourceModel>, TSourceKey, TNullity>;
} & {
    readonly [K in `target${Capitalize<TTargetKey>}`]: 
        AssociationKeyType<AllModelMembers<TTargetModel>, TTargetKey, TNullity>;
};

type AssociationKeyType<
    TMembers,
    TKey extends keyof TMembers, 
    TNullity extends NullityType
> = 
    TMembers[TKey] extends EmbeddedPropContract<infer Props, infer Nullity, any>
        ? () => {
            readonly [K in keyof Props]: AssociationKeyType<
                Props,
                K & keyof Props,
                CombinedNullity<TNullity, Nullity>
            >
        }
        : MakeExpression<TMembers[TKey], TNullity>;
