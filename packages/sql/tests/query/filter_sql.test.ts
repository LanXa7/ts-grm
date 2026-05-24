import { describe, it } from "vitest";
import { AUTHOR, BOOK, BOOK_STORE, ORDER, TAG } from "../model/model";
import { SIMPLE_BOOK_VIEW, sql } from "./utils";
import { expectCode, useSqliteClient } from "../utils";
import { FilterManager } from "@/cfg";
import { newSqlClient } from "@/sql_client";

describe("FilterSqlTest", () => {

    const sqlClient = useSqliteClient();

    it("globalFilter", () => {
        const filterManager = new FilterManager()
            .add(BOOK, table => table.edition.eq(1));
        const q = newSqlClient(sqlClient, {
            filterManager
        }).createQuery(BOOK, (q, book) => {
            q.where(book.name.ilike("graphql"));
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.EDITION
            from BOOK tb_1_
            where 
                    lower(tb_1_.NAME) like ?
                and
                    tb_1_.EDITION = ?
        `);
    });

    it("m2oOptimization", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.store().id.eq(2));
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
            where 
                tb_1_.STORE_ID = ?
        `);
    });

    it("m2oFilter", () => {
        const filterManager = new FilterManager()
            .add(BOOK_STORE, table => table.version.eq(1));
        const q = newSqlClient(
            sqlClient, { filterManager }
        ).createQuery(BOOK, (q, book) => {
            q.where(book.store().id.eq(2));
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
            inner join BOOK_STORE tb_2_ on 
                tb_1_.STORE_ID = tb_2_.ID
            and
                tb_2_.VERSION = ?
            where 
                tb_2_.ID = ?
        `);
    });

    it("m2mOptimization", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.authors().$acceptMulti().id.in(3, 4));
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
                tb_2_.author_id in(?, ?)
        `);
    });

    it("m2mFilter", () => {
        const filterManager = new FilterManager()
            .add(AUTHOR, table =>
                table.name().firstName.length()
                    .plus(table.name().lastName.length())
                    .lte(20)
            );
        const q = newSqlClient(sqlClient, {
            filterManager
        }).createQuery(BOOK, (q, book) => {
            q.where(book.authors().$acceptMulti().id.in(3, 4));
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
            inner join AUTHOR tb_3_ on 
                tb_2_.author_id = tb_3_.ID
            and
                length(cast(tb_3_.FIRST_NAME as text)) + length(cast(tb_3_.LAST_NAME as text)) <= ?
            where 
                tb_3_.ID in(?, ?)
        `);
    });

    it("inverseMultiColumnsM2MOptimization", () => {
        const q = sqlClient.createQuery(TAG, (q, tag) => {
            q.where(tag.orders().$acceptMulti().id().y().a.lt(5));
            return q.select(tag.id().low, tag.id().high, tag.name);
        });
        expectCode(sql(q), `
            select 
                tb_1_.LOW,
                tb_1_.HIGH,
                tb_1_.NAME
            from TAG tb_1_
            inner join ORDER_TAG_MAPPING tb_2_ on 
                tb_1_.LOW = tb_2_.tag_low
            and
                tb_1_.HIGH = tb_2_.tag_high
            where 
                tb_2_.order_y_a < ?
        `);
    });

    it("inverseMultiColumnsM2MFilter", () => {
        const filterManager = new FilterManager()
            .add(ORDER, table => table.name.notLike("DELETED"));
        const q = newSqlClient(sqlClient, {
            filterManager
        }).createQuery(TAG, (q, tag) => {
            q.where(tag.orders().$acceptMulti().id().y().a.lt(5));
            return q.select(tag.id().low, tag.id().high, tag.name);
        });
        expectCode(sql(q), `
            select 
                tb_1_.LOW,
                tb_1_.HIGH,
                tb_1_.NAME
            from TAG tb_1_
            inner join ORDER_TAG_MAPPING tb_2_ on 
                tb_1_.LOW = tb_2_.tag_low
            and
                tb_1_.HIGH = tb_2_.tag_high
            inner join "ORDER" tb_3_ on 
                tb_2_.order_x = tb_3_.X
            and
                tb_2_.order_y_a = tb_3_.A
            and
                tb_2_.order_y_b = tb_3_.B
            and
                tb_3_.NAME not like ?
            where 
                tb_3_.A < ?
        `);
    });
});