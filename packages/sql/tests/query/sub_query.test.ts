import { describe, it } from "vitest";
import { SIMPLE_BOOK_VIEW, sql, sqlClient } from "./utils";
import { AUTHOR, BOOK, ORDER, ORDER_ITEM } from "../model/model";
import { dsl } from "@ts-grm/core";
import { expectCode } from "../utils";

describe("SubQueryTest", () => {
    
    it("inExprSubQuery", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                book.id.inSubQuery(
                    dsl.subQuery(AUTHOR, (q, author) => {
                        q.where(author.name().firstName.like("a"));
                        return q.select(author.books().$acceptRisk().id);
                    })
                )
            );
            return q.select(book.fetch(SIMPLE_BOOK_VIEW));
        });
        console.log(sql(q));
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
        console.log(sql(q));
    });
});