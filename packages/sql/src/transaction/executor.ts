import { DataRows } from "@/impl/data_row_reader";
import { Value } from "@/sql/fragment";

export interface Executor {

    execute(sql: string): Promise<void>;

    executeStatement(
        sql: string, 
        values: ReadonlyArray<Value>
    ): Promise<DataRows>;

    executeStatements(
        sql: string,
        binds: ReadonlyArray<ReadonlyArray<Value>>
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
        values: ReadonlyArray<Value>
    ): Promise<DataRows> {
        return this._raw.executeStatement(sql, values);
    }

    executeStatements(
        sql: string,
        binds: ReadonlyArray<ReadonlyArray<Value>>
    ): Promise<ReadonlyArray<DataRows>> {
        return this._raw.executeStatements(sql, binds);
    }
}