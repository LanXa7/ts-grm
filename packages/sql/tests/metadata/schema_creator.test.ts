import { SqliteDriver } from "@/driver/sqlite_driver";
import { createSchema } from "@/impl/schema_creator";
import { newSqlClient, SqlClientImplementor } from "@/sql_client";
import { EntityManager } from "@ts-grm/core";
import { describe, it } from "vitest";

describe.sequential("SchemaCreatorTest", () => {

    const sqlClient = newSqlClient(new SqliteDriver(), {
        entityManager: EntityManager.of(__dirname, "../model")
    }) as SqlClientImplementor;

    it("tables", async() => {
        const tableDefs = await createSchema(sqlClient);
        console.log(JSON.stringify(tableDefs));
    });
});