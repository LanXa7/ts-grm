import { Entity } from "./entity";
import { EntityProp } from "./entity_prop";
import { Column } from "./storage";

export interface DatabaseNamingStrategy {

    tableName(entity: Entity): string;

    sequenceName(entity: Entity): string;

    columnName(prop: EntityProp): string;

    middleTableName(prop: EntityProp): string;

    middleTableThisRefColumnName(prop: EntityProp): string;

    middleTableTargetRefColumnName(prop: EntityProp): string;
}

export class DefaultDatabaseNamingStrategy implements DatabaseNamingStrategy {

    constructor(private readonly lower: boolean) {}

    tableName(entity: Entity): string {
        return toSnakeCase(entity.name, this.lower);
    }

    sequenceName(entity: Entity): string {
        return `${
            toSnakeCase(entity.name, this.lower)
        }_${
            this.lower ? "id_seq" : "ID_SEQ"
        }`;
    }

    columnName(prop: EntityProp): string {
        return toSnakeCase(prop.name, this.lower);
    }

    middleTableName(prop: EntityProp): string {
        return `${
            toSnakeCase(prop.declaringEntity.name, this.lower)
        }_${
            toSnakeCase(prop.targetEntity!.name, this.lower)
        }_${
            this.lower ? "mapping" : "MAPPING"
        }`;
    }

    middleTableThisRefColumnName(prop: EntityProp): string {
        return `${
            toSnakeCase(prop.declaringEntity.name, this.lower)
        }_${
            toSnakeCase(prop.thisKey!, this.lower)
        }`;
    }

    middleTableTargetRefColumnName(prop: EntityProp): string {
        return `${
            toSnakeCase(prop.targetEntity!.name, this.lower)
        }_${
            toSnakeCase(prop.targetKey!, this.lower)
        }`;
    }
}

function toSnakeCase(text: string, lower: boolean): string {
    const replaced = text
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2');
    return lower ? replaced.toLowerCase() : replaced.toUpperCase();
}

export const UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY = new DefaultDatabaseNamingStrategy(false);

export const LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY = new DefaultDatabaseNamingStrategy(true);

export function joinColumnArr(
    arr: ReadonlyArray<Column>, 
    defaultNameFn: () => string
): ReadonlyArray<Column> {
    if (arr.length !== 1) {
        return arr;
    }
    if (arr[0]!.name !== "") {
        return arr;
    }
    return [{
        ...arr[0]!,
        name: defaultNameFn()
    }];
}
