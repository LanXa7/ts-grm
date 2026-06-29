import { createView } from "@/schema/view";
import { describe, expectTypeOf, it } from "vitest";
import { BOOK, ORDER_ITEM } from "../../model/model";
import { TypeOf } from "@/index";
import { $ } from "@/schema/view/common";

describe("ReferenceTest", () => {

    it("simple", () => {
        const view = createView(BOOK, {
            id: true,
            name: true,
            edition: true,
            store: true
        });
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
        const view = createView(ORDER_ITEM, {
            id: true,
            order: $({
                id: { 
                    alias: "oid",
                    with: $({
                        x: true,
                        y: $({
                            b: true
                        })
                    })
                 },
                name: { alias: "oname"}
            })
        });
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
        const view = createView(ORDER_ITEM, {
            id: true,
            order: {
                where: table => table.id().x.lt(100),
                with: $({
                    id: { 
                        alias: "oid",
                        with: $({
                            x: true,
                            y: $({
                                b: true
                            })
                        })
                    },
                    name: { alias: "oname"}
                }),
            }
        });
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