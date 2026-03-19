import { describe, it } from "vitest";
import { SIMPLE_BOOK_VIEW, SIMPLE_PAPER_BOOK_VIEW, SIMPLE_PHYSICAL_BOOK_STORE_VIEW, SIMPLE_STORE_VIEW, sql, sqlClient } from "./utils";
import { BOOK, BOOK_STORE, ELECTRONIC_BOOK, PAPER_BOOK, PHYSICAL_BOOK_STORE } from "../model/model";
import { dsl } from "@ts-grm/core";
import { expectCode } from "../utils";

describe("InheritanceSqlTest", () => {
    
    it("isFunctionOfMultipleTables", () => {
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

    it("asFunctionOfMultipleTables", () => {
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

    it("superPropsOfMultipleTables", () => {
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

    it("superPropOfDownCastTypeOfMultipleTables", () => {
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                dsl.or(
                    book.name.ilike('graphql'),
                    book.as(ELECTRONIC_BOOK).address.like("https:", "STARTS_WITH"),
                    book.as(ELECTRONIC_BOOK).edition.lt(3),
                    book.as(ELECTRONIC_BOOK).edition.gt(10)
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
            left join BOOK tb_3_ on 
                tb_2_.EB_ID = tb_3_.ID
            where 
                    lower(tb_1_.NAME) like ?
                or
                    tb_2_.ADDRESS like ?
                or
                    tb_3_.EDITION < ?
                or
                    tb_3_.EDITION > ?
        `);
    });

    it("isFunctionOfSingleTable", () => {
        const q = sqlClient.createQuery(BOOK_STORE, (q, store) => {
            q.where(
                dsl.or(
                    store.name.ilike("room"),
                    store.is(PHYSICAL_BOOK_STORE)
                )
            );
            return q.select(
                store.fetch(SIMPLE_STORE_VIEW)
            );
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.VERSION
            from BOOK_STORE tb_1_
            where 
                    lower(tb_1_.NAME) like ?
                or
                    tb_1_.TYPE = 'PhysicalBookStore'
        `);
    });

    it("asFunctionOfSingleTable", () => {
        const q = sqlClient.createQuery(BOOK_STORE, (q, store) => {
            q.where(
                dsl.or(
                    store.name.ilike("room"),
                    store.as(PHYSICAL_BOOK_STORE).city.eq("ChengDu")
                )
            );
            return q.select(
                store.fetch(SIMPLE_STORE_VIEW)
            );
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.VERSION
            from BOOK_STORE tb_1_
            where 
                    lower(tb_1_.NAME) like ?
                or
                    tb_1_.CITY = ?
        `);
    });

    it("superPropsOfSingleTables", () => {
        const q = sqlClient.createQuery(PHYSICAL_BOOK_STORE, (q, store) => {
            q.where(
                store.city.eq("ChengDu"),
                store.name.ilike("room")
            );
            return q.select(
                store.fetch(SIMPLE_PHYSICAL_BOOK_STORE_VIEW)
            )
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.VERSION,
                tb_1_.CITY,
                tb_1_.STREET
            from BOOK_STORE tb_1_
            where 
                    tb_1_.CITY = ?
                and
                    lower(tb_1_.NAME) like ?
        `);
    });

    it("superPropOfDownCastTypeOfSingleTable", () => {
        const q = sqlClient.createQuery(BOOK_STORE, (q, store) => {
            q.where(
                dsl.or(
                    store.name.ilike("room"),
                    store.as(PHYSICAL_BOOK_STORE).city.eq("ChengDu"),
                    store.as(PHYSICAL_BOOK_STORE).version.lt(3),
                    store.as(PHYSICAL_BOOK_STORE).version.gt(10)
                )
            );
            return q.select(
                store.fetch(SIMPLE_STORE_VIEW)
            );
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.VERSION
            from BOOK_STORE tb_1_
            left join BOOK_STORE tb_2_ on 
                tb_1_.ID = tb_2_.ID
            where 
                    lower(tb_1_.NAME) like ?
                or
                    tb_1_.CITY = ?
                or
                    tb_2_.VERSION < ?
                or
                    tb_2_.VERSION > ?
        `);
    });
});