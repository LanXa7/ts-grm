import { Entity, EntityProp } from "@ts-grm/core";

export interface DatabaseNamingStrategy {

    tableName(entity: Entity): string;

    sequenceName(entity: Entity): string;

    columnName(prop: EntityProp): string;

    foreignKeyColumnName(prop: EntityProp): string;

    middleTableName(prop: EntityProp): string;

    middleTableBackRefColumnName(prop: EntityProp): string;

    middleTableTargetRefColumnName(prop: EntityProp): string;
}