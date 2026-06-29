import { createView } from "@/schema/view";
import { describe, it } from "node:test";
import { AUTHOR } from "../../model/model";
import { expectTypeOf } from "vitest";
import { TypeOf } from "@/index";
import { $ } from "@/schema/view/common";

describe("EmbeddedTest", () => {

    it("simple", () => {
        const view = createView(AUTHOR, {
            id: true,
            name: true
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            name: {
                firstName: string;
                lastName: string;
            };
        }>();
    });

    it("nested", () => {
        const view = createView(AUTHOR, {
            id: true,
            name: $({
                firstName: true
            })
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            name: {
                firstName: string;
            };
        }>();
    });

    it("aliases", () => {
        const view = createView(AUTHOR, {
            id: true,
            name: {
                alias: "full",
                with: $({
                    firstName: { alias: "first" },
                    lastName: { alias: "last" }
                })
            }
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            full: {
                first: string;
                last: string;
            };
        }>();
    });
});