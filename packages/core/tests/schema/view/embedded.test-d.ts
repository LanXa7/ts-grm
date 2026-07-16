import { describe, it } from "node:test";
import { AUTHOR } from "../../model/model";
import { expectTypeOf } from "vitest";
import { dto, TypeOf } from "@/index";

describe("EmbeddedTest", () => {

    it("simple", () => {
        const view = dto.view(AUTHOR, c => [
            c.id,
            c.name
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            name: {
                firstName: string;
                lastName: string;
            };
        }>();
    });

    it("nested", () => {
        const view = dto.view(AUTHOR, c => [
            c.id,
            c.name.with(c => [
                c.firstName
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            name: {
                firstName: string;
            };
        }>();
    });

    it("aliases", () => {
        const view = dto.view(AUTHOR, c => [
            c.id,
            c.name.as("full").with(c => [
                c.firstName.as("first"),
                c.lastName.as("last")
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            full: {
                first: string;
                last: string;
            };
        }>();
    });
});