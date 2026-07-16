import { describe, it } from "node:test";
import { AUTHOR, BOOK_STORE } from "../../model/model";
import { expectTypeOf } from "vitest";
import { dto, TypeOf } from "@/index";

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
});