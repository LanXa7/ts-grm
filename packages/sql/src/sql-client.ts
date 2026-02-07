import { SqlClient, supressUnused } from "@ts-grm/core";

export function newSqlClient(
    options: SqlClientOptions
): SqlClient {
    supressUnused(options);
    throw new Error();
}

export type SqlClientOptions = {
    
};
