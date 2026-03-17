import { describe, it } from "vitest";
import { SIMPLE_BOOK_VIEW, SIMPLE_PAPER_BOOK_VIEW, sql, sqlClient } from "./utils";
import { BOOK, ELECTRONIC_BOOK, PAPER_BOOK } from "../model/model";
import { dsl } from "@ts-grm/core";
import { expectCode } from "../utils";

describe("InheritanceSqlTest", () => {
    
    it("is", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                dsl.or(
                    book.name.ilike('graphql'),
                    book.is(ELECTRONIC_BOOK)
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
                    lower(tb_1_.NAME) like ?
                or
                    tb_1_.TYPE in('ElectronicBook', 'PdfElectronicBook')
        `);
    });

    it("upcast", () => {
        const q = sqlClient.createQuery(PAPER_BOOK, (q, book) => {
            q.where(
                book.size().width.gt(100),
                book.size().height.gt(100),
                book.name.ilike("graphql")
            );
            return q.select(book.fetch(SIMPLE_PAPER_BOOK_VIEW));
        });
        console.log(sql(q));
    });
});