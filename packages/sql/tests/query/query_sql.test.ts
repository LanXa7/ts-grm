import { AUTHOR, BOOK, BOOK_STORE, TREE_NODE } from "../model/model";
import { describe, it, afterAll } from "vitest";
import { dsl, dto, FilterType } from "@ts-grm/core";
import { expectCode, useSqlClient } from "../utils";
import { SIMPLE_BOOK_VIEW, SIMPLE_STORE_VIEW, sql } from "./utils";

describe("QuerySqlTest", () => {
    
    const [sqlClient, cleanup] = useSqlClient();
    afterAll(() => {
        cleanup();
    });

    it("where", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.id.eq(3));
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.EDITION
            from BOOK tb_1_
            where 
                tb_1_.ID = ?
        `);
    });

    it("baseQuery", () => {
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
        const q = sqlClient.createQuery(baseModel, (q, base) => {
            q.where(base.rank.between(1, 3));
            q.orderBy(base.book.price.desc());
            return q.select(base.book.fetch(SIMPLE_BOOK_VIEW));
        });
        expectCode(sql(q), `
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
        `);
    });

    it("cteBaseQuery", () => {
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
        const q = sqlClient.createQuery(baseModel, (q, base) => {
            q.where(base.rank.between(1, 3));
            q.orderBy(base.book.price.desc());
            return q.select(base.book.fetch(SIMPLE_BOOK_VIEW));
        });
        expectCode(sql(q), `
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
        `);
    });

    it("recursiveCteBaseQuery", () => {
        const VIEW = dto.view(TREE_NODE, $ => $.id.name);
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
        const q = sqlClient.createQuery(baseModel, (q, base) => {
            q.orderBy(base.depth, base.treeNode.name);
            return q.select(
                base.treeNode.fetch(VIEW),
                base.depth
            );
        });
        expectCode(sql(q), `
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
        `);
    });

    it("mergeAllJoinsByReference", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                book.store().version.in(1, 2, 4, 8),
                book.store({
                    filter: ctx => ctx.target.name.notLike("name1")
                }).name.ilike("n"),
                book.store("LEFT").version.notIn(1, 4, 9, 16),
                book.store({
                    joinType: "LEFT",
                    filter: ctx => ctx.target.name.notLike("name2")
                }).version.ne(1)
            );
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
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
                tb_2_.NAME not like ?
            and
                tb_2_.NAME not like ?
            where 
                    tb_2_.VERSION in(?, ?, ?, ?)
                and
                    lower(tb_2_.NAME) like ?
                and
                    tb_2_.VERSION not in(?, ?, ?, ?)
                and
                    tb_2_.VERSION <> ?
        `);
    });

    it("mergeSomeJoinsByReference", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                dsl.or(
                    book.store().version.in(1, 2, 4, 8),
                    book.store({
                        filter: ctx => ctx.target.name.notLike("name1")
                    }).name.ilike("n"),
                    book.store("LEFT").version.notIn(1, 4, 9, 16),
                    book.store({
                        joinType: "LEFT",
                        filter: ctx => ctx.target.name.notLike("name2")
                    }).version.ne(1)
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
            inner join BOOK_STORE tb_2_ on 
                tb_1_.STORE_ID = tb_2_.ID
            and
                tb_2_.NAME not like ?
            left join BOOK_STORE tb_3_ on 
                tb_1_.STORE_ID = tb_3_.ID
            and
                tb_3_.NAME not like ?
            where 
                    tb_2_.VERSION in(?, ?, ?, ?)
                or
                    lower(tb_2_.NAME) like ?
                or
                    tb_3_.VERSION not in(?, ?, ?, ?)
                or
                    tb_3_.VERSION <> ?
        `);
    });

    it("mergeAllJoinsByBackReference", () => {
        const q = sqlClient.createQuery(BOOK_STORE, (q, store) => {
            q.where(
                store.books().$acceptMulti().name.in("java", "c++", "c#", "typescript"),
                store.books({
                    filter: ctx => ctx.target.name.notLike("name1")
                }).$acceptMulti().name.ilike("n"),
                store.books("LEFT").$acceptMulti().name.notIn("cobol", "pascal", "fortran", "perl"),
                store.books({
                    joinType: "LEFT",
                    filter: ctx => ctx.target.name.notLike("name2")
                }).$acceptMulti().edition.ne(1)
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
                tb_2_.NAME not like ?
            and
                tb_2_.NAME not like ?
            where 
                    tb_2_.NAME in(?, ?, ?, ?)
                and
                    lower(tb_2_.NAME) like ?
                and
                    tb_2_.NAME not in(?, ?, ?, ?)
                and
                    tb_2_.EDITION <> ?
        `);
    });

    it("mergeSomeJoinsByBackReference", () => {
        const q = sqlClient.createQuery(BOOK_STORE, (q, store) => {
            q.where(
                dsl.or(
                    store.books().$acceptMulti().name.in("java", "c++", "c#", "typescript"),
                    store.books({
                        filter: ctx => ctx.target.name.notLike("name1")
                    }).$acceptMulti().name.ilike("n"),
                    store.books("LEFT").$acceptMulti().name.notIn("cobol", "pascal", "fortran", "perl"),
                    store.books({
                        joinType: "LEFT",
                        filter: ctx => ctx.target.name.notLike("name2")
                    }).$acceptMulti().edition.ne(1)
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
                tb_2_.NAME not like ?
            left join BOOK tb_3_ on 
                tb_1_.ID = tb_3_.STORE_ID
            and
                tb_3_.NAME not like ?
            where 
                    tb_2_.NAME in(?, ?, ?, ?)
                or
                    lower(tb_2_.NAME) like ?
                or
                    tb_3_.NAME not in(?, ?, ?, ?)
                or
                    tb_3_.EDITION <> ?
        `);
    });

    it("mergeAllJoinsByMiddleTable", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                book.authors().$acceptMulti().name().lastName.in("smith", "johnson", "williams", "brown"),
                book.authors({
                    filter: ctx => ctx.target.name().firstName.notLike("name1")
                }).$acceptMulti().name().firstName.ilike("n"),
                book.authors("LEFT").$acceptMulti().name().lastName.notIn("fernsehby", "macgillivray", "pussett", "bythesea"),
                book.authors({
                    joinType: "LEFT",
                    filter: ctx => ctx.target.name().firstName.notLike("name2")
                }).$acceptMulti().name().firstName.ne("tim")
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
                tb_1_.ID = tb_2_.BOOK_ID
            inner join AUTHOR tb_3_ on 
                tb_2_.AUTHOR_ID = tb_3_.ID
            and
                tb_3_.FIRST_NAME not like ?
            and
                tb_3_.FIRST_NAME not like ?
            where 
                    tb_3_.LAST_NAME in(?, ?, ?, ?)
                and
                    lower(tb_3_.FIRST_NAME) like ?
                and
                    tb_3_.LAST_NAME not in(?, ?, ?, ?)
                and
                    tb_3_.FIRST_NAME <> ?
        `);
    });

    it("mergeSomeJoinsByMiddleTable", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                dsl.or(
                    book.authors().$acceptMulti().name().lastName.in("smith", "johnson", "williams", "brown"),
                    book.authors({
                        filter: ctx => ctx.target.name().firstName.notLike("name1")
                    }).$acceptMulti().name().firstName.ilike("n"),
                    book.authors("LEFT").$acceptMulti().name().lastName.notIn("fernsehby", "macgillivray", "pussett", "bythesea"),
                    book.authors({
                        joinType: "LEFT",
                        filter: ctx => ctx.target.name().firstName.notLike("name2")
                    }).$acceptMulti().name().firstName.ne("tim")
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
                tb_1_.ID = tb_2_.BOOK_ID
            inner join AUTHOR tb_3_ on 
                tb_2_.AUTHOR_ID = tb_3_.ID
            and
                tb_3_.FIRST_NAME not like ?
            left join book_author_mapping tb_4_ on 
                tb_1_.ID = tb_4_.BOOK_ID
            left join AUTHOR tb_5_ on 
                tb_4_.AUTHOR_ID = tb_5_.ID
            and
                tb_5_.FIRST_NAME not like ?
            where 
                    tb_3_.LAST_NAME in(?, ?, ?, ?)
                or
                    lower(tb_3_.FIRST_NAME) like ?
                or
                    tb_5_.LAST_NAME not in(?, ?, ?, ?)
                or
                    tb_5_.FIRST_NAME <> ?
        `);
    });

    it("mergeableWeakJoins", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            const filter: FilterType<typeof BOOK, typeof AUTHOR> = 
                ctx => ctx.source.name.eq(ctx.target.name().firstName);
            q.where(
                book.join(AUTHOR, filter)
                    .$acceptMulti()
                    .name()
                    .lastName.like("a"),
                book.join(AUTHOR, { joinType: "LEFT", filter })
                    .$acceptMulti()
                    .name()
                    .lastName.like("b")
            );
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.EDITION
            from BOOK tb_1_
            inner join AUTHOR tb_2_ on 
                tb_1_.NAME = tb_2_.FIRST_NAME
            where 
                    tb_2_.LAST_NAME like ?
                and
                    tb_2_.LAST_NAME like ?
        `);
    });

    it("unmergeableWeakJoins", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            const filter: FilterType<typeof BOOK, typeof AUTHOR> = 
                ctx => ctx.source.name.eq(ctx.target.name().firstName);
            q.where(
                dsl.or(
                    book.join(AUTHOR, filter)
                        .$acceptMulti()
                        .name()
                        .lastName.like("a"),
                    book.join(AUTHOR, { joinType: "LEFT", filter })
                        .$acceptMulti()
                        .name()
                        .lastName.like("b")
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
            inner join AUTHOR tb_2_ on 
                tb_1_.NAME = tb_2_.FIRST_NAME
            left join AUTHOR tb_3_ on 
                tb_1_.NAME = tb_3_.FIRST_NAME
            where 
                    tb_2_.LAST_NAME like ?
                or
                    tb_3_.LAST_NAME like ?
        `);
    });

    it("derivedTableJoinDerivedTable", () => {
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
        const q = sqlClient.createQuery(baseBookModel, (q, baseBook) => {
            const baseStore = baseBook.join(
                baseStoreModel, 
                ctx => ctx.source.rank.eq(ctx.target.rank)
            );
            return q.select(
                baseBook.book.fetch(SIMPLE_BOOK_VIEW),
                baseStore.store.fetch(SIMPLE_STORE_VIEW)
            );
        });
        expectCode(sql(q), `
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
        `);
    });

    it("cteTableJoinCteTable", () => {
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
        const q = sqlClient.createQuery(baseBookModel, (q, baseBook) => {
            const baseStore = baseBook.join(
                baseStoreModel, 
                {
                    joinType: "LEFT",
                    filter: ctx => ctx.source.book.name.eq(ctx.target.store.name)
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
        });
        expectCode(sql(q), `
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
            select 
                tb_1_.c1,
                tb_2_.c1
            from tb_1_
            left join tb_2_ on 
                tb_1_.c3 = tb_2_.c3
            where 
                    tb_1_.c2 <= ?
                and
                    tb_2_.c2 <= ?
        `);
    });

    it("cteTableJoinEntityTable", () => {
        const baseBookModel = dsl.cteModel(
            dsl.baseQuery(BOOK, (q, book) => {
                return q.select({
                    book,
                    rank: dsl.native.num `row_number() over(order by ${book.edition} desc)`
                })
            })
        );
        const q = sqlClient.createQuery(baseBookModel, (q, baseBook) => {
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
        });
        expectCode(sql(q), `
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
        `);
    });

    it("entityJoinCteTable", () => {
        const baseBookModel = dsl.cteModel(
            dsl.baseQuery(BOOK, (q, book) => {
                return q.select({
                    book,
                    rank: dsl.native.num `row_number() over(order by ${book.edition} desc)`
                })
            })
        );
        const q = sqlClient.createQuery(BOOK_STORE, (q, store) => {
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
        });
        expectCode(sql(q), `
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
        `);
    });

    it("exportedTableAssociateEntityTable", () => {
        const baseBookModel = dsl.cteModel(
            dsl.baseQuery(BOOK, (q, book) => {
                return q.select({
                    book,
                    rank: dsl.native.num `row_number() over(order by ${book.edition} desc)`
                })
            })
        );
        const q = sqlClient.createQuery(baseBookModel, (q, baseBook) => {
            q.where(baseBook.rank.eq(1));
            q.where(baseBook.book.store().version.eq(1));
            return q.select(
                baseBook.book.fetch(SIMPLE_BOOK_VIEW),
                baseBook.book.store().fetch(SIMPLE_STORE_VIEW)
            );
        });
        expectCode(sql(q), `
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
        `);
    });

    it("exportedTableJoinEntityTable", () => {
        const baseBookModel = dsl.cteModel(
            dsl.baseQuery(BOOK, (q, book) => {
                return q.select({
                    book,
                    rank: dsl.native.num `row_number() over(order by ${book.edition} desc)`
                })
            })
        );
        const q = sqlClient.createQuery(baseBookModel, (q, baseBook) => {
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
        });
        expectCode(sql(q), `
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
        `);
    });
});