import { describe, expectTypeOf, it } from "vitest";
import { BOOK, ORDER_ITEM } from "../../model/model";
import { dto, TypeOf } from "@/index";

describe("ReferenceKeyTest", () => {

    it("scalarKey", () => {
        const view = dto.view(BOOK, c => [
            c.id,
            c.storeId
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            storeId: string | null;
        }>();
    });

    it("embeddedKey", () => {
        const view = dto.view(ORDER_ITEM, c => [
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

    it("embeddedKeyWithBody", () => {
        const view = dto.view(ORDER_ITEM, c => [
            c.id,
            c.orderId.as("oid").with(c => [
                c.y.with(c => [
                    c.b
                ])
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            oid: {
                y: {
                    b: number;
                };
            };
        }>();
    });
});
