import { createView } from "@/schema/view";
import { describe, it } from "node:test";
import { AUTHOR } from "../../model/model";
import { expectTypeOf } from "vitest";
import { AllModelMembers, TypeOf } from "@/index";
import { RemoveableKeys } from "@/schema/view/all_scalars";

describe("AllScalarsTest", () => {

    it("simple", () => {
        const view = createView(AUTHOR, { $allScalars: true });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            name: {
                firstName: string;
                lastName: string;
            };
            gender: "FEMALE" | "MALE";
        }>();
    });

    it("exclude", () => {
        expectTypeOf<RemoveableKeys<AllModelMembers<typeof AUTHOR>>>()
            .toEqualTypeOf<"id" | "name" | "gender">();
        const view = createView(AUTHOR, { 
            $allScalars: {
                exclude: "gender"
            }
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            name: {
                firstName: string;
                lastName: string;
            };
        }>();
    });

    it("excludeArr", () => {
        expectTypeOf<RemoveableKeys<AllModelMembers<typeof AUTHOR>>>()
            .toEqualTypeOf<"id" | "name" | "gender">();
        const view = createView(AUTHOR, { 
            $allScalars: {
                exclude: ["gender", "id"]
            }
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            name: {
                firstName: string;
                lastName: string;
            };
        }>();
    });
});