import { createView } from "@/schema/view";
import { describe, expectTypeOf, it } from "vitest";
import { BOOK } from "../../model/model";
import { TypeOf } from "@/index";

describe("FoldTest", () => {

    it("simple", () => {
        const view = createView(BOOK, {
            $fold: {
                scalars: {
                    $allScalars: true
                },
                associations: {
                    store: true,
                    authors: true
                }
            }
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            scalars: {
                id: number;
                name: string;
                edition: number;
                price: number;
            };
            associations: {
                store: {
                    id: string;
                    name: string;
                    version: number;
                } | null;
                authors: {
                    id: number;
                    name: {
                        firstName: string;
                        lastName: string;
                    };
                    gender: "MALE" | "FEMALE";
                }[];
            };
        }>();
    });
});