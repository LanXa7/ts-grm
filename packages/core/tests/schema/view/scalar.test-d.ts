import { createView } from "@/schema/view";
import { describe, it } from "node:test";
import { BOOK, LEARNING_LINK } from "../../model/model";
import { expectTypeOf } from "vitest";
import { TypeOf } from "@/index";

describe("ScalarTest", () => {

    it("simple", () => {
        const view = createView(BOOK, {
            id: true,
            name: true,
            edition: true
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            name: string;
            edition: number;
        }>();
    });

    it("null", () => {
        const view = createView(LEARNING_LINK, {
            id: true,
            score: true
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            score: number | null;
        }>();
    });

    it("alias", () => {
        const view = createView(BOOK, {
            id: { alias: "bookId" },
            name: { alias: "bookName" },
            edition: { alias: "bookEdition" }
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            bookId: number;
            bookName: string;
            bookEdition: number;
        }>();
    });
});