import { createView } from "@/schema/view";
import { describe, it } from "node:test";
import { AUTHOR, BOOK_STORE } from "../../model/model";
import { expectTypeOf } from "vitest";
import { TypeOf } from "@/index";

describe("Formula", () => {

    it("simple", () => {
        const view = createView(AUTHOR, {
            id: true,
            fullName: true
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            fullName: string;
            id: number;
        }>();
    });

    it("deep", () => {
        const view = createView(BOOK_STORE, {
            $allScalars: true,
            $fold: {
                formulas: c => c({
                    bookNames: true
                })
            },
            books: c => c({
                id: true,
                authorCount: true
            })
        });
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
        const view = createView(BOOK_STORE, {
            $allScalars: true,
            $fold: {
                formulas: c => c({
                    bookNames: { alias: "bNames" }
                })
            },
            books: c => c({
                id: true,
                authorCount: { alias: "aCount" }
            })
        });
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