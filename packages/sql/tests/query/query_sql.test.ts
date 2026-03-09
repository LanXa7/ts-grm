import { SqliteDriver } from "@/driver/sqlite_driver";
import { newSqlClient } from "@/sql_client";
import { BOOK, TREE_NODE } from "../model/model";
import { describe, it } from "vitest";
import { dsl, dto } from "@ts-grm/core";
import { Composite } from "@/sql/fragment";
import { SqlBuilder } from "@/sql/sql_builder";
import { expectCode } from "../utils";

describe("QuerySqlTest", () => {

    const sqlClient = newSqlClient(new SqliteDriver(), {
        sqlLogger: {
            pretty: true
        }
    });

    const SIMPLE_BOOK_VIEW = dto.view(BOOK, $ => $.id.name.edition);
    
    it("where", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.id.eq(3));
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        });
        const composite = Composite.of(q, sqlClient, undefined);
        const builder = SqlBuilder.of(sqlClient);
        composite.into(builder);
        const [sql] = builder.build();
        expectCode(sql, `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.EDITION
            from BOOK tb_1_
            where 
                tb_1_.ID = ?
        `);
    });

    it("subQuery", () => {
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
        const composite = Composite.of(q, sqlClient, undefined);
        const builder = SqlBuilder.of(sqlClient);
        composite.into(builder);
        const [sql] = builder.build();
        expectCode(sql, `
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
        const composite = Composite.of(q, sqlClient, undefined);
        const builder = SqlBuilder.of(sqlClient);
        composite.into(builder);
        const [sql] = builder.build();
        expectCode(sql, `
            select 
                tb_1_.c1,
                tb_1_.c2,
                tb_1_.c3
            from (
                select 
                    tb_2_.ID c1,
                    tb_2_.NAME c2,
                    tb_2_.EDITION c3,
                    tb_2_.PRICE c5,
                    row_number() over(order by tb_2_.PRICE desc) c4
                from BOOK tb_2_
                where 
                    tb_2_.STORE_ID = ?
                union all
                select 
                    tb_3_.ID c1,
                    tb_3_.NAME c2,
                    tb_3_.EDITION c3,
                    tb_3_.PRICE c5,
                    row_number() over(order by tb_3_.PRICE desc) c4
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
        const composite = Composite.of(q, sqlClient, undefined);
        const builder = SqlBuilder.of(sqlClient);
        composite.into(builder);
        const [sql] = builder.build();
        expectCode(sql, `
            with
                tb_1_(c1, c2, c3, c5, c4) as (
                    select 
                        tb_2_.ID,
                        tb_2_.NAME,
                        tb_2_.EDITION,
                        tb_2_.PRICE,
                        row_number() over(order by tb_2_.PRICE desc)
                    from BOOK tb_2_
                    where 
                        tb_2_.STORE_ID = ?
                    union all
                    select 
                        tb_3_.ID,
                        tb_3_.NAME,
                        tb_3_.EDITION,
                        tb_3_.PRICE,
                        row_number() over(order by tb_3_.PRICE desc)
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
        const composite = Composite.of(q, sqlClient, undefined);
        const builder = SqlBuilder.of(sqlClient);
        composite.into(builder);
        const [sql] = builder.build();
        expectCode(sql, `
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
                    inner join tb_1_ on tb_3_.PARENT_NODE_ID = tb_1_.c1
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

    it("mergeAllJoins", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                book.store().version.in(1, 2, 4, 8)
            );
            q.where(
                book.store({
                    filter: ctx => ctx.target.name.notLike("alex")
                }).name.ilike("n")
            );
            q.where(
                book.store("LEFT").version.notIn(1, 4, 9, 16)
            );  
            q.where(
                book.store({
                    joinType: "LEFT",
                    filter: ctx => ctx.target.name.notLike("bob")
                }).version.ne(1)
            );
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        });
        const composite = Composite.of(q, sqlClient, undefined);
        const builder = SqlBuilder.of(sqlClient);
        composite.into(builder);
        const [sql] = builder.build();
        expectCode(sql, `
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

    it("mergeSomeJoins", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                dsl.or(
                    book.store().version.in(1, 2, 4, 8),
                    book.store({
                        filter: ctx => ctx.target.name.notLike("alex")
                    }).name.ilike("n"),
                    book.store("LEFT").version.notIn(1, 4, 9, 16),
                    book.store({
                        joinType: "LEFT",
                        filter: ctx => ctx.target.name.notLike("bob")
                    }).version.ne(1)
                )
            );
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        });
        const composite = Composite.of(q, sqlClient, undefined);
        const builder = SqlBuilder.of(sqlClient);
        composite.into(builder);
        const [sql] = builder.build();
        expectCode(sql, `
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
});