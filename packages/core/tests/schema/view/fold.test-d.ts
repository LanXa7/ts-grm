import { describe, expectTypeOf, it } from "vitest";
import { BOOK } from "../../model/model";
import { TypeOf } from "@/index";
import { newView } from "@/schema/dto/local_api";

describe("FoldTest", () => {

    it("simple", () => {
        const view = newView(BOOK, c => [
            c.$fold("scalars", c => [
                c.$allScalars
            ]),
            c.$fold("associations", c => [
                c.store,
                c.authors
            ])
        ]);
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