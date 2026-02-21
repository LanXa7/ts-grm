import type { metadata } from "@ts-grm/core";

export interface DatabaseNamingStrategy {

    tableName(entity: metadata.Entity): string;

    sequenceName(entity: metadata.Entity): string;

    columnName(prop: metadata.EntityProp): string;

    foreignKeyColumnName(prop: metadata.EntityProp): string;

    middleTableName(prop: metadata.EntityProp): string;

    middleTableThisRefColumnName(prop: metadata.EntityProp): string;

    middleTableTargetRefColumnName(prop: metadata.EntityProp): string;
}

class DefaultDatabaseNamingStrategy implements DatabaseNamingStrategy {

    constructor(private readonly lower: boolean) {}

    tableName(entity: metadata.Entity): string {
        return toSnakeCase(entity.name, this.lower);
    }

    sequenceName(entity: metadata.Entity): string {
        return `${
            toSnakeCase(entity.name, this.lower)
        }_${
            this.lower ? "id_seq" : "ID_SEQ"
        }`;
    }

    columnName(prop: metadata.EntityProp): string {
        return toSnakeCase(prop.name, this.lower);
    }

    foreignKeyColumnName(prop: metadata.EntityProp): string {
        return this.columnName(prop.referenceKeyProp ?? prop);
    }

    middleTableName(prop: metadata.EntityProp): string {
        return `${
            toSnakeCase(prop.declaringEntity.name, this.lower)
        }_${
            toSnakeCase(prop.targetEntity!.name, this.lower)
        }_${
            this.lower ? "mapping" : "MAPPING"
        }`;
    }

    middleTableThisRefColumnName(prop: metadata.EntityProp): string {
        return `${
            toSnakeCase(prop.declaringEntity.name, this.lower)
        }_${
            toSnakeCase(prop.thisKey ?? "id", this.lower)
        }`;
    }

    middleTableTargetRefColumnName(prop: metadata.EntityProp): string {
        return `${
            toSnakeCase(prop.targetEntity!.name, this.lower)
        }_${
            toSnakeCase(prop.targetKey ?? "id", this.lower)
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
