import { describe, it } from "vitest";
import { SIMPLE_AUTHOR_VIEW, SIMPLE_BOOK_VIEW, sql, sqlClient } from "./utils";
import { dsl } from "@ts-grm/core";
import { BOOK } from "../model/model";
import { expectCode } from "../utils";

describe("AssociationSqlTest", () => {

    it("key", () => {
        const q = sqlClient.createQuery(dsl.associationModel(BOOK, "authors"), (q, association) => {
            q.where(association.sourceId.eq(3));
            return q.select(
                association.source().fetch(SIMPLE_BOOK_VIEW),
                association.target().fetch(SIMPLE_AUTHOR_VIEW)
            );
        });
        expectCode(sql(q), `
            select 
                tb_2_.ID,
                tb_2_.NAME,
                tb_2_.EDITION,
                tb_3_.ID,
                tb_3_.FIRST_NAME,
                tb_3_.LAST_NAME
            from book_author_mapping tb_1_
            inner join BOOK tb_2_ on 
                tb_1_.BOOK_ID = tb_2_.ID
            inner join AUTHOR tb_3_ on 
                tb_1_.AUTHOR_ID = tb_3_.ID
            where 
                tb_1_.BOOK_ID = ?
        `);
    });
});