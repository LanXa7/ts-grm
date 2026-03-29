import { makeErr } from "@/error/util";
import { Entity, EntityProp } from "@/impl";
import { AllModelMembers, AnyModel, RequiredModelKey, OptionalModelKey } from "@/schema/model";
import { AssociatedProp, NullityType } from "@/schema/prop";
import { EntityTableMembers } from "./table";
import { MakeExpression } from "./expression";

export interface AssociationModel<
    TSourceModel extends AnyModel,
    TSourceKey extends keyof AllModelMembers<TSourceModel> & string,
    TTargetModel extends AnyModel,
    TTargetKey extends keyof AllModelMembers<TTargetModel> & string
> {
    __type(): {
        readonly associationModel: [
            TSourceModel, 
            TSourceKey, 
            TTargetModel, 
            TTargetKey
        ] | true;
    };

    readonly sourceEntity: Entity;

    readonly sourceKeyProp: EntityProp;

    readonly targetEntity: Entity;

    readonly targetKeyProp: EntityProp;

    readonly associationProp: EntityProp;
}

export type AnyAssociationModel = AssociationModel<AnyModel, any, AnyModel, any>;

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
            RequiredModelKey<TargetModel, TargetKey>
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
            TNullity
        >
        : never;

class AssociationModelImpl<
    TSourceModel extends AnyModel,
    TSourceKey extends OptionalModelKey<TSourceModel>,
    TTargetModel extends AnyModel,
    TTargetKey extends OptionalModelKey<TTargetModel>
> implements AssociationModel<TSourceModel, TSourceKey, TTargetModel, TTargetKey> {

    __type(): {
        readonly associationModel: [
            TSourceModel, 
            TSourceKey, 
            TTargetModel, 
            TTargetKey
        ] | true;
    } {
        return { associationModel: true };
    }

    readonly sourceEntity: Entity;

    readonly sourceKeyProp: EntityProp;

    readonly targetEntity: Entity;

    readonly targetKeyProp: EntityProp;

    constructor(
        readonly associationProp: EntityProp
    ) {
        this.sourceEntity = associationProp.declaringEntity;
        this.targetEntity = associationProp.targetEntity!;
        this.sourceKeyProp = associationProp.thisKeyProp ?? makeErr(
            `Cannot create association model for "${
                associationProp.toString()
            }" because it is not based on middle table`
        );
        this.targetKeyProp = associationProp.targetKeyProp!;
    }
}

export type AssociationTable<
    TModel extends AnyAssociationModel 
> = 
    TModel extends AssociationModel<
        infer SourceModel,
        infer SourceKey,
        infer TargetModel,
        infer TargetKey
    >
        ? AssociationTableMembers<
            SourceModel, 
            SourceKey, 
            TargetModel, 
            TargetKey,
            "NONNULL"
        > 
        : never;
      
export type AssociationTableMembers<
    TSourceModel extends AnyModel,
    TSourceKey extends keyof AllModelMembers<TSourceModel> & string,
    TTargetModel extends AnyModel,
    TTargetKey extends keyof AllModelMembers<TTargetModel> & string,
    TNullity extends NullityType
> = {

    __type(): {
        readonly tableLike: true;
    };

    readonly source: EntityTableMembers<
        TSourceModel, 
        AllModelMembers<TSourceModel>,
        TNullity,
        false
    >;

    readonly target: EntityTableMembers<
        TTargetModel,
        AllModelMembers<TSourceModel>,
        TNullity,
        false
    >;
} & {
    readonly [K in `source${Capitalize<TSourceKey>}`]: 
        AssociationKeyType<TSourceModel, TSourceKey, TNullity>;
} & {
    readonly [K in `target${Capitalize<TTargetKey>}`]: 
        AssociationKeyType<TTargetModel, TTargetKey, TNullity>;
};

type AssociationKeyType<
    TModel extends AnyModel, 
    TKey extends string, 
    TNullity extends NullityType
> = 
    MakeExpression<AllModelMembers<TModel>[TKey], TNullity>;
