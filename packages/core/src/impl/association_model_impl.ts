import { AssociationModel } from "@/dsl";
import { AnyModel, OptionalModelKey } from "@/schema/model";
import { AssociationEntity, Entity, EntityProp } from ".";
import { makeErr } from "@/error/util";
import { JoinPolicyType } from "@/dsl/table";

export class AssociationModelImpl<
    TSourceModel extends AnyModel,
    TSourceKey extends OptionalModelKey<TSourceModel>,
    TTargetModel extends AnyModel,
    TTargetKey extends OptionalModelKey<TTargetModel>,
    TJoinPolicy extends JoinPolicyType
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