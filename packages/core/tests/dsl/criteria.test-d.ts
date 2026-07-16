import { SqlClient } from "@/dsl/sql_client";
import { test } from "vitest";
import { BOOK } from "../model/model";
import { expectTypeOf } from "vitest";
import { newView } from "@/schema/dto/local_api";

function sqlClient(): SqlClient {
    throw new Error("Not implemented");
}

const SIMPLE_BOOK_VIEW = newView(BOOK, c => [
    c.$allScalars.exclude("price")
]);

test("TestCriteria", async () => {
    const view = await sqlClient().findOne(SIMPLE_BOOK_VIEW, {
        $or: [
            { name: { $icontains: "graphql" } },
            { name: { $icontains: "typescript"} }
        ],
        price: { $gte: 10, $lteIf: undefined },
        store: { $isNull: false },
        authors: { 
            $none: {
                name: {
                    $or: {
                        firstName: "unkonwn",
                        lastName: "unkown"
                    }
                }
            }
        }
    });
    expectTypeOf<typeof view>().toEqualTypeOf<{
        id: number;
        name: string;
        edition: number;
    }>();
});
