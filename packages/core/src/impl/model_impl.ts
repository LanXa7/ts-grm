import { Entity } from "@/impl/entity";
import { AnyModel, Ctor, Model } from "@/schema/model";

export class ModelImpl<
    TName extends string, 
    TIdKey extends string,
    TCtor extends Ctor,
    TAllMembers extends object,
    TSuperNames extends string | never
> implements Model<
    TName,
    TIdKey,
    TCtor,
    TAllMembers,
    TSuperNames
> {

    private _entity: Entity | undefined;

    __type(): {
        model: [TName, TIdKey, TCtor, TAllMembers, TSuperNames] | undefined 
    } {
        return { model: undefined };
    }

    constructor(
        readonly name: TName,
        readonly idKey: TIdKey | undefined,
        readonly ctor: TCtor,
        readonly superModel?: AnyModel
    ) {}

    toEntity(): Entity {
        return this.toUnresolvedEntity().resolve(2);
    }

    toUnresolvedEntity(): Entity {
        let entity = this._entity;
        if (entity === undefined) {
            this._entity = entity = new Entity(
                this.name,
                this.idKey,
                this.ctor,
                this.superModel
            );
        }
        return entity;
    }
}