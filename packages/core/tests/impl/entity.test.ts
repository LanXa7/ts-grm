import { Entity } from "@/impl/entity";
import { PAPER_BOOK, ORDER_ITEM, BOOK, AUTHOR, TREE_NODE, BOOK_STORE } from "../model/model";
import { describe, expect, it, JestAssertion } from "vitest";
import { makeErr } from "@/error/util";
import { Column, PropStorage, UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY } from "@/impl";

describe("EntityTest", () => {

    function expectStorage(storage: PropStorage | undefined): JestAssertion {
        if (storage == null) {
            return expect(undefined);
        }
        function columnJson(column: Column): any {
            if (column.referencedSubProp == null) {
                return column;
            }
            return {
                ...column,
                referencedSubProp: column.referencedSubProp.toString()
            }
        }
        const json = storage.kind === "COLUMNS"
            ? {
                kind: "COLUMNS",
                arr: storage.map(columnJson)
            }
            : storage.kind === "MIDDLE_TABLE" 
                ? {
                    ...storage,
                    toThisColumns: storage.toThisColumns.map(columnJson),
                    toTargetColumns: storage.toTargetColumns.map(columnJson)
                }
                : columnJson(storage);
        return expect(json);
    }

    it("entityWithSimpleColumns", () => {
        const paperBookEntity = Entity.of(PAPER_BOOK);
        expect(
            [...paperBookEntity.declaredPropMap.keys()].sort()
        ).toEqual(
            ["size"].sort()
        );
        expect(
            [...paperBookEntity.allPropMap.keys()].sort()
        ).toEqual(
            ["id", "name", "edition", "price", "store", "storeId", "authors", "size"].sort()
        ); 
        expect(
            [...paperBookEntity.expandedPropMap.keys()].sort()
        ).toEqual(
            ["id", "name", "edition", "price", "store", "storeId", "authors", 
                "size", "size.width", "size.height"].sort()
        ); 

        const bookDotStore = paperBookEntity.prop("store");
        const storeEntity = bookDotStore.targetEntity ?? 
            makeErr("Book.store.targetEntity is undefined");
        const storeDotBooks = storeEntity.prop("books") ?? 
            makeErr("store.books is undefined");
        expect(storeDotBooks).toBeDefined();
        expect(bookDotStore.oppositeProp).toEqual(storeDotBooks);
        expect(storeDotBooks.oppositeProp).toEqual(bookDotStore);
        expect(storeDotBooks.orders).toEqual([
            { 
                prop: paperBookEntity.superEntity!.expandedPropMap.get("name"),
                desc: false,
                nulls: "UNSPECIFIED"
            },
            { 
                prop: paperBookEntity.superEntity!.expandedPropMap.get("edition"),
                desc: true,
                nulls: "UNSPECIFIED"
            }
        ]);

        const bookDotAuthors = paperBookEntity.allPropMap.get("authors") ??
            makeErr("Book.authors is undefined");
        const authorModel = bookDotAuthors?.targetEntity ??
            makeErr("Book.authors.targetEntity is undefined");
        const authorDotBooks = authorModel.allPropMap.get("books") ??
            makeErr("Author.books is undefined");
        expect(bookDotAuthors.oppositeProp).toEqual(authorDotBooks);
        expect(authorDotBooks.oppositeProp).toEqual(bookDotAuthors);
        expect(bookDotAuthors.orders).toEqual([
            {
                prop: authorModel.expandedPropMap.get("name.firstName"),
                desc: false,
                nulls: "UNSPECIFIED"
            },
            {
                prop: authorModel.expandedPropMap.get("name.lastName"),
                desc: false,
                nulls: "UNSPECIFIED"
            }
        ]);
    });

    it("entityWithEmbeddedColumns", () => {
        const orderItemEntity = Entity.of(ORDER_ITEM);
        const order = orderItemEntity.allPropMap.get("order") ??
            makeErr(`No property named "order"`);
        const orderId = orderItemEntity.allPropMap.get("orderId") ??
            makeErr(`No property named "orderId"`);
        expect(order.referenceKeyProp).toEqual(orderId);
        expect(orderId.referenceProp).toEqual(order);
        expect(Array.from(orderId.props!.keys())).toEqual(["x", "y"]);
        expect(Array.from(orderItemEntity.allPropMap.keys())).toEqual([
            "id",
            "order",
            "orderId"
        ]);
        expect(Array.from(orderItemEntity.expandedPropMap.keys())).toEqual([
            "id",
            "order",
            "orderId",
            "orderId.x",
            "orderId.y",
            "orderId.y.a",
            "orderId.y.b"
        ]);
    });

    it("entityConfigurer", () => {
        const bookEntity = Entity.of(BOOK);
        expect(bookEntity.toTableName(UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY)).toEqual("BOOK");
        expect(bookEntity.uniqueContraints.length).toEqual(1);
        expect(bookEntity.uniqueContraints[0]!.map(c => c.name)).toEqual(["name", "edition"]);

        const authorEntity = Entity.of(AUTHOR);
        expect(authorEntity.uniqueContraints.length).toEqual(1);
        expect(authorEntity.uniqueContraints[0]!.map(c => c.name)).toEqual(["firstName", "lastName"]);

        const treeNodeEntity = Entity.of(TREE_NODE);
        expect(treeNodeEntity.uniqueContraints.length).toEqual(1);
        expect(treeNodeEntity.uniqueContraints[0]!.map(c => c.name)).toEqual(["name", "parentNode"]);
    });

    it("storage", () => {

        const strategy = UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY;

        const storeEntity = Entity.of(BOOK_STORE);
        expect(storeEntity.prop("id").toStorage(strategy)).toEqual({
            kind: "COLUMN",
            name: "ID"
        });
        expect(storeEntity.prop("name").toStorage(strategy)).toEqual({
            kind: "COLUMN",
            name: "NAME"
        });
        expect(storeEntity.prop("version").toStorage(strategy)).toEqual({
            kind: "COLUMN",
            name: "VERSION"
        });
        expect(storeEntity.prop("books").toStorage(strategy)).toEqual(undefined);

        const bookEntity = Entity.of(BOOK);
        expect(bookEntity.prop("id").toStorage(strategy)).toEqual({
            kind: "COLUMN",
            name: "ID"
        });
        expect(bookEntity.prop("name").toStorage(strategy)).toEqual({
            kind: "COLUMN",
            name: "NAME"
        });
        expect(bookEntity.prop("edition").toStorage(strategy)).toEqual({
            kind: "COLUMN",
            name: "EDITION"
        });
        expect(bookEntity.prop("price").toStorage(strategy)).toEqual({
            kind: "COLUMN",
            name: "PRICE"
        });
        expect(bookEntity.prop("store").toStorage(strategy)).toEqual({
            kind: "COLUMN",
            name: "STORE_ID"
        });
        expect(bookEntity.prop("storeId").toStorage(strategy)).toEqual({
            kind: "COLUMN",
            name: "STORE_ID"
        });
        expectStorage(bookEntity.prop("authors").toStorage(strategy)!).toEqual({
            "kind": "MIDDLE_TABLE",
            "name": "book_author_mapping",
            "toThisColumns": [
                {
                    "kind": "COLUMN",
                    "name": "BOOK_ID",
                    "referencedSubProp": undefined,
                },
            ],
            "toTargetColumns": [
                {
                    "kind": "COLUMN",
                    "name": "AUTHOR_ID",
                    "referencedSubProp": undefined,
                },
            ]
        });

        const authorEntity = Entity.of(AUTHOR);
        expect(authorEntity.prop("id").toStorage(strategy)).toEqual({
            kind: "COLUMN",
            name: "ID"
        });
        expect(authorEntity.prop("name").toStorage(strategy)!.kind).toEqual("COLUMNS");
        expectStorage(authorEntity.prop("name").toStorage(strategy)!).toEqual({
            kind: "COLUMNS",
            arr: [
                {
                    "kind": "COLUMN",
                    "name": "FIRST_NAME",
                    "referencedSubProp": undefined
                },
                {
                    "kind": "COLUMN",
                    "name": "LAST_NAME",
                    "referencedSubProp": undefined
                },
            ]
        });
        expect(authorEntity.prop("name.firstName").toStorage(strategy)).toEqual({
            kind: "COLUMN",
            name: "FIRST_NAME"
        });
        expect(authorEntity.prop("name.lastName").toStorage(strategy)).toEqual({
            kind: "COLUMN",
            name: "LAST_NAME"
        });
        expectStorage(authorEntity.prop("books").toStorage(strategy)!).toEqual({
            "kind": "MIDDLE_TABLE",
            "name": "book_author_mapping",
            "toThisColumns": [
                {
                "kind": "COLUMN",
                "name": "AUTHOR_ID",
                "referencedSubProp": undefined,
                },
            ],
            "toTargetColumns": [
                {
                "kind": "COLUMN",
                "name": "BOOK_ID",
                "referencedSubProp": undefined,
                },
            ]
        });

        const orderItemEntity = Entity.of(ORDER_ITEM);
        expect(orderItemEntity.prop("id").toStorage(strategy)).toEqual({
            kind: "COLUMN",
            name: "ID"
        });
        expectStorage(orderItemEntity.prop("order").toStorage(strategy)).toEqual({
            "kind": "COLUMNS",
            "arr": [
                {
                    "kind": "COLUMN",
                    "name": "order_x",
                    "referencedSubProp": "Order.id.x",
                },
                {
                    "kind": "COLUMN",
                    "name": "order_y_a",
                    "referencedSubProp": "Order.id.y.a",
                },
                {
                    "kind": "COLUMN",
                    "name": "order_y_b",
                    "referencedSubProp": "Order.id.y.b",
                },
            ]
        });
        expectStorage(orderItemEntity.prop("orderId").toStorage(strategy)!).toEqual({
            "kind": "COLUMNS",
            "arr": [
                {
                    "kind": "COLUMN",
                    "name": "order_x",
                    "referencedSubProp": "Order.id.x",
                },
                {
                    "kind": "COLUMN",
                    "name": "order_y_a",
                    "referencedSubProp": "Order.id.y.a",
                },
                {
                    "kind": "COLUMN",
                    "name": "order_y_b",
                    "referencedSubProp": "Order.id.y.b",
                },
            ]
        });
    });
});