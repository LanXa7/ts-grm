import { Entity, EntityProp } from "@/impl";
import { AllModelMembers, AnyModel, RequiredModelKey } from "@/schema/model";
import { AssociatedProp, CombinedNullity, EmbeddedProp, NullityType, ReferenceProp } from "@/schema/prop";
import { EntityTableMembers, FilterType } from "./table";
import { MakeExpression } from "./expression";
import { AssociationModelImpl } from "@/impl/association_model_impl";

export interface AssociationModel<
    TSourceModel extends AnyModel,
    TSourceKey extends keyof AllModelMembers<TSourceModel> & string,
    TTargetModel extends AnyModel,
    TTargetKey extends keyof AllModelMembers<TTargetModel> & string,
    TMultiAccepted extends boolean
> {
    __type(): {
        readonly associationModel: [
            TSourceModel, 
            TSourceKey, 
            TTargetModel, 
            TTargetKey,
            TMultiAccepted
        ] | true;
    };

    readonly sourceEntity: Entity;

    readonly sourceKeyProp: EntityProp;

    readonly targetEntity: Entity;

    readonly targetKeyProp: EntityProp;
}

export type AnyAssociationModel = AssociationModel<AnyModel, any, AnyModel, any, any>;

export type AssociationKeys<TModel extends AnyModel> =
    AssociationKeysImpl<AllModelMembers<TModel>>;

type AssociationKeysImpl<TModelMembers> =
    TModelMembers extends object 
        ? { 
            [K in keyof TModelMembers]: 
                TModelMembers[K] extends AssociatedProp<any, any, any, true, any, any>
                    ? K
                    : never
        }[keyof TModelMembers] :
        never;

export function associationModel<
    TModel extends AnyModel,
    TAssociationKey extends AssociationKeys<TModel>
>(
    model: TModel,
    associationKey: TAssociationKey
): MakeAssociationModel<TModel, TAssociationKey> {
    const sourceEntity = Entity.of(model);
    const associationProp = sourceEntity.prop(associationKey);
    return new AssociationModelImpl(associationProp) as any;
}

export type MakeAssociationModel<
    TModel extends AnyModel,
    TAssociationKey extends AssociationKeys<TModel>
> = 
    AllModelMembers<TModel>[TAssociationKey] extends AssociatedProp<
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
            AllModelMembers<TModel>[TAssociationKey] extends ReferenceProp<any, any, any, any, any, any>
                ? true
                : false
        >
        : never;

export type MakeAssociationTableMembers<
    TModel extends AnyModel,
    TAssociationKey extends AssociationKeys<TModel>,
    TNullity extends NullityType
> = 
    AllModelMembers<TModel>[TAssociationKey] extends AssociatedProp<
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
            AllModelMembers<TModel>[TAssociationKey] extends ReferenceProp<any, any, any, any, any, any>
                ? true
                : false
        >
        : never;

export type AssociationTable<
    TModel extends AnyAssociationModel 
> = 
    TModel extends AssociationModel<
        infer SourceModel,
        infer SourceKey,
        infer TargetModel,
        infer TargetKey,
        infer MultiAccepted
    >
        ? AssociationTableMembers<
            SourceModel, 
            SourceKey, 
            TargetModel, 
            TargetKey,
            "NONNULL",
            MultiAccepted
        > 
        : never;
      
export type AssociationTableMembers<
    TSourceModel extends AnyModel,
    TSourceKey extends keyof AllModelMembers<TSourceModel> & string,
    TTargetModel extends AnyModel,
    TTargetKey extends keyof AllModelMembers<TTargetModel> & string,
    TNullity extends NullityType,
    TMultiAccepted extends boolean
> = {

    __type(): {
        readonly tableLike: true;
    };

    source(
        filter?: FilterType<
            AssociationModel<TSourceModel, TSourceKey, TTargetModel, TSourceKey, TMultiAccepted>, 
            TSourceModel
        >
    ): EntityTableMembers<
        TSourceModel, 
        AllModelMembers<TSourceModel>,
        TNullity,
        TMultiAccepted
    >;

    target(
        filter?: FilterType<
            AssociationModel<TSourceModel, TSourceKey, TTargetModel, TSourceKey, TMultiAccepted>, 
            TTargetModel
        >
    ): EntityTableMembers<
        TTargetModel,
        AllModelMembers<TTargetModel>,
        TNullity,
        TMultiAccepted
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
    TMembers[TKey] extends EmbeddedProp<infer Props, infer Nullity, any>
        ? () => {
            readonly [K in keyof Props]: AssociationKeyType<
                Props,
                K & keyof Props,
                CombinedNullity<TNullity, Nullity>
            >
        }
        : MakeExpression<TMembers[TKey], TNullity>;
