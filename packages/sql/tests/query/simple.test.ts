import { SqliteDriver } from "@/driver/sqlite_driver";
import { newSqlClient } from "@/sql_client";
import { BOOK } from "../model/model";
import { describe, it } from "vitest";
import { dsl, dto } from "@ts-grm/core";
import { Composite } from "@/sql/fragment";

describe("SimpleQueryTest", () => {

    const sqlClient = newSqlClient(new SqliteDriver(), {});

    const SIMPLE_BOOK_VIEW = dto.view(BOOK, $ => $.id.name.edition);
    
    it("where", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.id.eq(3));
            return q.select(book.id, book.name);
        });
        const composite = Composite.of(q, sqlClient);
        console.log(composite);
    });

    it("sub", () => {
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
        console.log(q);
    });

    it("base", () => {
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
            return q.select(base.book.fetch(SIMPLE_BOOK_VIEW));
        });
        console.log(q);
    });
});