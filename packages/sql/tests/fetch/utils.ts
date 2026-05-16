import { SqlClient } from "@ts-grm/core";
import { useSqliteClient } from "../utils";
import { beforeAll } from "vitest";

export function useSqliteClientWithData(): SqlClient {
    const sqlClient = useSqliteClient(false);
    beforeAll(async () => {
        const schema = await sqlClient.createSchema();
        await schema.execute();
    });
    return sqlClient;
}
