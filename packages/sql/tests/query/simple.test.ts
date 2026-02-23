import { SqliteDriver } from "@/driver/sqlite_driver";
import { newSqlClient } from "@/sql_client";
import { BOOK } from "../model/model";
import { describe, it } from "vitest";
import { dsl, dto } from "@ts-grm/core";

describe("SimpleQueryTest", () => {

    const sqlClient = newSqlClient(new SqliteDriver(), {});

    const SIMPLE_BOOK_VIEW = dto.view(BOOK, $ => $.id.name);
    
    it("where", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.id.eq(3));
            return q.select(book.id, book.name);
        });
        console.log(q);
    });

    it("base", () => {
        const baseModel = dsl.derivedModel(
            dsl.unionAll(
                dsl.baseQuery(BOOK, (q, book) => {
                    q.where(book.storeId.eq("2"));
                    return q.select({
                        book,
                        rank: dsl.native.num(`row_number() over(order by ${book.price} desc)`)
                    });
                }),
                dsl.baseQuery(BOOK, (q, book) => {
                    q.where(book.name.ilike("in action", "ENDS_WITH"));
                    return q.select({
                        book,
                        rank: dsl.native.num(`row_number() over(order by ${book.price} desc)`)
                    });
                })
            )
        );
        const q = sqlClient.createQuery(baseModel, (q, base) => {
            q.where(base.rank.between(1, 3));
            return q.select(base.book.fetch(SIMPLE_BOOK_VIEW));
        });
        console.log(q);
    });
});