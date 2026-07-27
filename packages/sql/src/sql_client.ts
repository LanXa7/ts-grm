import { err, spi, SqlClient } from "@ts-grm/core";
import { SqlClientOptions } from "./cfg/sql_client_options";
import { Driver } from "./driver/deriver";
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
    if (options.defaultBatchSize != null && options.defaultBatchSize < 2) {
        throw new err.ArgumentError(
            `"options.defaultBatchSize" cannot be less than 2 when it is specified`
        );
    }
    if (options.defaultListBatchSize != null && options.defaultListBatchSize < 2) {
        throw new err.ArgumentError(
            `"options.defaultListBatchSize" cannot be less than 2 when it is specified`
        );
    }
    if (options.defaultListBatchSize != null 
        && options.defaultBatchSize != null
        && options.defaultListBatchSize > options.defaultBatchSize
    ) {
        throw new err.ArgumentError(
            `"options.defaultListBatchSize" cannot be greator than "options.defaultBatchSize" when both of them are specified`
        );
    }
    if (options.maxJoinFetchDepth != null) {
        if (options.maxJoinFetchDepth < 0) {
            throw new err.ArgumentError(
                `"options.maxJoinFetchDepth" cannot be less thatn 0`
            );  
        }
        if (options.maxJoinFetchDepth > 10) {
            throw new err.ArgumentError(
                `"options.maxJoinFetchDepth" cannot be greater thatn 10`
            );  
        }
    }
    return new SqlClientImpl(driver, finalOptions);
}

export interface SqlClientImplementor extends SqlClient {

    readonly driver: Driver;

    readonly options: SqlClientOptions;

    isDirectAssociatedKey(
        expr: spi.PropExprContract
    ): boolean;

    isDirectAssociatedField(
        field: spi.DtoMapperField
    ): boolean;

    getFilters(
        entity: spi.Entity
    ): ReadonlyArray<AnyFilter>;

    readonly executor: Executor;
    
    readonly strategy: spi.DatabaseStrategy;
}

function createDefaultOptions(): SqlClientOptions {
    return {
        strategy: spi.UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY,
        defaultBatchSize: 128,
        defaultListBatchSize: 16,
        maxJoinFetchDepth: 5,
        sqlLogger: {
            pretty: false,
            parameter: "PLACEHOLDER"
        },
        filterManager: new FilterManager(),
        entityManager: undefined,
        executorCreator: defaultExecutor => defaultExecutor
    };
}
