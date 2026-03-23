import { makeErr } from "@/error/util";
import { Entity, EntityProp } from "@/impl";
import { AllModelMembers, AnyModel, ModelIdKey, ReferenceKey } from "@/schema/model";
import { AssociatedProp, DirectTypeOf, I64Prop } from "@/schema/prop";
import { EntityTable, Expression } from ".";

export interface AssociationModel<
    TSourceModel extends AnyModel,
    TSourceKeyName extends ReferenceKey<TSourceModel>,
    TTargetModel extends AnyModel,
    TTargetKeyName extends ReferenceKey<TTargetModel>
> {
    __type(): {
        readonly associationModel: [
            TSourceModel, 
            TSourceKeyName, 
            TTargetModel, 
            TTargetKeyName
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
                TModelMembers[K] extends AssociatedProp<any, any, any, any, any>
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

type MakeAssociationModel<
    TModel extends AnyModel,
    TAssociationKey extends AssociationKeys<TModel>
> = 
    AllModelMembers<TModel>[TAssociationKey] extends AssociatedProp<
        infer TargetModel, 
        any, 
        any, 
        infer SourceKey, 
        infer TargetKey
    >
        ? AssociationModel<
            TModel,
            SourceKey extends "" ? ModelIdKey<TModel> : SourceKey,
            TargetModel,
            TargetKey extends "" ? ModelIdKey<TargetModel> : TargetKey
        >
        : never;

class AssociationModelImpl<
    TSourceModel extends AnyModel,
    TSourceKeyName extends ReferenceKey<TSourceModel>,
    TTargetModel extends AnyModel,
    TTargetKeyName extends ReferenceKey<TTargetModel>
> implements AssociationModel<TSourceModel, TSourceKeyName, TTargetModel, TTargetKeyName> {

    __type(): {
        readonly associationModel: [
            TSourceModel, 
            TSourceKeyName, 
            TTargetModel, 
            TTargetKeyName
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
        infer SourceKeyName,
        infer TargetModel,
        infer TargetKeyName
    >
        ? AssociationTableMembers<
            SourceModel, 
            SourceKeyName, 
            TargetModel, 
            TargetKeyName
        > 
        : never;
      
type AssociationTableMembers<
    TSourceModel extends AnyModel,
    TSourceKeyName extends ReferenceKey<TSourceModel> & string,
    TTargetModel extends AnyModel,
    TTargetKeyName extends ReferenceKey<TTargetModel> & string
> = {

    readonly source: EntityTable<TSourceModel>;

    readonly target: EntityTable<TTargetModel>;
} & {
    readonly [K in `source${Capitalize<TSourceKeyName>}`]: 
        AssociationKeyType<TSourceModel, TSourceKeyName>;
} & {
    readonly [K in `target${Capitalize<TTargetKeyName>}`]: 
        AssociationKeyType<TTargetModel, TTargetKeyName>;
};

type AssociationKeyType<TModel extends AnyModel, TKeyName extends string> = 
    AllModelMembers<TModel>[TKeyName] extends I64Prop<infer R, any>
        ? Expression<R, R extends string ? "AS_NUMBER" : "">
        : Expression<DirectTypeOf<AllModelMembers<TModel>[TKeyName]>>;