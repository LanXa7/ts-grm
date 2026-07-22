import { AUTHOR, BOOK, BOOK_STORE, TREE_NODE } from "../model/model";
import { describe, expect, it } from "vitest";
import { dsl, dto, FilterType } from "@ts-grm/core";
import { newSqlRecord } from "../utils";
import { SIMPLE_BOOK_VIEW, SIMPLE_STORE_VIEW } from "./utils";
import { useSqliteClientWithData } from "../data_utils";

describe.sequential("QuerySqlTest", () => {
    
    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("where", async () => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.id.eq(3));
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
                    tb_1_.ID = ?
            `,
            args: [3],
            purpose: "query"
        });
        expect(rows).toEqual([
            {"id":3, "name":"Learning GraphQL", "edition":3}
        ]);
    });

    it("baseQuery", async () => {
        const baseModel = dsl.derivedModel(
            dsl.unionAll(
                dsl.baseQuery(BOOK, (q, book) => {
                    q.where(book.storeId.eq("2"));
                    return q.select({
                        book,
                        rank: dsl.native.num `row_number() over(order by ${book.price} desc)`
                    });
                }),
                dsl.baseQuery(BOOK, (q, book) => {
                    q.where(book.name.ilike("in action", "ENDS_WITH"));
                    return q.select({
                        book,
                        rank: dsl.native.num `row_number() over(order by ${book.price} desc)`
                    });
                })
            )
        );
        const rows = await sqlClient.createQuery(baseModel, (q, base) => {
            q.where(base.rank.between(1, 3));
            q.orderBy(base.book.price.desc());
            return q.select(base.book.fetch(SIMPLE_BOOK_VIEW));
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.c1,
                    tb_1_.c2,
                    tb_1_.c3
                from (
                    select 
                        tb_2_.ID c1,
                        tb_2_.NAME c2,
                        tb_2_.EDITION c3,
                        row_number() over(order by tb_2_.PRICE desc) c4,
                        tb_2_.PRICE c5
                    from BOOK tb_2_
                    where 
                        tb_2_.STORE_ID = ?
                    union all
                    select 
                        tb_3_.ID c1,
                        tb_3_.NAME c2,
                        tb_3_.EDITION c3,
                        row_number() over(order by tb_3_.PRICE desc) c4,
                        tb_3_.PRICE c5
                    from BOOK tb_3_
                    where 
                        lower(tb_3_.NAME) like ?
                ) tb_1_
                where 
                    tb_1_.c4 between ? and ?
                order by 
                    tb_1_.c5 desc
            `,
            args: ["2", "%in action", 1, 3],
            purpose: "query"
        });
        expect(rows).toEqual([
            {
                "id": 12,
                "name": "GraphQL in Action",
                "edition": 3
            },
            {
                "id": 12,
                "name": "GraphQL in Action",
                "edition": 3
            },
            {
                "id": 11,
                "name": "GraphQL in Action",
                "edition": 2
            },
            {
                "id": 11,
                "name": "GraphQL in Action",
                "edition": 2
            },
            {
                "id": 10,
                "name": "GraphQL in Action",
                "edition": 1
            },
            {
                "id": 10,
                "name": "GraphQL in Action",
                "edition": 1
            }
        ]);
    });

    it("cteBaseQuery", async () => {
        const baseModel = dsl.cteModel(
            dsl.unionAll(
                dsl.baseQuery(BOOK, (q, book) => {
                    q.where(book.storeId.eq("2"));
                    return q.select({
                        book,
                        rank: dsl.native.num `row_number() over(order by ${book.price} desc)`
                    });
                }),
                dsl.baseQuery(BOOK, (q, book) => {
                    q.where(book.name.ilike("in action", "ENDS_WITH"));
                    return q.select({
                        book,
                        rank: dsl.native.num `row_number() over(order by ${book.price} desc)`
                    });
                })
            )
        );
        const rows = await sqlClient.createQuery(baseModel, (q, base) => {
            q.where(base.rank.between(1, 3));
            q.orderBy(base.book.price.desc());
            return q.select(base.book.fetch(SIMPLE_BOOK_VIEW));
        }).fetchList();
        sqlRecord.assert({
            sql: `
                with
                    tb_1_(c1, c2, c3, c4, c5) as (
                        select 
                            tb_2_.ID,
                            tb_2_.NAME,
                            tb_2_.EDITION,
                            row_number() over(order by tb_2_.PRICE desc),
                            tb_2_.PRICE
                        from BOOK tb_2_
                        where 
                            tb_2_.STORE_ID = ?
                        union all
                        select 
                            tb_3_.ID,
                            tb_3_.NAME,
                            tb_3_.EDITION,
                            row_number() over(order by tb_3_.PRICE desc),
                            tb_3_.PRICE
                        from BOOK tb_3_
                        where 
                            lower(tb_3_.NAME) like ?
                    )
                select 
                    tb_1_.c1,
                    tb_1_.c2,
                    tb_1_.c3
                from tb_1_
                where 
                    tb_1_.c4 between ? and ?
                order by 
                    tb_1_.c5 desc
            `,
            args: ["2", "%in action", 1, 3],
            purpose: "query"
        });
        expect(rows).toEqual([
            {
                "id": 12,
                "name": "GraphQL in Action",
                "edition": 3
            },
            {
                "id": 12,
                "name": "GraphQL in Action",
                "edition": 3
            },
            {
                "id": 11,
                "name": "GraphQL in Action",
                "edition": 2
            },
            {
                "id": 11,
                "name": "GraphQL in Action",
                "edition": 2
            },
            {
                "id": 10,
                "name": "GraphQL in Action",
                "edition": 1
            },
            {
                "id": 10,
                "name": "GraphQL in Action",
                "edition": 1
            }
        ]);
    });

    it("recursiveCteBaseQuery", async () => {
        const VIEW = dto.view(TREE_NODE, c => [c.id, c.name]);
        const baseModel = dsl.cteModel(
            dsl.baseQuery(TREE_NODE, (q, treeNode) => {
                q.where(treeNode.parentNodeId.isNull());
                return q.select({
                    treeNode,
                    depth: dsl.constant(1)
                });
            }).unionAllRecursively(TREE_NODE, {
                join: (prev, treeNode) => treeNode.parentNodeId.eq(prev.treeNode.id),
                query: (q, treeNode) => {
                    return q.select({
                        treeNode,
                        depth: q.prev.depth.plus(dsl.constant(1))
                    });
                }
            })
        );
        const rows = await sqlClient.createQuery(baseModel, (q, base) => {
            q.orderBy(base.depth, base.treeNode.name);
            return q.select(
                base.treeNode.fetch(VIEW),
                base.depth
            );
        }).fetchList();
        sqlRecord.assert({
            sql: `
                with
                    recursive tb_1_(c1, c2, c3) as (
                        select 
                            tb_2_.ID,
                            tb_2_.NAME,
                            1
                        from TREE_NODE tb_2_
                        where 
                            tb_2_.PARENT_NODE_ID is null
                        union all
                        select 
                            tb_3_.ID,
                            tb_3_.NAME,
                            tb_1_.c3 + 1
                        from TREE_NODE tb_3_
                        inner join tb_1_ on 
                            tb_3_.PARENT_NODE_ID = tb_1_.c1
                    )
                select 
                    tb_1_.c1,
                    tb_1_.c2,
                    tb_1_.c3
                from tb_1_
                order by 
                    tb_1_.c3 asc,
                    tb_1_.c2 asc
            `,
            args: [],
            purpose: "query"
        });
        expect(rows).toEqual([
            [
                {
                    "id": 1,
                    "name": "Home"
                },
                1
            ],
            [
                {
                    "id": 9,
                    "name": "Clothing"
                },
                2
            ],
            [
                {
                    "id": 2,
                    "name": "Food"
                },
                2
            ],
            [
                {
                    "id": 6,
                    "name": "Bread"
                },
                3
            ],
            [
                {
                    "id": 3,
                    "name": "Drinks"
                },
                3
            ],
            [
                {
                    "id": 18,
                    "name": "Man"
                },
                3
            ],
            [
                {
                    "id": 10,
                    "name": "Woman"
                },
                3
            ],
            [
                {
                    "id": 7,
                    "name": "Baguette"
                },
                4
            ],
            [
                {
                    "id": 19,
                    "name": "Casual wear"
                },
                4
            ],
            [
                {
                    "id": 11,
                    "name": "Casual wear"
                },
                4
            ],
            [
                {
                    "id": 8,
                    "name": "Ciabatta"
                },
                4
            ],
            [
                {
                    "id": 4,
                    "name": "Coca Cola"
                },
                4
            ],
            [
                {
                    "id": 5,
                    "name": "Fanta"
                },
                4
            ],
            [
                {
                    "id": 22,
                    "name": "Formal wear"
                },
                4
            ],
            [
                {
                    "id": 15,
                    "name": "Formal wear"
                },
                4
            ],
            [
                {
                    "id": 12,
                    "name": "Dress"
                },
                5
            ],
            [
                {
                    "id": 20,
                    "name": "Jacket"
                },
                5
            ],
            [
                {
                    "id": 21,
                    "name": "Jeans"
                },
                5
            ],
            [
                {
                    "id": 14,
                    "name": "Jeans"
                },
                5
            ],
            [
                {
                    "id": 13,
                    "name": "Miniskirt"
                },
                5
            ],
            [
                {
                    "id": 24,
                    "name": "Shirt"
                },
                5
            ],
            [
                {
                    "id": 17,
                    "name": "Shirt"
                },
                5
            ],
            [
                {
                    "id": 23,
                    "name": "Suit"
                },
                5
            ],
            [
                {
                    "id": 16,
                    "name": "Suit"
                },
                5
            ]
        ]);
    });

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
            return q.select(store.fetch(SIMPLE_STORE_VIEW));
        }).distinct().fetchList();
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
            return q.select(store.fetch(SIMPLE_STORE_VIEW));
        }).distinct().fetchList();
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
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        }).distinct().fetchList();
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
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        }).distinct().fetchList();
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
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        }).distinct().fetchList();
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

    it("derivedTableJoinDerivedTable", async () => {
        const baseStoreModel = dsl.derivedModel(
            dsl.baseQuery(BOOK_STORE, (q, store) => {
                return q.select({
                    store,
                    rank: dsl.native.num `row_number() over(order by ${store.name} desc)`
                })
            })
        );
        const baseBookModel = dsl.derivedModel(
            dsl.baseQuery(BOOK, (q, book) => {
                return q.select({
                    book,
                    rank: dsl.native.num `row_number() over(order by ${book.price} desc)`
                })
            })
        );
        const rows = await sqlClient.createQuery(baseBookModel, (q, baseBook) => {
            const baseStore = baseBook.join(
                baseStoreModel, 
                ctx => ctx.source.rank.eq(ctx.target.rank)
            );
            return q.select(
                baseBook.book.fetch(SIMPLE_BOOK_VIEW),
                baseStore.store.fetch(SIMPLE_STORE_VIEW)
            );
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.c1,
                    tb_1_.c2,
                    tb_1_.c3,
                    tb_2_.c1,
                    tb_2_.c2,
                    tb_2_.c3
                from (
                    select 
                        tb_3_.ID c1,
                        tb_3_.NAME c2,
                        tb_3_.EDITION c3,
                        row_number() over(order by tb_3_.PRICE desc) c4
                    from BOOK tb_3_
                ) tb_1_
                inner join (
                    select 
                        tb_4_.ID c1,
                        tb_4_.NAME c2,
                        tb_4_.VERSION c3,
                        row_number() over(order by tb_4_.NAME desc) c4
                    from BOOK_STORE tb_4_
                ) tb_2_ on 
                    tb_1_.c4 = tb_2_.c4
            `,
            args: [],
            purpose: "query"
        });
        expect(rows).toEqual([
            [
                {
                    "id": 9,
                    "name": "YugabyteDB: The Definitive Guide",
                    "edition": 3
                },
                {
                    "id": 1,
                    "name": "O'REILLY",
                    "version": 1
                }
            ],
            [
                {
                    "id": 8,
                    "name": "YugabyteDB: The Definitive Guide",
                    "edition": 2
                },
                {
                    "id": 2,
                    "name": "MANNING",
                    "version": 1
                }
            ]
        ]);
    });

    it("cteTableJoinCteTable", async () => {
        const baseStoreModel = dsl.cteModel(
            dsl.baseQuery(BOOK_STORE, (q, store) => {
                return q.select({
                    store,
                    rank: dsl.native.num `row_number() over(order by ${store.version} desc)`
                })
            })
        );
        const baseBookModel = dsl.cteModel(
            dsl.baseQuery(BOOK, (q, book) => {
                return q.select({
                    book,
                    rank: dsl.native.num `row_number() over(order by ${book.edition} desc)`
                })
            })
        );
        const rows = await sqlClient.createQuery(baseBookModel, (q, baseBook) => {
            const baseStore = baseBook.join(
                baseStoreModel, 
                {
                    joinType: "LEFT",
                    filter: ctx => ctx.source.book.name.length().gt(ctx.target.store.name.length())
                }
            );
            q.where(
                baseBook.rank.lte(3),
                baseStore.rank.lte(3)
            );
            return q.select(
                baseBook.book.id,
                baseStore.store.id
            );
        }).distinct().fetchList();
        sqlRecord.assert({
            sql: `
                with
                    tb_1_(c1, c2, c3) as (
                        select 
                            tb_3_.ID,
                            row_number() over(order by tb_3_.EDITION desc),
                            tb_3_.NAME
                        from BOOK tb_3_
                    ),
                    tb_2_(c1, c2, c3) as (
                        select 
                            tb_4_.ID,
                            row_number() over(order by tb_4_.VERSION desc),
                            tb_4_.NAME
                        from BOOK_STORE tb_4_
                    )
                select distinct 
                    tb_1_.c1,
                    tb_2_.c1
                from tb_1_
                left join tb_2_ on 
                    length(cast(tb_1_.c3 as text)) > length(cast(tb_2_.c3 as text))
                where 
                        tb_1_.c2 <= ?
                    and
                        tb_2_.c2 <= ?
            `,
            args: [3, 3],
            purpose: "query"
        });
        expect(rows).toEqual([[6,1],[6,2],[12,1],[12,2],[3,1],[3,2]]);
    });

    it("cteTableJoinEntityTable", async () => {
        const baseBookModel = dsl.cteModel(
            dsl.baseQuery(BOOK, (q, book) => {
                return q.select({
                    book,
                    rank: dsl.native.num `row_number() over(order by ${book.edition} desc)`
                })
            })
        );
        const rows = await sqlClient.createQuery(baseBookModel, (q, baseBook) => {
            const store = baseBook.join(
                BOOK_STORE, 
                ctx => dsl.and(
                    ctx.source.book.storeId.eq(ctx.target.id),
                    ctx.source.rank.eq(1)
                )
            ).$acceptMulti();
            return q.select(
                baseBook.book.fetch(SIMPLE_BOOK_VIEW),
                store.fetch(SIMPLE_STORE_VIEW)
            );
        }).fetchList();
        sqlRecord.assert({
            sql: `
                with
                    tb_1_(c1, c2, c3, c4, c5) as (
                        select 
                            tb_3_.ID,
                            tb_3_.NAME,
                            tb_3_.EDITION,
                            tb_3_.STORE_ID,
                            row_number() over(order by tb_3_.EDITION desc)
                        from BOOK tb_3_
                    )
                select 
                    tb_1_.c1,
                    tb_1_.c2,
                    tb_1_.c3,
                    tb_2_.ID,
                    tb_2_.NAME,
                    tb_2_.VERSION
                from tb_1_
                inner join BOOK_STORE tb_2_ on 
                    tb_1_.c4 = tb_2_.ID
                and
                    tb_1_.c5 = ?
            `,
            args: [1],
            purpose: "query"
        });
        expect(rows).toEqual([
            [
                {"id":3, "name":"Learning GraphQL", "edition":3}, 
                {"id":1, "name":"O'REILLY", "version":1}
            ]
        ]);
    });

    it("entityJoinCteTable", async () => {
        const baseBookModel = dsl.cteModel(
            dsl.baseQuery(BOOK, (q, book) => {
                return q.select({
                    book,
                    rank: dsl.native.num `row_number() over(order by ${book.edition} desc)`
                })
            })
        );
        const rows = await sqlClient.createQuery(BOOK_STORE, (q, store) => {
            const baseBook = store.join(
                baseBookModel,
                ctx => dsl.and(
                    ctx.source.id.eq(ctx.target.book.storeId),
                    ctx.target.rank.eq(1)
                )
            );
            return q.select(
                baseBook.book.fetch(SIMPLE_BOOK_VIEW),
                store.fetch(SIMPLE_STORE_VIEW)
            )
        }).fetchList();
        sqlRecord.assert({
            sql: `
                with
                    tb_2_(c1, c2, c3, c4, c5) as (
                        select 
                            tb_3_.ID,
                            tb_3_.NAME,
                            tb_3_.EDITION,
                            tb_3_.STORE_ID,
                            row_number() over(order by tb_3_.EDITION desc)
                        from BOOK tb_3_
                    )
                select 
                    tb_2_.c1,
                    tb_2_.c2,
                    tb_2_.c3,
                    tb_1_.ID,
                    tb_1_.NAME,
                    tb_1_.VERSION
                from BOOK_STORE tb_1_
                inner join tb_2_ on 
                    tb_1_.ID = tb_2_.c4
                and
                    tb_2_.c5 = ?
            `,
            args: [1],
            purpose: "query"
        });
        expect(rows).toEqual([
            [
                {"id":3, "name":"Learning GraphQL", "edition":3},
                {"id":1, "name":"O'REILLY", "version":1}
            ]
        ]);
    });

    it("exportedTableAssociateEntityTable", async () => {
        const baseBookModel = dsl.cteModel(
            dsl.baseQuery(BOOK, (q, book) => {
                return q.select({
                    book,
                    rank: dsl.native.num `row_number() over(order by ${book.edition} desc)`
                })
            })
        );
        const rows = await sqlClient.createQuery(baseBookModel, (q, baseBook) => {
            q.where(baseBook.rank.eq(1));
            q.where(baseBook.book.store().version.eq(1));
            return q.select(
                baseBook.book.fetch(SIMPLE_BOOK_VIEW),
                baseBook.book.store().fetch(SIMPLE_STORE_VIEW)
            );
        }).fetchList();
        sqlRecord.assert({
            sql: `
                with
                    tb_1_(c1, c2, c3, c4, c5) as (
                        select 
                            tb_3_.ID,
                            tb_3_.NAME,
                            tb_3_.EDITION,
                            row_number() over(order by tb_3_.EDITION desc),
                            tb_3_.STORE_ID
                        from BOOK tb_3_
                    )
                select 
                    tb_1_.c1,
                    tb_1_.c2,
                    tb_1_.c3,
                    tb_2_.ID,
                    tb_2_.NAME,
                    tb_2_.VERSION
                from tb_1_
                inner join BOOK_STORE tb_2_ on 
                    tb_1_.c5 = tb_2_.ID
                where 
                        tb_1_.c4 = ?
                    and
                        tb_2_.VERSION = ?
            `,
            args: [1, 1],
            purpose: "query"
        });
        expect(rows).toEqual([
            [
                {"id":3, "name":"Learning GraphQL", "edition":3},
                {"id":1, "name":"O'REILLY", "version":1}
            ]
        ]);
    });

    it("exportedTableJoinEntityTable", async () => {
        const baseBookModel = dsl.cteModel(
            dsl.baseQuery(BOOK, (q, book) => {
                return q.select({
                    book,
                    rank: dsl.native.num `row_number() over(order by ${book.edition} desc)`
                })
            })
        );
        const rows = await sqlClient.createQuery(baseBookModel, (q, baseBook) => {
            const store = baseBook.book.join(
                BOOK_STORE,
                ctx => ctx.source.storeId.eq(ctx.target.id)
            ).$acceptMulti();
            q.where(baseBook.rank.eq(1));
            q.where(store.version.eq(1));
            return q.select(
                baseBook.book.fetch(SIMPLE_BOOK_VIEW),
                store.fetch(SIMPLE_STORE_VIEW)
            );
        }).fetchList();
        sqlRecord.assert({
            sql: `
                with
                    tb_1_(c1, c2, c3, c4, c5) as (
                        select 
                            tb_3_.ID,
                            tb_3_.NAME,
                            tb_3_.EDITION,
                            row_number() over(order by tb_3_.EDITION desc),
                            tb_3_.STORE_ID
                        from BOOK tb_3_
                    )
                select 
                    tb_1_.c1,
                    tb_1_.c2,
                    tb_1_.c3,
                    tb_2_.ID,
                    tb_2_.NAME,
                    tb_2_.VERSION
                from tb_1_
                inner join BOOK_STORE tb_2_ on 
                    tb_1_.c5 = tb_2_.ID
                where 
                        tb_1_.c4 = ?
                    and
                        tb_2_.VERSION = ?
            `,
            args: [1, 1],
            purpose: "query"
        });
        expect(rows).toEqual([
            [
                {"id":3, "name":"Learning GraphQL", "edition":3},
                {"id":1, "name":"O'REILLY","version":1}
            ]
        ]);
    });

    it("except", async() => {
        const view = dto.view(BOOK, c => [
            c.name,
            c.store.with(c => [c.name]),
            c.authors.with(c => [c.name])
        ]);
        const rows = await dsl.except(
            sqlClient.createQuery(BOOK, (q, book) => {
                q.where(book.edition.eq(3));
                return q.select(book.fetch(view));
            }),
            sqlClient.createQuery(BOOK, (q, book) => {
                q.where(book.name.ilike("graphql"));
                return q.select(book.fetch(view));
            })
        ).fetchList();
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.NAME,
                        tb_1_.STORE_ID,
                        tb_1_.ID
                    from BOOK tb_1_
                    where 
                        tb_1_.EDITION = ?
                    except
                    select 
                        tb_2_.NAME,
                        tb_2_.STORE_ID,
                        tb_2_.ID
                    from BOOK tb_2_
                    where 
                        lower(tb_2_.NAME) like ?
                `,
                args: [3, "%graphql%"],
                purpose: "query"
            },
            {
                sql: `
                    select 
                        tb_1_.ID,
                        tb_1_.NAME
                    from BOOK_STORE tb_1_
                    where 
                        tb_1_.ID = ?
                `,
                args: [1],
                purpose: "loadAssociation(Book.store)"
            },
            {
                sql: `
                    select 
                        tb_2_.book_id,
                        tb_1_.FIRST_NAME,
                        tb_1_.LAST_NAME
                    from AUTHOR tb_1_
                    inner join book_author_mapping tb_2_ on 
                        tb_1_.ID = tb_2_.author_id
                    where 
                        tb_2_.book_id in(?, ?)
                    order by 
                        tb_1_.FIRST_NAME asc,
                        tb_1_.LAST_NAME asc
                `,
                args: [6, 9],
                purpose: "loadAssociation(Book.authors)"
            }
        );
        console.log(JSON.stringify(rows));
    });
});