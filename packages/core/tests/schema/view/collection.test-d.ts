import { createView } from "@/schema/view";
import { describe, expectTypeOf, it } from "vitest";
import { BOOK, BOOK_STORE } from "../../model/model";
import { TypeOf } from "@/index";
import { $ } from "@/schema/view/common";

describe("CollectionTest", () => {

    it("simple", () => {
        const view = createView(BOOK_STORE, {
            id: true,
            books: true
        });
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
        const view = createView(BOOK, {
            id: true,
            authors: $({
                id: true,
                gender: true
            })
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            authors: {
                id: number;
                gender: "MALE" | "FEMALE";
            }[];
        }>();
    });
});