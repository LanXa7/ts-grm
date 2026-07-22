import { describe, it, expect } from "vitest";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "../data_utils";
import { AUTHOR, BOOK, BOOK_STORE } from "../model/model";
import { SIMPLE_BOOK_VIEW, SIMPLE_STORE_VIEW } from "./utils";
import { dsl, FilterType } from "@ts-grm/core";

describe("MergeJoinSqliteTest", () => {

    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("mergeAllJoinsByReference", async () => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                book.store().version.in(1, 2, 4, 8),
                book.store({
                    filter: ctx => ctx.target.name.notLike("name1")
                }).name.ilike("n"),
                book.store("LEFT").version.notIn(4, 9, 16),
                book.store({
                    joinType: "LEFT",
                    filter: ctx => ctx.target.name.notLike("name2")
                }).version.ne(2)
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
                inner join BOOK_STORE tb_2_ on 
                    tb_1_.STORE_ID = tb_2_.ID
                and
                    tb_2_.NAME not like ?
                and
                    tb_2_.NAME not like ?
                where 
                        tb_2_.VERSION in(?, ?, ?, ?)
                    and
                        lower(tb_2_.NAME) like ?
                    and
                        tb_2_.VERSION not in(?, ?, ?)
                    and
                        tb_2_.VERSION <> ?
            `,
            args: ["%name1%", "%name2%", 1, 2, 4, 8, "%n%", 4, 9, 16, 2],
            purpose: "query"
        });
        expect(rows).toEqual([
            {
                "id": 10,
                "name": "GraphQL in Action",
                "edition": 1
            },
            {
                "id": 11,
                "name": "GraphQL in Action",
                "edition": 2
            },
            {
                "id": 12,
                "name": "GraphQL in Action",
                "edition": 3
            }
        ]);
    });

    it("mergeSomeJoinsByReference", async () => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                dsl.or(
                    book.store().version.in(1, 2, 4, 8),
                    book.store({
                        filter: ctx => ctx.target.name.like("n")
                    }).name.ilike("ing"),
                    book.store("LEFT").version.notIn(1, 4, 9, 16),
                    book.store({
                        joinType: "LEFT",
                        filter: ctx => ctx.target.name.like("n")
                    }).version.ne(1)
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
                inner join BOOK_STORE tb_2_ on 
                    tb_1_.STORE_ID = tb_2_.ID
                and
                    tb_2_.NAME like ?
                left join BOOK_STORE tb_3_ on 
                    tb_1_.STORE_ID = tb_3_.ID
                and
                    tb_3_.NAME like ?
                where 
                        tb_2_.VERSION in(?, ?, ?, ?)
                    or
                        lower(tb_2_.NAME) like ?
                    or
                        tb_3_.VERSION not in(?, ?, ?, ?)
                    or
                        tb_3_.VERSION <> ?
            `,
            args: ["%n%", "%n%", 1, 2, 4, 8, "%ing%", 1, 4, 9, 16, 1],
            purpose: "query"
        });
        expect(rows).toEqual([
            {
                "id": 10,
                "name": "GraphQL in Action",
                "edition": 1
            },
            {
                "id": 11,
                "name": "GraphQL in Action",
                "edition": 2
            },
            {
                "id": 12,
                "name": "GraphQL in Action",
                "edition": 3
            }
        ]);
    });

    it("mergeAllJoinsByBackReference", async () => {
        const rows = await sqlClient.createQuery(BOOK_STORE, (q, store) => {
            q.where(
                store.books().$acceptMulti().name.in("Learning GraphQL", "GraphQL in Action"),
                store.books({
                    filter: ctx => ctx.target.name.like("GraphQL")
                }).$acceptMulti().name.ilike("Action"),
                store.books("LEFT").$acceptMulti().name.notIn("DB", "SQL"),
                store.books({
                    joinType: "LEFT",
                    filter: ctx => ctx.target.name.notLike("MongoDB")
                }).$acceptMulti().edition.ne(1)
            );
            return q.selectDistinct(store.fetch(SIMPLE_STORE_VIEW));
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select distinct 
                    tb_1_.ID,
                    tb_1_.NAME,
                    tb_1_.VERSION
                from BOOK_STORE tb_1_
                inner join BOOK tb_2_ on 
                    tb_1_.ID = tb_2_.STORE_ID
                and
                    tb_2_.NAME like ?
                and
                    tb_2_.NAME not like ?
                where 
                        tb_2_.NAME in(?, ?)
                    and
                        lower(tb_2_.NAME) like ?
                    and
                        tb_2_.NAME not in(?, ?)
                    and
                        tb_2_.EDITION <> ?
            `,
            args: ["%GraphQL%", "%MongoDB%", "Learning GraphQL", "GraphQL in Action", "%action%", "DB", "SQL", 1],
            purpose: "query"
        });
        expect(rows).toEqual([
            {"id":2, "name":"MANNING", "version":1}
        ]);
    });

    it("mergeSomeJoinsByBackReference", async () => {
        const rows = await sqlClient.createQuery(BOOK_STORE, (q, store) => {
            q.where(
                dsl.or(
                    store.books().$acceptMulti().name.in("GraphQL in Action", "graphql in action"),
                    store.books({
                        filter: ctx => ctx.target.name.notLike("TypeScript")
                    }).$acceptMulti().name.ilike("n"),
                    store.books("LEFT").$acceptMulti().name.notIn("YugabyteDB: The Definitive Guide"),
                    store.books({
                        joinType: "LEFT",
                        filter: ctx => ctx.target.name.notLike("TypeScript")
                    }).$acceptMulti().edition.ne(1)
                )
            );
            return q.selectDistinct(store.fetch(SIMPLE_STORE_VIEW));
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select distinct 
                    tb_1_.ID,
                    tb_1_.NAME,
                    tb_1_.VERSION
                from BOOK_STORE tb_1_
                inner join BOOK tb_2_ on 
                    tb_1_.ID = tb_2_.STORE_ID
                and
                    tb_2_.NAME not like ?
                left join BOOK tb_3_ on 
                    tb_1_.ID = tb_3_.STORE_ID
                and
                    tb_3_.NAME not like ?
                where 
                        tb_2_.NAME in(?, ?)
                    or
                        lower(tb_2_.NAME) like ?
                    or
                        tb_3_.NAME <> ?
                    or
                        tb_3_.EDITION <> ?
            `,
            args: ["%TypeScript%", "%TypeScript%", "GraphQL in Action", "graphql in action", "%n%", "YugabyteDB: The Definitive Guide", 1],
            purpose: "query"
        });
        expect(rows).toEqual([
            {"id":1, "name":"O'REILLY", "version":1},
            {"id":2, "name":"MANNING", "version":1}
        ]);
    });

    it("mergeAllJoinsByMiddleTable", async () => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                book.authors().$acceptMulti().name().lastName.in("Ranganathan", "Bautin"),
                book.authors({
                    filter: ctx => ctx.target.name().firstName.notLike("name1")
                }).$acceptMulti().name().firstName.ilike("i"),
                book.authors("LEFT").$acceptMulti().name().lastName.notIn("Cook", "Smith"),
                book.authors({
                    joinType: "LEFT",
                    filter: ctx => ctx.target.name().firstName.notLike("name2")
                }).$acceptMulti().name().firstName.ne("Alex")
            );
            return q.selectDistinct(book.fetch(SIMPLE_BOOK_VIEW));
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select distinct 
                    tb_1_.ID,
                    tb_1_.NAME,
                    tb_1_.EDITION
                from BOOK tb_1_
                inner join book_author_mapping tb_2_ on 
                    tb_1_.ID = tb_2_.book_id
                inner join AUTHOR tb_3_ on 
                    tb_2_.author_id = tb_3_.ID
                and
                    tb_3_.FIRST_NAME not like ?
                and
                    tb_3_.FIRST_NAME not like ?
                where 
                        tb_3_.LAST_NAME in(?, ?)
                    and
                        lower(tb_3_.FIRST_NAME) like ?
                    and
                        tb_3_.LAST_NAME not in(?, ?)
                    and
                        tb_3_.FIRST_NAME <> ?
            `,
            args: ["%name1%", "%name2%", "Ranganathan", "Bautin", "%i%", "Cook", "Smith", "Alex"],
            purpose: "query"
        });
        expect(rows).toEqual([
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

    it("mergeSomeJoinsByMiddleTable", async () => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                dsl.or(
                    book.authors().$acceptMulti().name().lastName.in("Ranganathan", "Bautin"),
                    book.authors({
                        filter: ctx => ctx.target.name().firstName.notLike("name1")
                    }).$acceptMulti().name().firstName.ilike("k"),
                    book.authors("LEFT").$acceptMulti().name().lastName.notIn("Karthik", "Kannappan", "Mikhail"),
                    book.authors({
                        joinType: "LEFT",
                        filter: ctx => ctx.target.name().firstName.length().gt(5)
                    }).$acceptMulti().name().firstName.ne("Karthik")
                )
            );
            return q.selectDistinct(book.fetch(SIMPLE_BOOK_VIEW));
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select distinct 
                    tb_1_.ID,
                    tb_1_.NAME,
                    tb_1_.EDITION
                from BOOK tb_1_
                inner join book_author_mapping tb_2_ on 
                    tb_1_.ID = tb_2_.book_id
                inner join AUTHOR tb_3_ on 
                    tb_2_.author_id = tb_3_.ID
                and
                    tb_3_.FIRST_NAME not like ?
                left join book_author_mapping tb_4_ on 
                    tb_1_.ID = tb_4_.book_id
                left join AUTHOR tb_5_ on 
                    tb_4_.author_id = tb_5_.ID
                and
                    length(cast(tb_5_.FIRST_NAME as text)) > ?
                where 
                        tb_3_.LAST_NAME in(?, ?)
                    or
                        lower(tb_3_.FIRST_NAME) like ?
                    or
                        tb_5_.LAST_NAME not in(?, ?, ?)
                    or
                        tb_5_.FIRST_NAME <> ?
            `,
            args: ["%name1%", 5, "Ranganathan", "Bautin", "%k%", "Karthik", "Kannappan", "Mikhail", "Karthik"],
            purpose: "query"
        });
        expect(rows).toEqual([
            {"id":7, "name":"YugabyteDB: The Definitive Guide", "edition":1},
            {"id":8, "name":"YugabyteDB: The Definitive Guide", "edition":2},
            {"id":9, "name":"YugabyteDB: The Definitive Guide", "edition":3}
        ]);
    });

    it("mergeableWeakJoins", async () => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            const filter: FilterType<typeof BOOK, typeof AUTHOR> = 
                ctx => ctx.source.id.minus(ctx.target.id).between(1, 3);
            q.where(
                book.join(AUTHOR, filter)
                    .$acceptMulti()
                    .name()
                    .firstName.like("ail"),
                book.join(AUTHOR, { joinType: "LEFT", filter })
                    .$acceptMulti()
                    .name()
                    .lastName.like("tin")
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
                inner join AUTHOR tb_2_ on 
                    tb_1_.ID - tb_2_.ID between ? and ?
                where 
                        tb_2_.FIRST_NAME like ?
                    and
                        tb_2_.LAST_NAME like ?
            `,
            args: [1, 3, "%ail%", "%tin%"],
            purpose: "query"
        });
        expect(rows).toEqual([
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

    it("unmergeableWeakJoins", async () => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            const filter: FilterType<typeof BOOK, typeof AUTHOR> = 
                ctx => ctx.source.id.minus(ctx.target.id).between(1, 3);
            q.where(
                dsl.or(
                    book.join(AUTHOR, filter)
                        .$acceptMulti()
                        .name()
                        .lastName.like("all"),
                    book.join(AUTHOR, { joinType: "LEFT", filter })
                        .$acceptMulti()
                        .name()
                        .lastName.like("tin")
                )
            );
            return q.selectDistinct(book.fetch(SIMPLE_BOOK_VIEW));
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select distinct 
                    tb_1_.ID,
                    tb_1_.NAME,
                    tb_1_.EDITION
                from BOOK tb_1_
                inner join AUTHOR tb_2_ on 
                    tb_1_.ID - tb_2_.ID between ? and ?
                left join AUTHOR tb_3_ on 
                    tb_1_.ID - tb_3_.ID between ? and ?
                where 
                        tb_2_.LAST_NAME like ?
                    or
                        tb_3_.LAST_NAME like ?
            `,
            args: [1, 3, 1, 3, "%all%", "%tin%"],
            purpose: "query"
        });
        expect(rows).toEqual([
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
});