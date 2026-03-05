import { err, SqlClient } from "@ts-grm/core";
import { SqlClientOptions } from "./cfg/sql_client_options";
import { Driver } from "./driver/deriver";
import { metadata } from "@ts-grm/core";
import { SqlClientImpl } from "./impl/sql_client_impl";

export function newSqlClient(
    driver: Driver,
    options: Partial<SqlClientOptions>
): SqlClient {
    const finalOptions = { ...defaultOptions };
    if (options.databaseNamingStrategy != null) {
        finalOptions.databaseNamingStrategy = options.databaseNamingStrategy;
    }
    if (options.defaultBatchSize != null) {
        if (options.defaultBatchSize < 2) {
            throw new err.ArgumentError(
                `"options.defaultBatchSize" cannot be less than 2 when it is specified`
            );
        }
        finalOptions.defaultBatchSize = options.defaultBatchSize;
    }
    return new SqlClientImpl(driver, finalOptions);
}

export interface SqlClientImplementor extends SqlClient {

    readonly driver: Driver;

    readonly options: SqlClientOptions;
}

const defaultOptions: SqlClientOptions = {
    databaseNamingStrategy: metadata.UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY,
    defaultBatchSize: 64
};
