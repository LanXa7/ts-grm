import { SqlClient } from "@ts-grm/core";
import { SqlRecord, usePostgresClient, useSqliteClient } from "./utils";
import { beforeAll } from "vitest";
import { INITIAL_SQL } from "./data";
import { SqlClientImplementor } from "@/sql_client";

export function useSqliteClientWithData(sqlRecord: SqlRecord): SqlClient {
    const sqlClient = useSqliteClient(true, sqlRecord);
    initializeDatabase(sqlClient);
    return sqlClient;
}

export function usePostgresClientWithData(sqlRecord: SqlRecord): SqlClient {
    const sqlClient = usePostgresClient(sqlRecord) as SqlClientImplementor;
    initializeDatabase(sqlClient);
    return sqlClient;
}

async function initializeDatabase(
    sqlClient: SqlClientImplementor
): Promise<void> {
    beforeAll(async () => {
        const schema = await sqlClient.createSchema();
        await schema.execute();
        await sqlClient.execute(async () => {
            for (const part of INITIAL_SQL.split(";")) {
                const sql = part.trim();
                if (sql === "") {
                    continue;
                }
                try {
                    await sqlClient.executor.execute(sql);
                } catch (ex) {
                    console.error("Failed to execute: ", sql, ex);
                    throw ex;
                }
            }
        });
    });
}