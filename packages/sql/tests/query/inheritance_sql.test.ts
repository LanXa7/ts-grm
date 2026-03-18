import { describe, it } from "vitest";
import { SIMPLE_BOOK_VIEW, SIMPLE_PAPER_BOOK_VIEW, sql, sqlClient } from "./utils";
import { BOOK, ELECTRONIC_BOOK, PAPER_BOOK } from "../model/model";
import { dsl } from "@ts-grm/core";
import { expectCode } from "../utils";

describe("InheritanceSqlTest", () => {

    it("superProps", () => {
        const q = sqlClient.createQuery(PAPER_BOOK, (q, book) => {
            q.where(
                book.size().width.gt(100),
                book.size().height.gt(100),
                book.name.ilike("graphql")
            );
            return q.select(book.fetch(SIMPLE_PAPER_BOOK_VIEW));
        });
        expectCode(sql(q), `
            select 
                tb_1_.PB_ID,
                tb_2_.NAME,
                tb_2_.EDITION,
                tb_2_.PRICE,
                tb_1_.WIDTH,
                tb_1_.HEIGHT
            from PAPER_BOOK tb_1_
            inner join BOOK tb_2_ on 
                tb_1_.PB_ID = tb_2_.ID
            where 
                    tb_1_.WIDTH > ?
                and
                    tb_1_.HEIGHT > ?
                and
                    lower(tb_2_.NAME) like ?
        `);
    });
    
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

    it("as", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                dsl.or(
                    book.name.ilike('graphql'),
                    book.as(ELECTRONIC_BOOK).address.like("https:", "STARTS_WITH")
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
            left join ELECTRONIC_BOOK tb_2_ on 
                tb_1_.TYPE in('ElectronicBook', 'PdfElectronicBook')
            and
                tb_1_.ID = tb_2_.EB_ID
            where 
                    lower(tb_1_.NAME) like ?
                or
                    tb_2_.ADDRESS like ?
        `);
    });
});