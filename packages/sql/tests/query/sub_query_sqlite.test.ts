import { describe, expect, it } from "vitest";
import { SIMPLE_BOOK_VIEW } from "./utils";
import { AUTHOR, BOOK, ORDER, ORDER_ITEM } from "../model/model";
import { dsl } from "@ts-grm/core";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "../data_utils";

describe("SubQueryTest", () => {

    const sqlRecord = newSqlRecord();
    const sqlClient = useSqliteClientWithData(sqlRecord);
    
    it("inExprSubQuery", async () => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                book.id.inSubQuery(
                    dsl.subQuery(AUTHOR, (q, author) => {
                        q.where(author.name().firstName.like("an"));
                        return q.select(author.books().id);
                    })
                )
            );
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.ID,
                    tb_1_.NAME,
                    tb_1_.EDITION
                from BOOK tb_1_
                where 
                    tb_1_.ID in(
                        select 
                            tb_3_.book_id
                        from AUTHOR tb_2_
                        inner join book_author_mapping tb_3_ on 
                            tb_2_.ID = tb_3_.author_id
                        where 
                            tb_2_.FIRST_NAME like ?
                    )
            `,
            args: ["%an%"],
            purpose: "query"
        });
        expect(rows).toEqual([
            {
                "id": 4,
                "name": "Effective TypeScript",
                "edition": 1
            },
            {
                "id": 5,
                "name": "Effective TypeScript",
                "edition": 2
            },
            {
                "id": 6,
                "name": "Effective TypeScript",
                "edition": 3
            },
            {
                "id": 7,
                "name": "YugabyteDB: The Definitive Guide",
                "edition": 1
            },
            {
                "id": 8,
                "name": "YugabyteDB: The Definitive Guide",
                "edition": 2
            },
            {
                "id": 9,
                "name": "YugabyteDB: The Definitive Guide",
                "edition": 3
            }
        ]);
    });

    it("inTupleSubQuery", async () => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                dsl.tuple(book.name, book.edition).inSubQuery(
                    dsl.subQuery(BOOK, (q, book) => {
                        q.groupBy(book.name);
                        return q.select(
                            book.name,
                            dsl.max(book.edition)
                        );
                    })
                )
            )
            return q.select(
                book.fetch(SIMPLE_BOOK_VIEW)
            );
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.ID,
                    tb_1_.NAME,
                    tb_1_.EDITION
                from BOOK tb_1_
                where 
                    (tb_1_.NAME, tb_1_.EDITION) in(
                        select 
                            tb_2_.NAME,
                            max(tb_2_.EDITION)
                        from BOOK tb_2_
                        group by 
                            tb_2_.NAME
                    )
            `,
            args: [],
            purpose: "query"
        });
        expect(rows).toEqual([
            {
                "id": 6,
                "name": "Effective TypeScript",
                "edition": 3
            },
            {
                "id": 12,
                "name": "GraphQL in Action",
                "edition": 3
            },
            {
                "id": 3,
                "name": "Learning GraphQL",
                "edition": 3
            },
            {
                "id": 9,
                "name": "YugabyteDB: The Definitive Guide",
                "edition": 3
            }
        ]);
    });

    it("inTupleSubQuery2", async () => {
        const rows = await sqlClient.createQuery(ORDER, (q, order) => {
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
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.NAME
                from "ORDER" tb_1_
                where 
                    (tb_1_.A, tb_1_.B) in(
                        select 
                            tb_2_.order_y_a,
                            tb_2_.order_y_b
                        from ORDER_ITEM tb_2_
                    )
            `,
            args: [],
            purpose: "query"
        });
        expect(rows).toEqual(["order-1","order-2","order-3","order-4"]);
    });

    it("selectAndOrderBy", async () => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
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
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.ID,
                    tb_1_.NAME,
                    tb_1_.EDITION,
                    (
                        select 
                            count(1)
                        from book_author_mapping tb_2_
                        where 
                            tb_2_.book_id = tb_1_.ID
                    )
                from BOOK tb_1_
                order by 
                    (
                        select 
                            count(1)
                        from book_author_mapping tb_3_
                        where 
                            tb_3_.book_id = tb_1_.ID
                    ) desc
            `,
            args: [],
            purpose: "query"
        });
        expect(rows).toEqual([
            [
                {
                    "id": 7,
                    "name": "YugabyteDB: The Definitive Guide",
                    "edition": 1
                },
                3
            ],
            [
                {
                    "id": 8,
                    "name": "YugabyteDB: The Definitive Guide",
                    "edition": 2
                },
                3
            ],
            [
                {
                    "id": 9,
                    "name": "YugabyteDB: The Definitive Guide",
                    "edition": 3
                },
                3
            ],
            [
                {
                    "id": 1,
                    "name": "Learning GraphQL",
                    "edition": 1
                },
                2
            ],
            [
                {
                    "id": 2,
                    "name": "Learning GraphQL",
                    "edition": 2
                },
                2
            ],
            [
                {
                    "id": 3,
                    "name": "Learning GraphQL",
                    "edition": 3
                },
                2
            ],
            [
                {
                    "id": 4,
                    "name": "Effective TypeScript",
                    "edition": 1
                },
                1
            ],
            [
                {
                    "id": 5,
                    "name": "Effective TypeScript",
                    "edition": 2
                },
                1
            ],
            [
                {
                    "id": 6,
                    "name": "Effective TypeScript",
                    "edition": 3
                },
                1
            ],
            [
                {
                    "id": 10,
                    "name": "GraphQL in Action",
                    "edition": 1
                },
                1
            ],
            [
                {
                    "id": 11,
                    "name": "GraphQL in Action",
                    "edition": 2
                },
                1
            ],
            [
                {
                    "id": 12,
                    "name": "GraphQL in Action",
                    "edition": 3
                },
                1
            ]
        ]);
    });

    it("selectAndOrderBy2", async () => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            const authorCount = dsl.subQuery(dsl.associationModel(BOOK, "authors"), (q, association) => {
                q.where(association.sourceId.eq(book.id));
                return q.select(dsl.count()); 
            });
            q.orderBy(authorCount.desc());
            return q.select(
                book.fetch(SIMPLE_BOOK_VIEW),
                authorCount
            );
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.ID,
                    tb_1_.NAME,
                    tb_1_.EDITION,
                    (
                        select 
                            count(1)
                        from book_author_mapping tb_2_
                        where 
                            tb_2_.book_id = tb_1_.ID
                    )
                from BOOK tb_1_
                order by 
                    (
                        select 
                            count(1)
                        from book_author_mapping tb_3_
                        where 
                            tb_3_.book_id = tb_1_.ID
                    ) desc
            `,
            args: [],
            purpose: "query"
        });
        expect(rows).toEqual([
            [
                {
                    "id": 7,
                    "name": "YugabyteDB: The Definitive Guide",
                    "edition": 1
                },
                3
            ],
            [
                {
                    "id": 8,
                    "name": "YugabyteDB: The Definitive Guide",
                    "edition": 2
                },
                3
            ],
            [
                {
                    "id": 9,
                    "name": "YugabyteDB: The Definitive Guide",
                    "edition": 3
                },
                3
            ],
            [
                {
                    "id": 1,
                    "name": "Learning GraphQL",
                    "edition": 1
                },
                2
            ],
            [
                {
                    "id": 2,
                    "name": "Learning GraphQL",
                    "edition": 2
                },
                2
            ],
            [
                {
                    "id": 3,
                    "name": "Learning GraphQL",
                    "edition": 3
                },
                2
            ],
            [
                {
                    "id": 4,
                    "name": "Effective TypeScript",
                    "edition": 1
                },
                1
            ],
            [
                {
                    "id": 5,
                    "name": "Effective TypeScript",
                    "edition": 2
                },
                1
            ],
            [
                {
                    "id": 6,
                    "name": "Effective TypeScript",
                    "edition": 3
                },
                1
            ],
            [
                {
                    "id": 10,
                    "name": "GraphQL in Action",
                    "edition": 1
                },
                1
            ],
            [
                {
                    "id": 11,
                    "name": "GraphQL in Action",
                    "edition": 2
                },
                1
            ],
            [
                {
                    "id": 12,
                    "name": "GraphQL in Action",
                    "edition": 3
                },
                1
            ]
        ]);
    });

    // it("all", async () => {
    //     const rows = await sqlClient.createQuery(BOOK, (q, book) => {
    //         q.where(
    //             book.price.gt(
    //                 dsl.all(
    //                     dsl.subQuery(BOOK, (q, book) => {
    //                         q.where(book.storeId.eq(2));
    //                         return q.select(book.price);
    //                     })
    //                 )
    //             )
    //         );
    //         return q.select(
    //             book.fetch(SIMPLE_BOOK_VIEW)
    //         );
    //     }).fetchList();
    //     sqlRecord.assert({
    //         sql: `
    //             select 
    //                 tb_1_.ID,
    //                 tb_1_.NAME,
    //                 tb_1_.EDITION
    //             from BOOK tb_1_
    //             where 
    //                 tb_1_.PRICE > all(
    //                     select 
    //                         tb_2_.PRICE
    //                     from BOOK tb_2_
    //                     where 
    //                         tb_2_.STORE_ID = ?
    //                 )
    //         `,
    //         args: [],
    //         purpose: "query"
    //     });
    //     console.log(JSON.stringify(rows))
    // });

    // it("any", async () => {
    //     const q = await sqlClient.createQuery(BOOK, (q, book) => {
    //         q.where(
    //             book.price.eq(
    //                 dsl.any(
    //                     dsl.subQuery(BOOK, (q, book) => {
    //                         q.where(book.storeId.eq(2));
    //                         return q.select(book.price);
    //                     })
    //                 )
    //             )
    //         );
    //         return q.select(
    //             book.fetch(SIMPLE_BOOK_VIEW)
    //         );
    //     }).fetchList();
    //     sqlRecord.assert({
    //         sql: `
    //             select 
    //                 tb_1_.ID,
    //                 tb_1_.NAME,
    //                 tb_1_.EDITION
    //             from BOOK tb_1_
    //             where 
    //                 tb_1_.PRICE = any(
    //                     select 
    //                         tb_2_.PRICE
    //                     from BOOK tb_2_
    //                     where 
    //                         tb_2_.STORE_ID = ?
    //                 )
    //         `,
    //         args: [],
    //         purpose: "query"
    //     });
    //     console.log(JSON.stringify(rows))
    // });

    it("notExists", async () => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.edition.eq(3));
            q.where(
                dsl.notExists(
                    dsl.subQuery(AUTHOR, (q, author) => {
                        q.where(
                            author.books().id.eq(book.id),
                            author.name().firstName.in("Eve", "Samer")
                        )
                    })
                )
            );
            return q.select(
                book.fetch(SIMPLE_BOOK_VIEW)
            );
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.ID,
                    tb_1_.NAME,
                    tb_1_.EDITION
                from BOOK tb_1_
                where 
                        tb_1_.EDITION = ?
                    and
                        not exists(
                            select 
                                1
                            from AUTHOR tb_2_
                            inner join book_author_mapping tb_3_ on 
                                tb_2_.ID = tb_3_.author_id
                            where 
                                    tb_3_.book_id = tb_1_.ID
                                and
                                    tb_2_.FIRST_NAME in(?, ?)
                        )
            `,
            args: [3, "Eve", "Samer"],
            purpose: "query"
        });
        expect(rows).toEqual([
            {
                "id": 6,
                "name": "Effective TypeScript",
                "edition": 3
            },
            {
                "id": 9,
                "name": "YugabyteDB: The Definitive Guide",
                "edition": 3
            }
        ]);
    });
});