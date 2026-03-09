import { EntityProp } from "./entity_prop";

export type StorageType = "NONE" 
    | Column["kind"] 
    | Columns["kind"] 
    | MiddleTable["kind"];

export type PropStorage = 
    Column 
    | Columns 
    | MiddleTable;

export type Column = {
    readonly kind: "COLUMN";
    readonly name: string;
    readonly referencedProp: EntityProp | undefined;
    readonly referencedColumnName: string | undefined;
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
