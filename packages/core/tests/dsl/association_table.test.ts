import { dsl, Table } from "@/dsl";
import { Entity } from "@/impl";
import { describe, it } from "vitest";
import { BOOK } from "../model/model";

describe("AssociationTableTest", () => {

    it("association", () => {
        const model = dsl.associationModel(BOOK, "authors");
        const table = Entity
            .of(BOOK)
            .association("authors")
            .table(undefined) as any as Table<typeof model>;
        console.log(table);
    });
});