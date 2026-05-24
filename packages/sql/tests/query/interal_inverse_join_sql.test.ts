import { newSqlClient } from "@/sql_client";
import { describe, it } from "vitest";
import { SIMPLE_AUTHOR_VIEW, SIMPLE_BOOK_VIEW, SIMPLE_COMMENT_VIEW, SIMPLE_STORE_VIEW, sql } from "./utils";
import { FilterManager } from "@/cfg";
import { AUTHOR, BOOK, BOOK_STORE, COMMENT, ORDER } from "../model/model";
import { dsl, Expression, ExprTuple, metadata } from "@ts-grm/core";
import { expectCode, useSqliteClient } from "../utils";

// Internal API, not public API for users
// This internal API is used to implements association fetch
// and primsa/mongo style predicate such as "none", "some", "every" 
// even it the association is not bidirectional
describe("InternalInverseJoinSqlTest", () => {

    const sqlClient = useSqliteClient();

    // All global filters should be ignored by internal inverse join
    // That means filters will be only applied to root table.
    const sqlClientWithFilter = newSqlClient(sqlClient, {
        filterManager: new FilterManager()
            .add(BOOK_STORE, table => table.version.ne(0))
            .add(BOOK, table => table.edition.gt(1))
            .add(AUTHOR, table => table.name().firstName.length().gte(5))
            .add(ORDER, table => table.id().x.ne(0))
            .add(COMMENT, table => table.text.length().gte(20))
    });

    it("inverseO2M", () => {
        const q = sqlClientWithFilter.createQuery(BOOK, (q, book) => {
            const parentId1 = (book as any as metadata.AbstractEntityTable)
                .__inverseAssociatedKey(BOOK_STORE, "books") as Expression<number>;
            const parentId2 = (book as any as metadata.AbstractEntityTable)
                .__inverseAssociatedKey(BOOK_STORE, "books") as Expression<number>;
            q.where(
                dsl.or(
                    parentId1.eq(1),
                    parentId2.eq(2)
                )
            );
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.EDITION
            from BOOK tb_1_
            where 
                    (
                        tb_1_.STORE_ID = ?
                    or
                        tb_1_.STORE_ID = ?
                    )
                and
                    tb_1_.EDITION > ?
        `);
    });

    it("inverseM2O", () => {
        const q = sqlClientWithFilter.createQuery(BOOK_STORE, (q, store) => {
            const parentId1 = (store as any as metadata.AbstractEntityTable)
                .__inverseAssociatedKey(BOOK, "store") as Expression<number>;
            const parentId2 = (store as any as metadata.AbstractEntityTable)
                .__inverseAssociatedKey(BOOK, "store") as Expression<number>;
            q.where(
                dsl.or(
                    parentId1.eq(1),
                    parentId2.eq(2)
                )
            );
            return q.select(store.fetch(SIMPLE_STORE_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.VERSION
            from BOOK_STORE tb_1_
            inner join BOOK tb_2_ on 
                tb_1_.ID = tb_2_.STORE_ID
            and
                tb_2_.EDITION > ?
            where 
                    (
                        tb_2_.ID = ?
                    or
                        tb_2_.ID = ?
                    )
                and
                    tb_1_.VERSION <> ?
        `);
    });

    it("inverseM2M1", () => {
        const q = sqlClientWithFilter.createQuery(BOOK, (q, book) => {
            const parentId1 = (book as any as metadata.AbstractEntityTable)
                .__inverseAssociatedKey(AUTHOR, "books") as Expression<number>;
            const parentId2 = (book as any as metadata.AbstractEntityTable)
                .__inverseAssociatedKey(AUTHOR, "books") as Expression<number>;
            q.where(
                dsl.or(
                    parentId1.eq(1),
                    parentId2.eq(2)
                )
            );
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
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
                    (
                        tb_2_.author_id = ?
                    or
                        tb_2_.author_id = ?
                    )
                and
                    tb_1_.EDITION > ?
        `);
    });

    it("inverseM2M2", () => {
        const q = sqlClientWithFilter.createQuery(AUTHOR, (q, author) => {
            const parentId1 = (author as any as metadata.AbstractEntityTable)
                .__inverseAssociatedKey(BOOK, "authors") as Expression<number>;
            const parentId2 = (author as any as metadata.AbstractEntityTable)
                .__inverseAssociatedKey(BOOK, "authors") as Expression<number>;
            q.where(
                dsl.or(
                    parentId1.eq(1),
                    parentId2.eq(2)
                )
            );
            return q.select(author.fetch(SIMPLE_AUTHOR_VIEW));
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
                    (
                        tb_2_.book_id = ?
                    or
                        tb_2_.book_id = ?
                    )
                and
                    length(cast(tb_1_.FIRST_NAME as text)) >= ?
        `);
    });

    it("inverseM2MByMultiColumns", () => {
        const q = sqlClientWithFilter.createQuery(COMMENT, (q, comment) => {
            const parentId1 = (comment as any as metadata.AbstractEntityTable)
                .__inverseAssociatedKey(ORDER, "comments") as ExprTuple<[
                    Expression<number>,
                    Expression<number>,
                    Expression<number>
                ]>;
            const parentId2 = (comment as any as metadata.AbstractEntityTable)
                .__inverseAssociatedKey(ORDER, "comments") as ExprTuple<[
                    Expression<number>,
                    Expression<number>,
                    Expression<number>
                ]>;
            q.where(
                dsl.or(
                    parentId1.eq([10, 10, 10]),
                    parentId2.eq([14, 14, 14])
                )
            );
            return q.select(
                comment.fetch(SIMPLE_COMMENT_VIEW)
            );
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME
            from COMMENT tb_1_
            inner join ORDER_COMMENT_MAPPING tb_2_ on 
                tb_1_.ID = tb_2_.COMMENT_ID
            where 
                    (
                        (tb_2_.order_x, tb_2_.order_y_a, tb_2_.order_y_b) = (?, ?, ?)
                    or
                        (tb_2_.order_x, tb_2_.order_y_a, tb_2_.order_y_b) = (?, ?, ?)
                    )
                and
                    length(cast(tb_1_.TEXT as text)) >= ?
        `);
    });
});