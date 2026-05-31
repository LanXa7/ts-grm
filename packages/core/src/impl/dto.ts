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

    path: string | ReadonlyArray<string> | undefined;

    readonly downcastTo: Entity | undefined;

    readonly prop: FetchProp;

    // m2m property based on middle entity
    // when property means property to middle entity
    readonly bridgeProp: EntityProp | undefined;

    readonly dto: Dto | undefined;

    readonly fetchType: ReferenceFetchType | undefined;

    readonly orders: ReadonlyArray<EntityPropOrder> | undefined;

    readonly recursiveDepth: number | undefined;

    readonly nullable: boolean;

    readonly parameter: any;
};

export type FetchProp = EntityProp | InverseFetchProp | TypeNameProp;

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

export class TypeNameProp {

    constructor(
        readonly declaringEntity: Entity,
        readonly columName: string | undefined,
        readonly constant: string | undefined
    ) {}

    get name(): "__typename" {
        return "__typename";
    }

    get isEntityProp(): false {
        return false;
    }

    get targetEntity(): undefined {
        return undefined;
    }

    get referenceKeyProp(): undefined {
        return undefined;
    }

    get thisKeyProp(): undefined {
        return undefined;
    }

    get targetKeyProp(): undefined {
        return undefined;
    }

    get associationType(): undefined {
        return undefined;
    }

    toString(): string {
        return `${this.declaringEntity.name}.__typename`;
    }
}

export function foldDto(dto: Dto, key: string): Dto {
    return {
        ...dto,
        fields: dto.fields.map(field => foldDtoField(field, key))
    };
}

function foldDtoField(
    dtoField: DtoField, 
    key: string
): DtoField {
    let path = dtoField.path;
    if (path == null) {
        if (dtoField.dto == null) {
            return dtoField;
        }
        return {
            ...dtoField,
            dto: foldDto(dtoField.dto, key)
        };
    }
    if (typeof path === "string") {
        path = [key, path];
    } else {
        const index = path.lastIndexOf("..");
        if (index === -1) {
            path = [key, ...path];
        } else {
            path = [...path.slice(0, index + 1), key, ...path.slice(index + 1, path.length)];
        }
    }
    return {
        ...dtoField,
        path
    };
}