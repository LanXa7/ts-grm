import { Column, Entity, UPPER_SNAKE_CASE_DATABASE_NAMING_STRATEGY } from "@/impl";
import { describe, expect, it, JestAssertion } from "vitest";
import { AUTHOR, BOOK, ORDER, TAG } from "../model/model";

describe("AssociationEntityTest", () => {

    function expectColumns(columns: ReadonlyArray<Column> | undefined): JestAssertion {
        if (columns == null) {
            return expect(undefined);
        }
        function columnJson(column: Column): any {
            if (column.referencedProp == null) {
                return column;
            }
            return {
                ...column,
                referencedProp: column.referencedProp.toString()
            }
        }
        return expect(columns.map(c => columnJson(c)));
    }

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
        expect(sourceProp.toColumns(strategy)).toEqual(undefined);
        expect(targetProp.toColumns(strategy)).toEqual(undefined);
        expectColumns(sourceKeyProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "BOOK_ID",
                "referencedColumnName": "ID",
                "referencedProp": "Book.id",
            },
        ]);
        expectColumns(targetKeyProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "AUTHOR_ID",
                "referencedColumnName": "ID",
                "referencedProp": "Author.id",
            },
        ]);
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
        expect(sourceProp.toColumns(strategy)).toEqual(undefined);
        expect(targetProp.toColumns(strategy)).toEqual(undefined);
        expectColumns(sourceKeyProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "AUTHOR_ID",
                "referencedColumnName": "ID",
                "referencedProp": "Author.id",
            },
        ]);
        expectColumns(targetKeyProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "BOOK_ID",
                "referencedColumnName": "ID",
                "referencedProp": "Book.id",
            },
        ]);
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
        expectColumns(sourceKeyProp.toColumns(strategy)).toEqual([
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
        ]);
        expectColumns(sourceKeyXProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "order_x",
                "referencedColumnName": "X",
                "referencedProp": "Order.id.x"
            }
        ]);
        expectColumns(sourceKeyYProp.toColumns(strategy)).toEqual([
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
        ]);
        expectColumns(sourceKeyYAProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "order_y_a",
                "referencedColumnName": "A",
                "referencedProp": "Order.id.y.a"
            }
        ]);
        expectColumns(sourceKeyYBProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "order_y_b",
                "referencedColumnName": "B",
                "referencedProp": "Order.id.y.b"
            }
        ]);

        const targetKeyLowProp = entity.prop("targetId.low");
        const targetKeyHightProp = entity.prop("targetId.high");
        expectColumns(targetKeyProp.toColumns(strategy)).toEqual([
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
        ]);
        expectColumns(targetKeyLowProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "tag_low",
                "referencedColumnName": "LOW",
                "referencedProp": "Tag.id.low"
            }
        ]);
        expectColumns(targetKeyHightProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "tag_high",
                "referencedColumnName": "HIGH",
                "referencedProp": "Tag.id.high"
            },
        ]);
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
        expectColumns(sourceKeyProp.toColumns(strategy)).toEqual([
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
        ]);
        expectColumns(sourceKeyLowProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "tag_low",
                "referencedColumnName": "LOW",
                "referencedProp": "Tag.id.low"
            }
        ]);
        expectColumns(sourceKeyHightProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "tag_high",
                "referencedColumnName": "HIGH",
                "referencedProp": "Tag.id.high"
            },
        ]);

        const targetKeyXProp = entity.prop("targetId.x");
        const targetKeyYProp = entity.prop("targetId.y");
        const targetKeyYAProp = entity.prop("targetId.y.a");
        const targetKeyYBProp = entity.prop("targetId.y.b");
        expectColumns(targetKeyProp.toColumns(strategy)).toEqual([
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
        ]);
        expectColumns(targetKeyXProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "order_x",
                "referencedColumnName": "X",
                "referencedProp": "Order.id.x"
            }
        ]);
        expectColumns(targetKeyYProp.toColumns(strategy)).toEqual([
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
        ]);
        expectColumns(targetKeyYAProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "order_y_a",
                "referencedColumnName": "A",
                "referencedProp": "Order.id.y.a"
            }
        ]);
        expectColumns(targetKeyYBProp.toColumns(strategy)).toEqual([
            {
                "kind": "COLUMN",
                "name": "order_y_b",
                "referencedColumnName": "B",
                "referencedProp": "Order.id.y.b"
            }
        ]);
    });
});