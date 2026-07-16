import { describe, expectTypeOf, it } from "vitest";
import { BOOK } from "../../model/model";
import { dto, TypeOf } from "@/index";

describe("FoldTest", () => {

    it("simple", () => {
        const view = dto.view(BOOK, c => [
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