import { describe, it } from "vitest";
import { SIMPLE_BOOK_VIEW, sql } from "./utils";
import { AUTHOR, BOOK, ORDER, ORDER_ITEM } from "../model/model";
import { dsl } from "@ts-grm/core";
import { expectCode, useSqliteClient } from "../utils";

describe("SubQueryTest", () => {

    const sqlClient = useSqliteClient();
    
    it("inExprSubQuery", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                book.id.inSubQuery(
                    dsl.subQuery(AUTHOR, (q, author) => {
                        q.where(author.name().firstName.like("a"));
                        return q.select(author.books().id);
                    })
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
                tb_1_.ID in(
                    select 
                        tb_3_.BOOK_ID
                    from AUTHOR tb_2_
                    inner join book_author_mapping tb_3_ on 
                        tb_2_.ID = tb_3_.AUTHOR_ID
                    where 
                        tb_2_.FIRST_NAME like ?
                )
        `);
    });

    it("inTupleSubQuery", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                dsl.tuple(book.name, book.edition).inSubQuery(
                    dsl.subQuery(BOOK, (q, book) => {
                        q.groupBy(book.name);
                        return q.select(
                            book.name,
                            dsl.max(book.edition).asNonNull()
                        );
                    })
                )
            )
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
                (
                    tb_1_.NAME,
                    tb_1_.EDITION
                ) in(
                    select 
                        tb_2_.NAME,
                        max(tb_2_.EDITION)
                    from BOOK tb_2_
                    group by 
                        tb_2_.NAME
                )
        `);
    });

    it("inTupleSubQuery2", () => {
        const q = sqlClient.createQuery(ORDER, (q, order) => {
            q.where(
                dsl.tuple(order.id().y().a, order.id().y().b).inSubQuery(
                    dsl.subQuery(ORDER_ITEM, (q, orderItem) => {
                        return q.select(
                            orderItem.order().id().y().a,
                            orderItem.order().id().y().b
                        );
                    })
                )
            );
            return q.select(order.name);
        });
        expectCode(sql(q), `
            select 
                tb_1_.NAME
            from ORDER tb_1_
            where 
                (
                    tb_1_.A,
                    tb_1_.B
                ) in(
                    select 
                        tb_2_.order_y_a,
                        tb_2_.order_y_b
                    from ORDER_ITEM tb_2_
                )
        `);
    });

    it("selectAndOrderBy", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.orderBy(
                dsl.subQuery(dsl.associationModel(BOOK, "authors"), (q, association) => {
                    q.where(association.sourceId.eq(book.id));
                    return q.select(dsl.count()); 
                }).desc()
            );
            return q.select(
                book.fetch(SIMPLE_BOOK_VIEW),
                dsl.subQuery(dsl.associationModel(BOOK, "authors"), (q, association) => {
                    q.where(association.sourceId.eq(book.id));
                    return q.select(dsl.count()); 
                })
            );
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.EDITION,
                (
                    select 
                        count(1)
                    from book_author_mapping tb_2_
                    where 
                        tb_2_.BOOK_ID = tb_1_.ID
                )
            from BOOK tb_1_
            order by 
                (
                    select 
                        count(1)
                    from book_author_mapping tb_3_
                    where 
                        tb_3_.BOOK_ID = tb_1_.ID
                ) desc
        `);
    });

    it("selectAndOrderBy2", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            const authorCount = dsl.subQuery(dsl.associationModel(BOOK, "authors"), (q, association) => {
                q.where(association.sourceId.eq(book.id));
                return q.select(dsl.count()); 
            });
            q.orderBy(authorCount.desc());
            return q.select(
                book.fetch(SIMPLE_BOOK_VIEW),
                authorCount
            );
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.EDITION,
                (
                    select 
                        count(1)
                    from book_author_mapping tb_2_
                    where 
                        tb_2_.BOOK_ID = tb_1_.ID
                )
            from BOOK tb_1_
            order by 
                (
                    select 
                        count(1)
                    from book_author_mapping tb_3_
                    where 
                        tb_3_.BOOK_ID = tb_1_.ID
                ) desc
        `);
    });

    it("all", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                book.price.gt(
                    dsl.all(
                        dsl.subQuery(BOOK, (q, book) => {
                            q.where(book.storeId.eq(2));
                            return q.select(book.price);
                        })
                    )
                )
            );
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
                tb_1_.PRICE > all(
                    select 
                        tb_2_.PRICE
                    from BOOK tb_2_
                    where 
                        tb_2_.STORE_ID = ?
                )
        `);
    });

    it("any", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                book.price.eq(
                    dsl.any(
                        dsl.subQuery(BOOK, (q, book) => {
                            q.where(book.storeId.eq(2));
                            return q.select(book.price);
                        })
                    )
                )
            );
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
                tb_1_.PRICE = any(
                    select 
                        tb_2_.PRICE
                    from BOOK tb_2_
                    where 
                        tb_2_.STORE_ID = ?
                )
        `);
    });

    it("notExists", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                dsl.notExists(
                    dsl.subQuery(AUTHOR, (q, author) => {
                        q.where(
                            author.books().id.eq(book.id),
                            author.name().firstName.eq("Alex")
                        )
                    })
                )
            );
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
                not exists(
                    select 
                        1
                    from AUTHOR tb_2_
                    inner join book_author_mapping tb_3_ on 
                        tb_2_.ID = tb_3_.AUTHOR_ID
                    where 
                            tb_3_.BOOK_ID = tb_1_.ID
                        and
                            tb_2_.FIRST_NAME = ?
                )
        `);
    });
});