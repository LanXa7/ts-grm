import { describe, it } from "node:test";
import { AUTHOR, BOOK, BOOK_STORE } from "../../model/model";
import { expectTypeOf } from "vitest";
import { dsl, dto, TypeOf } from "@/index";
import z from "zod";

describe("Formula", () => {

    it("simple", () => {
        const view = dto.view(AUTHOR, c => [
            c.id,
            c.fullName
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            fullName: string;
            id: number;
        }>();
    });

    it("deep", () => {
        const view = dto.view(BOOK_STORE, c => [
            c.$allScalars,
            c.$fold("formulas", c => [
                c.bookNames
            ]),
            c.books.with(c => [
                c.id,
                c.authorCount
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: string;
            name: string;
            version: number;
            formulas: {
                bookNames: string[];
            };
            books: {
                id: number;
                authorCount: number;
            }[];
        }>();
    });

    it("deepWithAlias", () => {
        const view = dto.view(BOOK_STORE, c => [
            c.$allScalars,
            c.$fold("formulas", c => [
                c.bookNames.as("bNames")
            ]),
            c.books.with(c => [
                c.id,
                c.authorCount.as("aCount")
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: string;
            name: string;
            version: number;
            formulas: {
                bNames: string[];
            };
            books: {
                id: number;
                aCount: number;
            }[];
        }>();
    });

    it("dtoLevelTsFormula", () => {
        const view = dto.view(BOOK, c => [
            c.$formula.ts({
                alias: "key",
                valueType: z.string(),
                dependency: c => [
                    c.name,
                    c.edition
                ],
                fn: data => `${data.name}(${data.edition})`
            })
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            key: string
        }>();
    });

    it("dtoLevelSqlFormula", () => {
        const view = dto.view(BOOK_STORE, c => [
            c.name,
            c.$formula.sql({
                alias: "avgPrice",
                valueType: z.number(),
                fn: store => dsl.subQuery(BOOK, (q, book) => {
                    q.where(book.storeId.eq(store.id));
                    return q.select(dsl.avg(book.price).asNonNull());
                })
            })
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            name: string;
            avgPrice: number;
        }>();
    });
});