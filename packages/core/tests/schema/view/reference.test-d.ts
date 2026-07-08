import { describe, expectTypeOf, it } from "vitest";
import { BOOK, ORDER_ITEM } from "../../model/model";
import { TypeOf } from "@/index";
import { newView } from "@/schema/dto/index";

describe("ReferenceTest", () => {

    it("simple", () => {
        const view = newView(BOOK, c => [
            c.id,
            c.name,
            c.edition,
            c.store
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            edition: number;
            name: string;
            store: {
                id: string;
                name: string;
                version: number;
            } | null;
        }>();
    });

    it("withoutFilter", () => {
        const view = newView(ORDER_ITEM, c => [
            c.id,
            c.order.with(c => [
                c.id.as("oid").with(c => [
                    c.x,
                    c.y.with(c => [
                        c.b
                    ])
                ]),
                c.name.as("oname")
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            order: {
                oid: {
                    x: number;
                    y: {
                        b: number;
                    };
                };
                oname: number;
            };
        }>();
    });

    it("withFilter", () => {
        const view = newView(ORDER_ITEM, c => [
            c.id,
            c.order.where(
                table => table.id().x.lt(100)
            ).with(c => [
                c.id.as("oid").with(c => [
                    c.x,
                    c.y.with(c => [
                        c.b
                    ])
                ]),
                c.name.as("oname")
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            order: {
                oid: {
                    x: number;
                    y: {
                        b: number;
                    };
                };
                oname: number;
            } | null;
        }>();
    });
});