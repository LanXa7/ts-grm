import { Entity } from "./entity";
import { EntityProp } from "./entity_prop";
import { Dto, DtoField } from "./dto";
import { AbstractDtoMapping } from "./dto_context";

export class DtoFactory {

    private readonly _fields: Array<DtoField> = [];

    constructor(
        private readonly _source: Entity | EntityProp,
        private readonly _downcastTo: Entity | undefined
    ) {}

    addMapping(mapping: AbstractDtoMapping) {
        const fields = mapping.toFields(this._downcastTo);
        if (Array.isArray(fields)) {
            this._fields.push(...fields);
        } else {
            this._fields.push(fields as DtoField);
        }
    }

    create(): Dto {
        return {
            entity: this._source instanceof Entity
                ? this._source
                : this._source.rootProp.declaringEntity,
            fields: this._fields
        };
    }
}