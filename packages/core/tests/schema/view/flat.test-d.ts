import { describe, expectTypeOf, it } from "vitest";
import { AUTHOR, BOOK } from "../../model/model";
import { TypeOf } from "@/index";
import { newView } from "@/schema/dto/index";

describe("FlatTest", () => {

    it("simple", () => {
        const view = newView(BOOK, c => [
            c.id,
            c.name,
            c.$flat("store").with(c => [
                c.name,
                c.version
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            name: string;
            storeName: string | null;
            storeVersion: number | null;
        }>();
    });

    it("withEmptyPrefix", () => {
        const view = newView(AUTHOR, c => [
            c.id,
            c.$flat("name").prefix("")
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            firstName: string;
            lastName: string;
        }>();
    });

    it("withPrefix", () => {
        const view = newView(AUTHOR, c => [
            c.id,
            c.$flat("name").prefix("the")
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            theFirstName: string;
            theLastName: string;
        }>();
    });
});