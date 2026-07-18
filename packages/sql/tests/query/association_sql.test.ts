import { describe, it } from "vitest";
import { SIMPLE_AUTHOR_VIEW, SIMPLE_BOOK_VIEW, sql } from "./utils";
import { dsl } from "@ts-grm/core";
import { AUTHOR, BOOK, ORDER } from "../model/model";
import { expectCode, newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "../data_utils";

describe("AssociationSqlTest", () => {

    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("root", () => {
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
                tb_1_.book_id = tb_2_.ID
            inner join AUTHOR tb_3_ on 
                tb_1_.author_id = tb_3_.ID
            where 
                tb_1_.book_id = ?
        `);
    });

    it("inverseRoot", () => {
        const q = sqlClient.createQuery(dsl.associationModel(AUTHOR, "books"), (q, association) => {
            q.where(association.sourceId.eq(3));
            return q.select(
                association.source().fetch(SIMPLE_AUTHOR_VIEW),
                association.target().fetch(SIMPLE_BOOK_VIEW)
            );
        });
        expectCode(sql(q), `
            select 
                tb_2_.ID,
                tb_2_.FIRST_NAME,
                tb_2_.LAST_NAME,
                tb_3_.ID,
                tb_3_.NAME,
                tb_3_.EDITION
            from book_author_mapping tb_1_
            inner join AUTHOR tb_2_ on 
                tb_1_.author_id = tb_2_.ID
            inner join BOOK tb_3_ on 
                tb_1_.book_id = tb_3_.ID
            where 
                tb_1_.author_id = ?
        `);
    });

    it("half", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.association("authors").$acceptMulti().targetId.eq(3));
            return q.select(
                book.fetch(SIMPLE_BOOK_VIEW)
            );
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.EDITION
            from BOOK tb_1_
            inner join book_author_mapping tb_2_ on 
                tb_1_.ID = tb_2_.book_id
            where 
                tb_2_.author_id = ?
        `);
    });

    it("inverseHalf", () => {
        const q = sqlClient.createQuery(AUTHOR, (q, author) => {
            q.where(author.association("books").$acceptMulti().targetId.eq(3));
            return q.select(
                author.fetch(SIMPLE_AUTHOR_VIEW)
            );
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.FIRST_NAME,
                tb_1_.LAST_NAME
            from AUTHOR tb_1_
            inner join book_author_mapping tb_2_ on 
                tb_1_.ID = tb_2_.author_id
            where 
                tb_2_.book_id = ?
        `);
    });

    it("halfWithTwoFilters", () => {
        const q = sqlClient.createQuery(ORDER, (q, order) => {
            const tag = order
                .association("tags", ctx => ctx.target.targetId().high.eq(0))
                .$acceptMulti()
                .target(ctx => ctx.target.name.length().lteIf(10));
            return q.select(order.name, tag.name);
        });
        expectCode(sql(q), `
            select 
                tb_1_.NAME,
                tb_3_.NAME
            from "ORDER" tb_1_
            inner join ORDER_TAG_MAPPING tb_2_ on 
                tb_1_.X = tb_2_.order_x
            and
                tb_1_.A = tb_2_.order_y_a
            and
                tb_1_.B = tb_2_.order_y_b
            and
                tb_2_.tag_high = ?
            inner join TAG tb_3_ on 
                tb_2_.tag_low = tb_3_.LOW
            and
                tb_2_.tag_high = tb_3_.HIGH
            and
                length(cast(tb_3_.NAME as text)) <= ?
        `);
    })
});