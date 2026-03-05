import { EntityProp } from "./entity_prop";

export type PropStorage = 
    Column | 
    Columns |
    MiddleTable;

export type Column = {
    readonly kind: "COLUMN";
    readonly name: string;
    readonly referencedSubProp: EntityProp | undefined;
};

export type Columns = {
    readonly kind: "COLUMNS"
} & ReadonlyArray<Column>;

export type MiddleTable = {
    readonly kind: "MIDDLE_TABLE";
    readonly name: string;
    readonly toThisColumns: ReadonlyArray<Column>;
    readonly toTargetColumns: ReadonlyArray<Column>;
}
