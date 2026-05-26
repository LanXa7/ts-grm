import { dto } from "@/index";
import { describe, it, expect } from "vitest";
import { AUTHOR, BOOK, BOOK_STORE, ORDER, ORDER_ITEM, STUDENT } from "../../model/model";

describe("OptimizationTest", () => {
    
    it("m2o", () => {
        const view1 = dto.view(BOOK, $ => $
            .allScalars()
            .store($ => $.id)
        );
        expect(
            view1.mapper.fields.find(f => f.prop.name === "store")!.optimizable
        ).toEqual(true);

        const view2 = dto.view(BOOK, $ => $
            .allScalars()
            .store($ => $.id.name)
        );
        expect(
            view2.mapper.fields.find(f => f.prop.name === "store")!.optimizable
        ).toEqual(false);
    });

    it("o2m", () => {
        const view = dto.view(BOOK_STORE, $ => $
            .allScalars()
            .books($ => $.id)
        );
        expect(
            view.mapper.fields.find(f => f.prop.name === "books")!.optimizable
        ).toEqual(false);
    });

    it("m2m", () => {
        const view1 = dto.view(BOOK, $ => $
            .allScalars()
            .authors($ => $.id)
        );
        expect(
            view1.mapper.fields.find(f => f.prop.name === "authors")!.optimizable
        ).toEqual(true);

        const view2 = dto.view(BOOK, $ => $
            .allScalars()
            .authors($ => $.id.name())
        );
        expect(
            view2.mapper.fields.find(f => f.prop.name === "authors")!.optimizable
        ).toEqual(false);

        const view3 = dto.view(BOOK, $ => $
            .allScalars()
            .authors($ => $.id.name($ => $.firstName))
        );
        expect(
            view3.mapper.fields.find(f => f.prop.name === "authors")!.optimizable
        ).toEqual(false);
    });

    it("inverseM2M", () => {

        const view1 = dto.view(AUTHOR, $ => $
            .allScalars()
            .books($ => $.id)
        );
        expect(
            view1.mapper.fields.find(f => f.prop.name === "books")!.optimizable
        ).toEqual(true);

        const view2 = dto.view(AUTHOR, $ => $
            .allScalars()
            .books($ => $.id.name)
        );
        expect(
            view2.mapper.fields.find(f => f.prop.name === "books")!.optimizable
        ).toEqual(false);
    });

    it("m2mByMiddleEntity", () => {

        const view1 = dto.view(STUDENT, $ => $
            .allScalars()
            .courses($ => $.id)
        );
        expect(
            view1.mapper.fields
                .find(f => f.prop.name === "learningLinks")!
                .subMapper!.fields
                .find(f => f.prop.name === "course")!
                .optimizable
        ).toEqual(true);

        const view2 = dto.view(STUDENT, $ => $
            .allScalars()
            .courses($ => $.id.name)
        );
        expect(
            view2.mapper.fields
                .find(f => f.prop.name === "learningLinks")!
                .subMapper!.fields
                .find(f => f.prop.name === "course")!
                .optimizable
        ).toEqual(false);
    });

    it("multipleColumnsM2O", () => {
        const view1 = dto.view(ORDER_ITEM, $ => $
            .allScalars()
            .order($ => $.id())
        );
        expect(
            view1.mapper.fields.find(f => f.prop.name === "order")!.optimizable
        ).toEqual(true);

        const view2 = dto.view(ORDER_ITEM, $ => $
            .allScalars()
            .order($ => $.id($ => $.x))
        );
        expect(
            view2.mapper.fields.find(f => f.prop.name === "order")!.optimizable
        ).toEqual(true);

        const view3 = dto.view(ORDER_ITEM, $ => $
            .allScalars()
            .order($ => $.id().name)
        );
        expect(
            view3.mapper.fields.find(f => f.prop.name === "order")!.optimizable
        ).toEqual(false);

        const view4 = dto.view(ORDER_ITEM, $ => $
            .allScalars()
            .order($ => $.id($ => $.x).name)
        );
        expect(
            view4.mapper.fields.find(f => f.prop.name === "order")!.optimizable
        ).toEqual(false);
    });

    it("multipleColumns", () => {

        const view1 = dto.view(ORDER, $ => $
            .allScalars()
            .tags($ => $.id())
        );
        expect(
            view1.mapper.fields.find(f => f.prop.name === "tags")!.optimizable
        ).toEqual(true);

        const view2 = dto.view(ORDER, $ => $
            .allScalars()
            .tags($ => $.id($ => $.low))
        );
        expect(
            view2.mapper.fields.find(f => f.prop.name === "tags")!.optimizable
        ).toEqual(true);

        const view3 = dto.view(ORDER, $ => $
            .allScalars()
            .tags($ => $.id().name)
        );
        expect(
            view3.mapper.fields.find(f => f.prop.name === "tags")!.optimizable
        ).toEqual(false);

        const view4 = dto.view(ORDER, $ => $
            .allScalars()
            .tags($ => $.id($ => $.low).name)
        );
        expect(
            view4.mapper.fields.find(f => f.prop.name === "tags")!.optimizable
        ).toEqual(false);
    });
});