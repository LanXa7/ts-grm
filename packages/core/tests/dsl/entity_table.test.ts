import { Entity } from "@/index";
import { AUTHOR, BOOK } from "../model/model";
import { describe, it } from "vitest";

describe("RuntimeTableTest", () => {

    it("book", () => {
        const table = Entity.of(BOOK).table(undefined);
        console.log(table.constructor.toString());
    });

    it("author", () => {
        const table = Entity.of(AUTHOR).table(undefined);
        console.log(table.constructor.toString());
    });
});