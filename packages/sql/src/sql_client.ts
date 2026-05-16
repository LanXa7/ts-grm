import { ast, err, SqlClient } from "@ts-grm/core";
import { SqlClientOptions } from "./cfg/sql_client_options";
import { Driver } from "./driver/deriver";
import { metadata } from "@ts-grm/core";
import { SqlClientImpl } from "./impl/sql_client_impl";
import { DeepPartial, merge } from "./utils";
import { AnyFilter, FilterManager } from "./cfg/filter";
import { Executor } from "./transaction/executor";

export function newSqlClient(
    data: Driver | SqlClient,
    options: DeepPartial<SqlClientOptions>
): SqlClient {
    const originalSqlClient =
        (data as any).createQuery != null
            ? data as SqlClientImplementor
            : undefined;
    const driver = 
        originalSqlClient?.driver ?? (data as Driver);
    const finalOptions = merge(
        options, 
        originalSqlClient?.options ?? createDefaultOptions()
    );
    if (options.defaultBatchSize != null) {
        if (options.defaultBatchSize < 2) {
            throw new err.ArgumentError(
                `"options.defaultBatchSize" cannot be less than 2 when it is specified`
            );
        }
    }
    return new SqlClientImpl(driver, finalOptions);
}

export interface SqlClientImplementor extends SqlClient {

    readonly driver: Driver;

    readonly options: SqlClientOptions;

    isDirectAssociatedKey(
        expr: ast.PropExprContract
    ): boolean;

    getFilters(
        entity: metadata.Entity
    ): ReadonlyArray<AnyFilter>;

    readonly executor: Executor;
    
    readonly strategy: metadata.DatabaseStrategy;
}

function createDefaultOptions(): SqlClientOptions {
    return {
        strategy: metadata.UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY,
        defaultBatchSize: 64,
        sqlLogger: {
            pretty: false,
            parameter: "PLACEHOLDER"
        },
        filterManager: new FilterManager(),
        entityManager: undefined,
        executorCreator: defaultExecutor => defaultExecutor
    };
}
