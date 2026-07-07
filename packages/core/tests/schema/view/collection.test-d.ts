import { describe, expectTypeOf, it } from "vitest";
import { BOOK, BOOK_STORE } from "../../model/model";
import { TypeOf } from "@/index";
import { newView } from "@/schema/dto/index";

describe("CollectionTest", () => {

    it("simple", () => {
        const view = newView(BOOK_STORE, c => [
            c.id,
            c.books
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: string;
            books: {
                id: number;
                name: string;
                edition: number;
                price: number;
            }[];
        }>();
    });

    it("with", () => {
        const view = newView(BOOK, c => [
            c.id,
            c.authors.with(c => [
                c.id,
                c.gender
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            authors: {
                id: number;
                gender: "MALE" | "FEMALE";
            }[];
        }>();
    });
});