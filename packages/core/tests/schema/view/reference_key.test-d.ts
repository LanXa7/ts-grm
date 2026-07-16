import { describe, expectTypeOf, it } from "vitest";
import { BOOK, ORDER_ITEM } from "../../model/model";
import { TypeOf } from "@/index";
import { newView } from "@/schema/dto/local_api";

describe("ReferenceKeyTest", () => {

    it("scalarKey", () => {
        const view = newView(BOOK, c => [
            c.id,
            c.storeId
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            storeId: string | null;
        }>();
    });

    it("embeddedKey", () => {
        const view = newView(ORDER_ITEM, c => [
            c.id,
            c.orderId.as("oid")
        ]);
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
