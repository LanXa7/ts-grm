import { Entity, UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY } from "@/impl";
import { describe, expect, it } from "vitest";
import { AUTHOR, BOOK, ORDER, TAG } from "../model/model";
import { expectStorage } from "./utils";

describe("AssociationEntityTest", () => {

    it("associationEntity", () => {
        const entity = Entity.of(BOOK).association("authors");
        expect(entity).toBe(Entity.of(BOOK).association("authors"));
        expect(Array.from(entity.expandedProps.keys())).toEqual([
            "source", "target", "sourceId", "targetId"
        ]);
        
        const sourceProp = entity.sourceProp;
        const targetProp = entity.targetProp;
        const sourceKeyProp = entity.sourceKeyProp;
        const targetKeyProp = entity.targetKeyProp;
        expect(sourceProp.toString()).toEqual("MiddleTable(Book.authors).source");
        expect(targetProp.toString()).toEqual("MiddleTable(Book.authors).target");
        expect(sourceKeyProp.toString()).toEqual("MiddleTable(Book.authors).sourceId");
        expect(targetKeyProp.toString()).toEqual("MiddleTable(Book.authors).targetId");
        expect(sourceProp.referenceKeyProp).toBe(sourceKeyProp);
        expect(sourceProp.referenceProp).toBe(undefined);
        expect(targetProp.referenceKeyProp).toBe(targetKeyProp);
        expect(targetProp.referenceProp).toBe(undefined);
        expect(sourceKeyProp.referenceKeyProp).toBe(undefined);
        expect(sourceKeyProp.referenceProp).toBe(sourceProp);
        expect(targetKeyProp.referenceKeyProp).toBe(undefined);
        expect(targetKeyProp.referenceProp).toBe(targetProp);
       
        const strategy = UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY;
        expectStorage(sourceProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "BOOK_ID",
            "referencedColumnName": "ID",
            "referencedProp": "Book.id",
        });
        expectStorage(targetProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "AUTHOR_ID",
            "referencedColumnName": "ID",
            "referencedProp": "Author.id",
        });
        expectStorage(sourceKeyProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "BOOK_ID",
            "referencedColumnName": "ID",
            "referencedProp": "Book.id",
        });
        expectStorage(targetKeyProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "AUTHOR_ID",
            "referencedColumnName": "ID",
            "referencedProp": "Author.id",
        });
    });

    it("inverseAssociationEntity", () => {
        const entity = Entity.of(AUTHOR).association("books");
        expect(entity).toBe(Entity.of(AUTHOR).association("books"));
        expect(Array.from(entity.expandedProps.keys())).toEqual([
            "source", "target", "sourceId", "targetId"
        ]);
        
        const sourceProp = entity.sourceProp;
        const targetProp = entity.targetProp;
        const sourceKeyProp = entity.sourceKeyProp;
        const targetKeyProp = entity.targetKeyProp;
        expect(sourceProp.toString()).toEqual("MiddleTable(Author.books).source");
        expect(targetProp.toString()).toEqual("MiddleTable(Author.books).target");
        expect(sourceKeyProp.toString()).toEqual("MiddleTable(Author.books).sourceId");
        expect(targetKeyProp.toString()).toEqual("MiddleTable(Author.books).targetId");
        expect(sourceProp.referenceKeyProp).toBe(sourceKeyProp);
        expect(sourceProp.referenceProp).toBe(undefined);
        expect(targetProp.referenceKeyProp).toBe(targetKeyProp);
        expect(targetProp.referenceProp).toBe(undefined);
        expect(sourceKeyProp.referenceKeyProp).toBe(undefined);
        expect(sourceKeyProp.referenceProp).toBe(sourceProp);
        expect(targetKeyProp.referenceKeyProp).toBe(undefined);
        expect(targetKeyProp.referenceProp).toBe(targetProp);
       
        const strategy = UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY;
        expectStorage(sourceProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "AUTHOR_ID",
            "referencedColumnName": "ID",
            "referencedProp": "Author.id",
        });
        expectStorage(targetProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "BOOK_ID",
            "referencedColumnName": "ID",
            "referencedProp": "Book.id",
        });
        expectStorage(sourceKeyProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "AUTHOR_ID",
            "referencedColumnName": "ID",
            "referencedProp": "Author.id",
        });
        expectStorage(targetKeyProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "BOOK_ID",
            "referencedColumnName": "ID",
            "referencedProp": "Book.id",
        });
    });

    it("multiColumnsAssociationEntity", () => {
        const entity = Entity.of(ORDER).association("tags");
        expect(entity).toBe(Entity.of(ORDER).association("tags"));
        expect(Array.from(entity.expandedProps.keys())).toEqual([
            "source", "target", 
            "sourceId", "sourceId.x", "sourceId.y", "sourceId.y.a", "sourceId.y.b",   
            "targetId", "targetId.low", "targetId.high"
        ]);

        const sourceProp = entity.sourceProp;
        const targetProp = entity.targetProp;
        const sourceKeyProp = entity.sourceKeyProp;
        const targetKeyProp = entity.targetKeyProp;
        expect(sourceProp.toString()).toEqual("MiddleTable(Order.tags).source");
        expect(targetProp.toString()).toEqual("MiddleTable(Order.tags).target");
        expect(sourceKeyProp.toString()).toEqual("MiddleTable(Order.tags).sourceId");
        expect(targetKeyProp.toString()).toEqual("MiddleTable(Order.tags).targetId");
        expect(sourceProp.referenceKeyProp).toBe(sourceKeyProp);
        expect(sourceProp.referenceProp).toBe(undefined);
        expect(targetProp.referenceKeyProp).toBe(targetKeyProp);
        expect(targetProp.referenceProp).toBe(undefined);
        expect(sourceKeyProp.referenceKeyProp).toBe(undefined);
        expect(sourceKeyProp.referenceProp).toBe(sourceProp);
        expect(targetKeyProp.referenceKeyProp).toBe(undefined);

        const strategy = UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY;

        const sourceKeyXProp = entity.prop("sourceId.x");
        const sourceKeyYProp = entity.prop("sourceId.y");
        const sourceKeyYAProp = entity.prop("sourceId.y.a");
        const sourceKeyYBProp = entity.prop("sourceId.y.b");
        expectStorage(sourceKeyProp.toStorage(strategy)).toEqual({
            kind: "COLUMNS",
            arr: [
                {
                    "kind": "COLUMN",
                    "name": "order_x",
                    "referencedColumnName": "X",
                    "referencedProp": "Order.id.x",
                },
                {
                    "kind": "COLUMN",
                    "name": "order_y_a",
                    "referencedColumnName": "A",
                    "referencedProp": "Order.id.y.a",
                },
                {
                    "kind": "COLUMN",
                    "name": "order_y_b",
                    "referencedColumnName": "B",
                    "referencedProp": "Order.id.y.b"
                },
            ]
        });
        expectStorage(sourceKeyXProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "order_x",
            "referencedColumnName": "X",
            "referencedProp": "Order.id.x"
        });
        expectStorage(sourceKeyYProp.toStorage(strategy)).toEqual({
            kind: "COLUMNS",
            arr: [
                {
                    "kind": "COLUMN",
                    "name": "order_y_a",
                    "referencedColumnName": "A",
                    "referencedProp": "Order.id.y.a"
                },
                {
                    "kind": "COLUMN",
                    "name": "order_y_b",
                    "referencedColumnName": "B",
                    "referencedProp": "Order.id.y.b"
                }
            ]
        });
        expectStorage(sourceKeyYAProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "order_y_a",
            "referencedColumnName": "A",
            "referencedProp": "Order.id.y.a"
        });
        expectStorage(sourceKeyYBProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "order_y_b",
            "referencedColumnName": "B",
            "referencedProp": "Order.id.y.b"
        });

        const targetKeyLowProp = entity.prop("targetId.low");
        const targetKeyHightProp = entity.prop("targetId.high");
        expectStorage(targetKeyProp.toStorage(strategy)).toEqual({
            kind: "COLUMNS",
            arr: [
                {
                    "kind": "COLUMN",
                    "name": "tag_low",
                    "referencedColumnName": "LOW",
                    "referencedProp": "Tag.id.low"
                },
                {
                    "kind": "COLUMN",
                    "name": "tag_high",
                    "referencedColumnName": "HIGH",
                    "referencedProp": "Tag.id.high"
                }
            ]
        });
        expectStorage(targetKeyLowProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "tag_low",
            "referencedColumnName": "LOW",
            "referencedProp": "Tag.id.low"
        });
        expectStorage(targetKeyHightProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "tag_high",
            "referencedColumnName": "HIGH",
            "referencedProp": "Tag.id.high"
        });
    });

    it("inverseMultiColumnsAssociationEntity", () => {
        const entity = Entity.of(TAG).association("orders");
        expect(entity).toBe(Entity.of(TAG).association("orders"));
        expect(Array.from(entity.expandedProps.keys())).toEqual([
            "source", "target", 
            "sourceId", "sourceId.low", "sourceId.high",
            "targetId", "targetId.x", "targetId.y", "targetId.y.a", "targetId.y.b"  
        ]);

        const sourceProp = entity.sourceProp;
        const targetProp = entity.targetProp;
        const sourceKeyProp = entity.sourceKeyProp;
        const targetKeyProp = entity.targetKeyProp;
        expect(sourceProp.toString()).toEqual("MiddleTable(Tag.orders).source");
        expect(targetProp.toString()).toEqual("MiddleTable(Tag.orders).target");
        expect(sourceKeyProp.toString()).toEqual("MiddleTable(Tag.orders).sourceId");
        expect(targetKeyProp.toString()).toEqual("MiddleTable(Tag.orders).targetId");
        expect(sourceProp.referenceKeyProp).toBe(sourceKeyProp);
        expect(sourceProp.referenceProp).toBe(undefined);
        expect(targetProp.referenceKeyProp).toBe(targetKeyProp);
        expect(targetProp.referenceProp).toBe(undefined);
        expect(sourceKeyProp.referenceKeyProp).toBe(undefined);
        expect(sourceKeyProp.referenceProp).toBe(sourceProp);
        expect(targetKeyProp.referenceKeyProp).toBe(undefined);

        const strategy = UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY;

        const sourceKeyLowProp = entity.prop("sourceId.low");
        const sourceKeyHightProp = entity.prop("sourceId.high");
        expectStorage(sourceKeyProp.toStorage(strategy)).toEqual({
            kind: "COLUMNS",
            arr: [
                {
                    "kind": "COLUMN",
                    "name": "tag_low",
                    "referencedColumnName": "LOW",
                    "referencedProp": "Tag.id.low"
                },
                {
                    "kind": "COLUMN",
                    "name": "tag_high",
                    "referencedColumnName": "HIGH",
                    "referencedProp": "Tag.id.high"
                }
            ]
        });
        expectStorage(sourceKeyLowProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "tag_low",
            "referencedColumnName": "LOW",
            "referencedProp": "Tag.id.low"
        });
        expectStorage(sourceKeyHightProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "tag_high",
            "referencedColumnName": "HIGH",
            "referencedProp": "Tag.id.high"
        });

        const targetKeyXProp = entity.prop("targetId.x");
        const targetKeyYProp = entity.prop("targetId.y");
        const targetKeyYAProp = entity.prop("targetId.y.a");
        const targetKeyYBProp = entity.prop("targetId.y.b");
        expectStorage(targetKeyProp.toStorage(strategy)).toEqual({
            kind: "COLUMNS",
            arr: [
                {
                    "kind": "COLUMN",
                    "name": "order_x",
                    "referencedColumnName": "X",
                    "referencedProp": "Order.id.x",
                },
                {
                    "kind": "COLUMN",
                    "name": "order_y_a",
                    "referencedColumnName": "A",
                    "referencedProp": "Order.id.y.a",
                },
                {
                    "kind": "COLUMN",
                    "name": "order_y_b",
                    "referencedColumnName": "B",
                    "referencedProp": "Order.id.y.b"
                },
            ]
        });
        expectStorage(targetKeyXProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "order_x",
            "referencedColumnName": "X",
            "referencedProp": "Order.id.x"
        });
        expectStorage(targetKeyYProp.toStorage(strategy)).toEqual({
            kind: "COLUMNS",
            arr: [
                {
                    "kind": "COLUMN",
                    "name": "order_y_a",
                    "referencedColumnName": "A",
                    "referencedProp": "Order.id.y.a"
                },
                {
                    "kind": "COLUMN",
                    "name": "order_y_b",
                    "referencedColumnName": "B",
                    "referencedProp": "Order.id.y.b"
                }
            ]
        });
        expectStorage(targetKeyYAProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "order_y_a",
            "referencedColumnName": "A",
            "referencedProp": "Order.id.y.a"
        });
        expectStorage(targetKeyYBProp.toStorage(strategy)).toEqual({
            "kind": "COLUMN",
            "name": "order_y_b",
            "referencedColumnName": "B",
            "referencedProp": "Order.id.y.b"
        });
    });
});