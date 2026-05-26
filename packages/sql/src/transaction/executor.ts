import { DataRows } from "@/impl/data_row_reader";
import { Value } from "@/sql/fragment";
import { metadata } from "@ts-grm/core";

export interface Executor {

    execute(sql: string): Promise<void>;

    executeStatement(
        sql: string, 
        values: ReadonlyArray<Value>,
        purpose: Purpose
    ): Promise<DataRows>;

    executeStatements(
        sql: string,
        binds: ReadonlyArray<ReadonlyArray<Value>>,
        purpose: Purpose
    ): Promise<ReadonlyArray<DataRows>>;
}

export abstract class AbstractExecutorWrapper implements Executor {

    constructor(
        private readonly _raw: Executor
    ) {}

    execute(sql: string): Promise<void> {
        return this._raw.execute(sql);
    }

    executeStatement(
        sql: string, 
        values: ReadonlyArray<Value>,
        purpose: Purpose
    ): Promise<DataRows> {
        return this._raw.executeStatement(sql, values, purpose);
    }

    executeStatements(
        sql: string,
        binds: ReadonlyArray<ReadonlyArray<Value>>,
        purpose: Purpose
    ): Promise<ReadonlyArray<DataRows>> {
        return this._raw.executeStatements(sql, binds, purpose);
    }
}

export type Purpose = 
    QueryPurpose 
    | LoadAssociationPurpose 
    | LoadRecursiveTreePurpose
    | LoadRecursiveTreeIdPurpose
    | LoadRecursiveTreeNodePurpose;

export type QueryPurpose = {
    kind: "QUERY"
};

export type LoadAssociationPurpose = {
    kind: "LOAD_ASSOCIATION",
    prop: metadata.EntityProp
};

export type LoadRecursiveTreePurpose = {
    kind: "LOAD_RECURSIVE_TREE",
    prop: metadata.EntityProp
};

export type LoadRecursiveTreeIdPurpose = {
    kind: "LOAD_RECURSIVE_TREE_ID",
    prop: metadata.EntityProp
};

export type LoadRecursiveTreeNodePurpose = {
    kind: "LOAD_RECURSIVE_TREE_NODE",
    prop: metadata.EntityProp
};