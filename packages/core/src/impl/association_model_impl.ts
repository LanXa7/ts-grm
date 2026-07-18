import { AssociationModel } from "@/dsl/association";
import { __OptionalModelKey } from "@/schema/model_internal_types";
import { Entity } from "./entity";
import { EntityProp } from "./entity_prop";
import { AssociationEntity } from "./association_entity";
import { makeErr } from "@/error/util";
import { __JoinPolicyType } from "@/dsl/table_internal_types";
import { AnyModel } from "@/schema/model";

export class AssociationModelImpl<
    TSourceModel extends AnyModel,
    TSourceKey extends __OptionalModelKey<TSourceModel>,
    TTargetModel extends AnyModel,
    TTargetKey extends __OptionalModelKey<TTargetModel>,
    TJoinPolicy extends __JoinPolicyType
> implements AssociationModel<TSourceModel, TSourceKey, TTargetModel, TTargetKey, TJoinPolicy> {

    __type(): {
        readonly associationModel: [
            TSourceModel, 
            TSourceKey, 
            TTargetModel, 
            TTargetKey,
            TJoinPolicy
        ] | true;
    } {
        return { associationModel: true };
    }

    readonly sourceEntity: Entity;

    readonly sourceKeyProp: EntityProp;

    readonly targetEntity: Entity;

    readonly targetKeyProp: EntityProp;

    constructor(
        private readonly _originalProp: EntityProp
    ) {
        this.sourceEntity = _originalProp.declaringEntity;
        this.targetEntity =  _originalProp.targetEntity!;
        this.sourceKeyProp = _originalProp.thisKeyProp ?? makeErr(
            `Cannot create association model for "${
                _originalProp.toString()
            }" because it is not based on middle table`
        );
        this.targetKeyProp = _originalProp.targetKeyProp!;
    }

    toEntity(): AssociationEntity {
        return this._originalProp.declaringEntity.association(this._originalProp.name);
    }
}