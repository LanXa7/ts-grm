import { UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY, LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY } from "@/impl/strategy";
import { BOOK } from "../model/model";
import { describe, expect, it } from "vitest";
import { Entity } from "@/impl/entity";

describe("DatabaseNamingStrategyTest", () => {

    it("upper", () => {
        const book = Entity.of(BOOK);
        const storeProp = book.allPropMap.get("store")!;
        const store = storeProp.targetEntity!;
        const authorsProp = book.allPropMap.get("authors")!;
        const author = authorsProp.targetEntity!;
        const booksProp = author.allPropMap.get("books")!!;

        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.tableName(book)
        ).toEqual("BOOK");
        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.tableName(store)
        ).toEqual("BOOK_STORE");
        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.tableName(author)
        ).toEqual("AUTHOR");

        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.sequenceName(book)
        ).toEqual("BOOK_ID_SEQ");
        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.sequenceName(store)
        ).toEqual("BOOK_STORE_ID_SEQ");
        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.sequenceName(author)
        ).toEqual("AUTHOR_ID_SEQ");

        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.columnName(
                author.expandedPropMap.get("name.firstName")!
            )
        ).toEqual("FIRST_NAME");
        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.columnName(
                author.expandedPropMap.get("name.lastName")!
            )
        ).toEqual("LAST_NAME");

        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.columnName(storeProp)
        ).toEqual("STORE");

        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.middleTableName(authorsProp)
        ).toEqual("BOOK_AUTHOR_MAPPING");
        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.middleTableThisRefColumnName(authorsProp)
        ).toEqual("BOOK_ID");
        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.middleTableTargetRefColumnName(authorsProp)
        ).toEqual("AUTHOR_ID");

        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.middleTableName(booksProp)
        ).toEqual("AUTHOR_BOOK_MAPPING");
        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.middleTableThisRefColumnName(booksProp)
        ).toEqual("AUTHOR_ID");
        expect(
            UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.middleTableTargetRefColumnName(booksProp)
        ).toEqual("BOOK_ID");
    });

    it("lower", () => {
        const book = Entity.of(BOOK);
        const storeProp = book.allPropMap.get("store")!;
        const store = storeProp.targetEntity!;
        const authorsProp = book.allPropMap.get("authors")!;
        const author = authorsProp.targetEntity!;
        const booksProp = author.allPropMap.get("books")!!;

        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.tableName(book)
        ).toEqual("book");
        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.tableName(store)
        ).toEqual("book_store");
        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.tableName(author)
        ).toEqual("author");

        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.sequenceName(book)
        ).toEqual("book_id_seq");
        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.sequenceName(store)
        ).toEqual("book_store_id_seq");
        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.sequenceName(author)
        ).toEqual("author_id_seq");

        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.columnName(
                author.expandedPropMap.get("name.firstName")!
            )
        ).toEqual("first_name");
        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.columnName(
                author.expandedPropMap.get("name.lastName")!
            )
        ).toEqual("last_name");

        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.columnName(storeProp)
        ).toEqual("store");

        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.middleTableName(authorsProp)
        ).toEqual("book_author_mapping");
        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.middleTableThisRefColumnName(authorsProp)
        ).toEqual("book_id");
        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.middleTableTargetRefColumnName(authorsProp)
        ).toEqual("author_id");

        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.middleTableName(booksProp)
        ).toEqual("author_book_mapping");
        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.middleTableThisRefColumnName(booksProp)
        ).toEqual("author_id");
        expect(
            LOWER_SNAKE_CASE_DATABASE_NAMING_STRATEGY.middleTableTargetRefColumnName(booksProp)
        ).toEqual("book_id");
    });
});