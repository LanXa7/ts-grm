import { dsl } from "@ts-grm/core";
import { BOOK, ELECTRONIC_BOOK, PAPER_BOOK } from "../model/model";
import { describe, it } from "vitest";
import { SIMPLE_BOOK_VIEW, SIMPLE_PAPER_BOOK_VIEW, sql, sqlClient } from "./utils";
import { expectCode } from "../utils";

describe("InheritanceBaseQuerySqlTest", () => {

    it("isFunctionOfMultipleTables", () => {
        const baseBookModel = dsl.derivedModel(
            dsl.baseQuery(BOOK, (q, book) => {
                return q.select({
                    book,
                    rank: dsl.native.num `row_number() over(partition by ${
                        book.storeId
                    } order by ${
                        book.price
                    } desc)`
                });
            })
        );
        const q = sqlClient.createQuery(baseBookModel, (q, baseBook) => {
            q.where(
                dsl.or(
                    baseBook.rank.eq(1),
                    baseBook.book.is(ELECTRONIC_BOOK)
                )
            );
            return q.select(
                baseBook.book.fetch(SIMPLE_BOOK_VIEW)
            );
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
                    row_number() over(partition by tb_2_.STORE_ID order by tb_2_.PRICE desc) c4,
                    tb_2_.TYPE c5
                from BOOK tb_2_
            ) tb_1_
            where 
                    tb_1_.c4 = ?
                or
                    tb_1_.c5 in('ElectronicBook', 'PdfElectronicBook')
        `);
    });

    it("asFunctionOfMultipleTables", () => {
        const baseBookModel = dsl.derivedModel(
            dsl.baseQuery(BOOK, (q, book) => {
                return q.select({
                    book,
                    rank: dsl.native.num `row_number() over(partition by ${
                        book.storeId
                    } order by ${
                        book.price
                    } desc)`
                });
            })
        );
        const q = sqlClient.createQuery(baseBookModel, (q, baseBook) => {
            q.where(
                dsl.or(
                    baseBook.rank.eq(1),
                    baseBook.book.as(ELECTRONIC_BOOK).address.like("https:", "STARTS_WITH")
                )
            );
            return q.select(
                baseBook.book.fetch(SIMPLE_BOOK_VIEW)
            );
        });
        expectCode(sql(q), `
            select 
                tb_1_.c1,
                tb_1_.c2,
                tb_1_.c3
            from (
                select 
                    tb_3_.ID c1,
                    tb_3_.NAME c2,
                    tb_3_.EDITION c3,
                    row_number() over(partition by tb_3_.STORE_ID order by tb_3_.PRICE desc) c4,
                    tb_3_.TYPE c5
                from BOOK tb_3_
            ) tb_1_
            left join ELECTRONIC_BOOK tb_2_ on 
                tb_1_.c5 in('ElectronicBook', 'PdfElectronicBook')
            and
                tb_1_.c1 = tb_2_.EB_ID
            where 
                    tb_1_.c4 = ?
                or
                    tb_2_.ADDRESS like ?
        `);
    });

    it("superPropsOfMultipleTables", () => {
        const basePaperBookModel = dsl.derivedModel(
            dsl.baseQuery(PAPER_BOOK, (q, paperBook) => {
                return q.select({
                    paperBook,
                    rank: dsl.native.num `row_number() over(partition by ${
                        paperBook.storeId
                    } order by ${
                        paperBook.price
                    } desc)`
                });
            })
        );
        const q = sqlClient.createQuery(basePaperBookModel, (q, basePaperBook) => {
            q.where(basePaperBook.rank.eq(1));
            return q.select(
                basePaperBook.paperBook.size().width
            );
        });
        console.log(sql(q));
    });
});