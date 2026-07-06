import { createView } from "@/schema/view";
import { describe, expectTypeOf, it } from "vitest";
import { AUTHOR, BOOK } from "../../model/model";
import { TypeOf } from "@/index";

describe("FlatTest", () => {

    it("simple", () => {
        const view = createView(BOOK, {
            id: true,
            name: true,
            $flat: c => c({
                store: c => c({
                    version: true,
                    name: true
                })
            })
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            name: string;
            storeName: string | null;
            storeVersion: number | null;
        }>();
    });

    it("withEmptyPrefix", () => {
        const view = createView(AUTHOR, {
            id: true,
            $flat: c => c({
                name: {
                    prefix: ""
                }
            })
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            firstName: string;
            lastName: string;
        }>();
    });

    it("withEmptyPrefix", () => {
        const view = createView(AUTHOR, {
            id: true,
            $flat: c => c({
                name: {
                    prefix: "the"
                }
            })
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            theFirstName: string;
            theLastName: string;
        }>();
    });
});