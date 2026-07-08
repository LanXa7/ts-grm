import { describe, it } from "node:test";
import { BOOK, LEARNING_LINK } from "../../model/model";
import { expectTypeOf } from "vitest";
import { TypeOf } from "@/index";
import { newView } from "@/schema/dto/index";

describe("ScalarTest", () => {

    it("simple", () => {
        const view = newView(BOOK, c => [
            c.id,
            c.name,
            c.edition
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            name: string;
            edition: number;
        }>();
    });

    it("null", () => {
        const view = newView(LEARNING_LINK, c => [
            c.id,
            c.score
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            score: number | null;
        }>();
    });

    it("alias", () => {
        const view = newView(BOOK, c => [
            c.id.as("bookId"),
            c.name.as("bookName"),
            c.edition.as("bookEdition")
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            bookId: number;
            bookName: string;
            bookEdition: number;
        }>();
    });
});