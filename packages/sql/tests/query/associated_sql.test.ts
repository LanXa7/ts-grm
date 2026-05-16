import { describe, it } from "vitest";
import { SIMPLE_AUTHOR_VIEW, SIMPLE_BOOK_VIEW, SIMPLE_ITEM_VIEW, SIMPLE_ORDER_VIEW, SIMPLE_STORE_VIEW, sql } from "./utils";
import { AUTHOR, BOOK, BOOK_STORE, ORDER, ORDER_ITEM } from "../model/model";
import { expectCode, useSqliteClient } from "../utils";
import { dsl } from "@ts-grm/core";

describe("AssociatedSqlTest", () => {

    const sqlClient = useSqliteClient();
    
    it("noneWithoutFilter", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.none("store"));
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.EDITION
            from BOOK tb_1_
            where 
                not exists(
                    select 
                        1
                    from BOOK_STORE tb_2_
                    where 
                        tb_2_.ID = tb_1_.STORE_ID
                )
        `);
    });

    it("noneWithFilter", () => {
        const q = sqlClient.createQuery(ORDER_ITEM, (q, item) => {
            q.where(item.none("order", order => order.name.length().lt(3)));
            return q.select(item.fetch(SIMPLE_ITEM_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.PRODUCT_NAME
            from ORDER_ITEM tb_1_
            where 
                not exists(
                    select 
                        1
                    from "ORDER" tb_2_
                    where 
                            (
                                tb_2_.X,
                                tb_2_.A,
                                tb_2_.B
                            ) = (
                                tb_1_.order_x,
                                tb_1_.order_y_a,
                                tb_1_.order_y_b
                            )
                        and
                            length(cast(tb_2_.NAME as text)) < ?
                )
        `);
    });

    it("noneIfWithoutFilter", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.noneIf("store", store => store.name.likeIf(null)));
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.EDITION
            from BOOK tb_1_
        `);
    });

    it("noneIfWithFilter", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.noneIf("store", store => store.name.likeIf("reilly")));
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.EDITION
            from BOOK tb_1_
            where 
                not exists(
                    select 
                        1
                    from BOOK_STORE tb_2_
                    where 
                            tb_2_.ID = tb_1_.STORE_ID
                        and
                            tb_2_.NAME like ?
                )
        `);
    });

    it("someWithoutFilter", () => {
        const q = sqlClient.createQuery(BOOK_STORE, (q, store) => {
            q.where(store.some("books"));
            return q.select(store.fetch(SIMPLE_STORE_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.VERSION
            from BOOK_STORE tb_1_
            where 
                exists(
                    select 
                        1
                    from BOOK tb_2_
                    where 
                        tb_2_.STORE_ID = tb_1_.ID
                )
        `);
    });

    it("someWithFilter", () => {
        const q = sqlClient.createQuery(BOOK_STORE, (q, store) => {
            q.where(store.some("books", book => book.name.ilike("sql")));
            return q.select(store.fetch(SIMPLE_STORE_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.VERSION
            from BOOK_STORE tb_1_
            where 
                exists(
                    select 
                        1
                    from BOOK tb_2_
                    where 
                            tb_2_.STORE_ID = tb_1_.ID
                        and
                            lower(tb_2_.NAME) like ?
                )
        `);
    });

    it("someIfWithoutFilter", () => {
        const q = sqlClient.createQuery(BOOK_STORE, (q, store) => {
            q.where(store.someIf("books", book => book.name.ilikeIf(undefined)));
            return q.select(store.fetch(SIMPLE_STORE_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.VERSION
            from BOOK_STORE tb_1_
        `);
    });

    it("someIfWithFilter", () => {
        const q = sqlClient.createQuery(BOOK_STORE, (q, store) => {
            q.where(store.someIf("books", book => book.name.ilikeIf("sql")));
            return q.select(store.fetch(SIMPLE_STORE_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.VERSION
            from BOOK_STORE tb_1_
            where 
                exists(
                    select 
                        1
                    from BOOK tb_2_
                    where 
                            tb_2_.STORE_ID = tb_1_.ID
                        and
                            lower(tb_2_.NAME) like ?
                )
        `);
    });

    it("every", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                book.every(
                    "authors", 
                    author => dsl.and(
                        author.name().firstName.length().gte(10),
                        author.name().lastName.length().gte(10)
                    )
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
                not exists(
                    select 
                        1
                    from AUTHOR tb_2_
                    inner join book_author_mapping tb_3_ on 
                        tb_2_.ID = tb_3_.AUTHOR_ID
                    where 
                            tb_3_.BOOK_ID = tb_1_.ID
                        and
                            (
                                length(cast(tb_2_.FIRST_NAME as text)) < ?
                            or
                                length(cast(tb_2_.LAST_NAME as text)) < ?
                            )
                )
        `);
    });

    it("sizeWithoutFilter", () => {
        const q = sqlClient.createQuery(ORDER, (q, order) => {
            q.where(order.size("comments").between(10, 20));
            return q.select(order.fetch(SIMPLE_ORDER_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.X,
                tb_1_.A,
                tb_1_.B,
                tb_1_.NAME
            from "ORDER" tb_1_
            where 
                (
                    select 
                        count(1)
                    from COMMENT tb_2_
                    inner join ORDER_COMMENT_MAPPING tb_3_ on 
                        tb_2_.ID = tb_3_.COMMENT_ID
                    where 
                        (
                            tb_3_.order_x,
                            tb_3_.order_y_a,
                            tb_3_.order_y_b
                        ) = (
                            tb_1_.X,
                            tb_1_.A,
                            tb_1_.B
                        )
                ) between ? and ?
        `);
    });

    it("sizeWithFilter", () => {
        const q = sqlClient.createQuery(AUTHOR, (q, author) => {
            q.where(author.size("books", book => book.name.ilike("sql")).gt(1))
            return q.select(author.fetch(SIMPLE_AUTHOR_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.FIRST_NAME,
                tb_1_.LAST_NAME
            from AUTHOR tb_1_
            where 
                (
                    select 
                        count(1)
                    from BOOK tb_2_
                    inner join book_author_mapping tb_3_ on 
                        tb_2_.ID = tb_3_.BOOK_ID
                    where 
                            tb_3_.AUTHOR_ID = tb_1_.ID
                        and
                            lower(tb_2_.NAME) like ?
                ) > ?
        `);
    });
});