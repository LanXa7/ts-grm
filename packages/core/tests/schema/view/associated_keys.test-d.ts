import { describe, it, expectTypeOf } from "vitest";
import { BOOK, ORDER } from "../../model/model";
import { TypeOf } from "@/index";
import { newView } from "@/schema/dto/index";

describe("AssociatedKeysTest", () => {

    it("scalarKey", () => {
        const view = newView(BOOK, c => [
            c.id,
            c.storeId,
            c.$associatedKeys("authors", "authorIds")
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            storeId: string | null;
            authorIds: number[];
        }>();
    });

    it("embeddedKeys", () => {
        const view = newView(ORDER, c => [
            c.id,
            c.$associatedKeys("tags", "tagIds"),
            c.$associatedKeys("comments", "commentIds")
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: {
                x: number;
                y: {
                    a: number;
                    b: number;
                };
            };
            tagIds: {
                low: number;
                high: number;
            }[];
            commentIds: number[];
        }>();
    });
});