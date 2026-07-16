import { describe, expectTypeOf, it } from "vitest";
import { BOOK, BOOK_STORE } from "../../model/model";
import { dto, TypeOf } from "@/index";

describe("CollectionTest", () => {

    it("simple", () => {
        const view = dto.view(BOOK_STORE, c => [
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
        const view = dto.view(BOOK, c => [
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