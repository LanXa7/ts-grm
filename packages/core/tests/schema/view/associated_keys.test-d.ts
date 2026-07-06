import { createView } from "@/schema/view";
import { describe, it, expectTypeOf } from "vitest";
import { BOOK, ORDER } from "../../model/model";
import { TypeOf } from "@/index";

describe("AssociatedKeysTest", () => {

    it("scalarKey", () => {
        const view = createView(BOOK, {
            id: true,
            $associatedKeys: c => c({
                store: true,
                authors: { alias: "authorIds" }
            })
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            storeId: string | null;
            authorIds: number[];
        }>();
    });

    it("embeddedKeys", () => {
        const view = createView(ORDER, {
            id: true,
            $associatedKeys: c => c({
                tags: { alias: "tagIds" },
                comments: { alias: "commentIds" }
            })
        });
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