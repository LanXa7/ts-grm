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
