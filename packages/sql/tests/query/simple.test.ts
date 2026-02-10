import { SqliteDriver } from "@/driver/sqlite_driver";
import { newSqlClient } from "@/sql_client";
import { BOOK } from "../model/model";
import { describe, it } from "vitest";

describe("SimpleQueryTest", () => {

    const sqlClient = newSqlClient(new SqliteDriver(), {});
    
    it("where", () => {
        sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.id.eq(3));
            return q.select(book.id, book.name);
        });
    });
});