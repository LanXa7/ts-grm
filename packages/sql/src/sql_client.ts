import { SqlClient, supressUnused } from "@ts-grm/core";
import { SqlClientOptions } from "./cfg/sql_client_options";

export function newSqlClient(
    options: SqlClientOptions
): SqlClient {
    supressUnused(options);
    throw new Error();
}

