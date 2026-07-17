import { Entity } from "@/impl/entity";
import { AllModelMembers } from "@/schema/model_internal_types";
import { JoinPolicyType } from "./table_internal_types";
import { AssociationModelImpl } from "@/impl/association_model_impl";
import { AssociationKeys, AssociationTableMembers, MakeAssociationModel } from "./association_internal_types";
import { AnyModel } from "@/schema/model";
import { EntityProp } from "@/impl/entity_prop";

export interface AssociationModel<
    TSourceModel extends AnyModel,
    TSourceKey extends keyof AllModelMembers<TSourceModel> & string,
    TTargetModel extends AnyModel,
    TTargetKey extends keyof AllModelMembers<TTargetModel> & string,
    TJoinPolicy extends JoinPolicyType
> {
    __type(): {
        readonly associationModel: [
            TSourceModel, 
            TSourceKey, 
            TTargetModel, 
            TTargetKey,
            TJoinPolicy
        ] | true;
    };

    readonly sourceEntity: Entity;

    readonly sourceKeyProp: EntityProp;

    readonly targetEntity: Entity;

    readonly targetKeyProp: EntityProp;
}

export type AnyAssociationModel = AssociationModel<AnyModel, any, AnyModel, any, any>;

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

export type AssociationTable<
    TModel extends AnyAssociationModel 
> = 
    TModel extends AssociationModel<
        infer SourceModel,
        infer SourceKey,
        infer TargetModel,
        infer TargetKey,
        infer JoinPolicy
    >
        ? AssociationTableMembers<
            SourceModel, 
            SourceKey, 
            TargetModel, 
            TargetKey,
            "NONNULL",
            JoinPolicy
        > 
        : never;
