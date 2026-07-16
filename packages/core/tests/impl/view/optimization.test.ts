import { describe, it, expect } from "vitest";
import { AUTHOR, BOOK, BOOK_STORE, ORDER, ORDER_ITEM, STUDENT } from "../../model/model";
import { dto } from "@/index";

describe("OptimizationTest", () => {
    
    it("m2o", () => {
        const view1 = dto.view(BOOK, c => [
            c.$allScalars,
            c.store.with(c => [c.id])
        ]);
        expect(
            view1.mapper.fields.find(f => f.prop.name === "store")!.optimizable
        ).toEqual(true);

        const view2 = dto.view(BOOK, c => [
            c.$allScalars,
            c.store.with(c => [
                c.id, 
                c.name
            ])
        ]);
        expect(
            view2.mapper.fields.find(f => f.prop.name === "store")!.optimizable
        ).toEqual(false);
    });

    it("o2m", () => {
        const view = dto.view(BOOK_STORE, c => [
            c.$allScalars,
            c.books.with(c => [c.id])
        ]);
        expect(
            view.mapper.fields.find(f => f.prop.name === "books")!.optimizable
        ).toEqual(false);
    });

    it("m2m", () => {
        const view1 = dto.view(BOOK, c => [
            c.$allScalars,
            c.authors.with(c => [c.id]).sort()
        ]);
        expect(
            view1.mapper.fields.find(f => f.prop.name === "authors")!.optimizable
        ).toEqual(true);

        const view2 = dto.view(BOOK, c => [
            c.$allScalars,
            c.authors.with(c => [c.name])
        ]);
        expect(
            view2.mapper.fields.find(f => f.prop.name === "authors")!.optimizable
        ).toEqual(false);

        const view3 = dto.view(BOOK, c => [
            c.$allScalars,
            c.authors.with(c => [
                c.name.with(c => [
                    c.firstName
                ])
            ])
        ]);
        expect(
            view3.mapper.fields.find(f => f.prop.name === "authors")!.optimizable
        ).toEqual(false);
    });

    it("inverseM2M", () => {

        const view1 = dto.view(AUTHOR, c => [
            c.$allScalars,
            c.books.with(c => [c.id])
        ]);
        expect(
            view1.mapper.fields.find(f => f.prop.name === "books")!.optimizable
        ).toEqual(true);

        const view2 = dto.view(AUTHOR, c => [
            c.$allScalars,
            c.books.with(c => [c.name])
        ]);
        expect(
            view2.mapper.fields.find(f => f.prop.name === "books")!.optimizable
        ).toEqual(false);
    });

    it("m2mByMiddleEntity", () => {

        const view1 = dto.view(STUDENT, c => [
            c.$allScalars,
            c.courses.with(c => [c.id])
        ]);
        expect(
            view1.mapper.fields
                .find(f => f.prop.name === "learningLinks")!
                .subMapper!.fields
                .find(f => f.prop.name === "course")!
                .optimizable
        ).toEqual(true);

        const view2 = dto.view(STUDENT, c => [
            c.$allScalars,
            c.courses.with(c => [
                c.id,
                c.name
            ])
        ]);
        expect(
            view2.mapper.fields
                .find(f => f.prop.name === "learningLinks")!
                .subMapper!.fields
                .find(f => f.prop.name === "course")!
                .optimizable
        ).toEqual(false);
    });

    it("multipleColumnsM2O", () => {
        const view1 = dto.view(ORDER_ITEM, c => [
            c.$allScalars,
            c.order.with(c => [c.id])
        ]);
        expect(
            view1.mapper.fields.find(f => f.prop.name === "order")!.optimizable
        ).toEqual(true);

        const view2 = dto.view(ORDER_ITEM, c => [
            c.$allScalars,
            c.order.with(c => [
                c.id.with(c => [c.x])
            ])
        ]);
        expect(
            view2.mapper.fields.find(f => f.prop.name === "order")!.optimizable
        ).toEqual(true);

        const view3 = dto.view(ORDER_ITEM, c => [
            c.$allScalars,
            c.order.with(c => [
                c.id,
                c.name
            ])
        ]);
        expect(
            view3.mapper.fields.find(f => f.prop.name === "order")!.optimizable
        ).toEqual(false);

        const view4 = dto.view(ORDER_ITEM, c => [
            c.$allScalars,
            c.order.with(c => [
                c.id.with(c => [c.x]),
                c.name
            ])
        ]);
        expect(
            view4.mapper.fields.find(f => f.prop.name === "order")!.optimizable
        ).toEqual(false);
    });

    it("multipleColumnsM2M", () => {

        const view1 = dto.view(ORDER, c => [
            c.$allScalars,
            c.tags.with(c => [c.id]).sort()
        ]);
        expect(
            view1.mapper.fields.find(f => f.prop.name === "tags")!.optimizable
        ).toEqual(true);

        const view2 = dto.view(ORDER, c => [
            c.$allScalars,
            c.tags.with(c => [
                c.id.with(c => [c.low])
            ]).sort()
        ]);
        expect(
            view2.mapper.fields.find(f => f.prop.name === "tags")!.optimizable
        ).toEqual(true);

        const view3 = dto.view(ORDER, c => [
            c.$allScalars,
            c.tags.with(c => [
                c.id, 
                c.name
            ]).sort()
        ]);
        expect(
            view3.mapper.fields.find(f => f.prop.name === "tags")!.optimizable
        ).toEqual(false);

        const view4 = dto.view(ORDER, c => [
            c.$allScalars,
            c.tags.with(c => [
                c.id.with(c => [c.low]),
                c.name
            ])
        ]);
        expect(
            view4.mapper.fields.find(f => f.prop.name === "tags")!.optimizable
        ).toEqual(false);
    });

    it("brokenByFilter", () => {
        const view1 = dto.view(BOOK, c => [
            c.$allScalars,
            c.store.with(c => [
                c.id
            ])
        ]);
        expect(
            view1.mapper.fields.find(f => f.prop.name === "store")!.optimizable
        ).toEqual(true);

        const view2 = dto.view(BOOK, c => [
            c.$allScalars,
            c.store.with(c => [
                c.id
            ]).filter(table => table.version.eq(1))
        ]);
        expect(
            view2.mapper.fields.find(f => f.prop.name === "store")!.optimizable
        ).toEqual(false);
    });
});