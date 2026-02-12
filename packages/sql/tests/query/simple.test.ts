import { SqliteDriver } from "@/driver/sqlite_driver";
import { newSqlClient } from "@/sql_client";
import { AUTHOR, BOOK } from "../model/model";
import { describe, it } from "vitest";
import { dsl, dto } from "@ts-grm/core";
import { exists } from "../../../core/src/dsl/sub_query";
import { baseQuery } from "../../../core/src/dsl/base-query";

describe("SimpleQueryTest", () => {

    const sqlClient = newSqlClient(new SqliteDriver(), {});
    
    it("where", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.id.eq(3));
            return q.select(book.id, book.name);
        });
        console.log(q);
    });
});