import { ReferenceFetchType } from "@/schema/dto";
import { EntityProp } from "./entity_prop";
import { EntityPropOrder } from "./entity_prop_order";
import { Entity } from "./entity";
import { AssociationType } from "@/schema/prop";

export type Dto = {

    readonly entity: Entity | undefined;
    
    readonly fields: ReadonlyArray<DtoField>;
};

export type DtoField = {

    readonly path: string | ReadonlyArray<string> | undefined;

    readonly prop: FetchProp;

    // m2m property based on middle entity
    // when property means property to middle entity
    readonly bridgeProp: EntityProp | undefined;

    readonly dto: Dto | undefined;

    readonly fetchType: ReferenceFetchType | undefined;

    readonly orders: ReadonlyArray<EntityPropOrder> | undefined;

    readonly recursiveDepth: number | undefined;

    readonly nullable: boolean;

    readonly dependency: Dto | undefined;
};

export type FetchProp = EntityProp | InverseFetchProp;

export class InverseFetchProp {

    private constructor(
        readonly prop: EntityProp
    ) {}

    static of(prop: EntityProp): EntityProp | InverseFetchProp {
        return prop.oppositeProp ?? new InverseFetchProp(prop);
    }

    get name(): string {
        return `←${this.prop.declaringEntity.name}.${this.prop.name}`;
    }

    get isEntityProp(): boolean {
        return false;
    }

    get associationType(): AssociationType | undefined {
        const associationType = this.prop.associationType;
        switch (associationType) {
            case "ONE_TO_MANY":
                return "MANY_TO_ONE";
            case "MANY_TO_ONE":
                return "ONE_TO_MANY";
            default:
                return associationType;
        }
    }

    get declaringEntity(): Entity {
        return this.prop.targetEntity!;
    }

    get targetEntity(): Entity {
        return this.prop.declaringEntity;
    }

    get referenceKeyProp(): undefined {
        return undefined;
    }

    get thisKeyProp(): EntityProp | undefined {
        return this.prop.targetKeyProp;
    }

    get targetKeyProp(): EntityProp | undefined {
        return this.prop.thisKeyProp;
    }

    toString() {
        return `←${this.prop.toString()}`;
    }
}