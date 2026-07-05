import { createView } from "@/schema/view";
import { describe, expectTypeOf, it } from "vitest";
import { BOOK, ORDER_ITEM } from "../../model/model";
import { TypeOf } from "@/index";

describe("ReferenceKeyTest", () => {

    it("scalarKey", () => {
        const view = createView(BOOK, {
            id: true,
            storeId: true
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            storeId: string | null;
        }>();
    });

    it("embeddedKey", () => {
        const view = createView(ORDER_ITEM, {
            id: true,
            orderId: { alias: "oid" }
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            oid: {
                x: number;
                y: {
                    a: number;
                    b: number;
                };
            };
        }>();
    });
});
