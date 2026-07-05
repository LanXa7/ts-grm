import { createView } from "@/schema/view";
import { it } from "node:test";
import { describe, expectTypeOf } from "vitest";
import { TREE_NODE } from "../../model/model";
import { TypeOf } from "@/index";

describe("RecursiveTest", () => {

    it("simple", () => {
        const view = createView(TREE_NODE, {
            id: true,
            name: true,
            $recursive: ctx => ctx({
                parentNode: true,
                childNodes: true
            })
        });
        type ViewType = TypeOf<typeof view>;
        expectTypeOf<keyof ViewType>().toEqualTypeOf<
            "id" | "name" | "parentNode" | "childNodes"
        >();
        expectTypeOf<keyof Exclude<ViewType["parentNode"], null>>().toEqualTypeOf<
            "id" | "name" | "parentNode"
        >();
        expectTypeOf<keyof ElementOf<ViewType["childNodes"]>>().toEqualTypeOf<
            "id" | "name" | "childNodes"
        >();
        expectTypeOf<null extends ViewType["childNodes"] ? "NULLABLE" : "NONNULL">().toEqualTypeOf<
            "NONNULL"
        >();

        make<ViewType>().parentNode?.parentNode?.parentNode;
        make<ViewType>().childNodes[0]!.childNodes[0]!.childNodes[0];
    });

    it("alias", () => {
        const view = createView(TREE_NODE, {
            id: true,
            name: true,
            $recursive: ctx => ctx({
                parentNode: { alias: "upObj"},
                childNodes: { alias: "downObjs" }
            })
        });
        type ViewType = TypeOf<typeof view>;
        expectTypeOf<keyof ViewType>().toEqualTypeOf<
            "id" | "name" | "upObj" | "downObjs"
        >();
        expectTypeOf<keyof Exclude<ViewType["upObj"], null>>().toEqualTypeOf<
            "id" | "name" | "upObj"
        >();
        expectTypeOf<keyof ElementOf<ViewType["downObjs"]>>().toEqualTypeOf<
            "id" | "name" | "downObjs"
        >();
        expectTypeOf<null extends ViewType["downObjs"] ? "NULLABLE" : "NONNULL">().toEqualTypeOf<
            "NONNULL"
        >();

        make<ViewType>().upObj?.upObj?.upObj;
        make<ViewType>().downObjs[0]!.downObjs[0]!.downObjs[0];
    });

    it("aliasWithDepth", () => {
        const view = createView(TREE_NODE, {
            id: true,
            name: true,
            $recursive: ctx => ctx({
                parentNode: { alias: "upObj"},
                childNodes: { alias: "downObjs", depth: 3 }
            })
        });
        type ViewType = TypeOf<typeof view>;
        expectTypeOf<keyof ViewType>().toEqualTypeOf<
            "id" | "name" | "upObj" | "downObjs"
        >();
        expectTypeOf<keyof Exclude<ViewType["upObj"], null>>().toEqualTypeOf<
            "id" | "name" | "upObj"
        >();
        expectTypeOf<keyof ElementOf<ViewType["downObjs"]>>().toEqualTypeOf<
            "id" | "name" | "downObjs"
        >();
        expectTypeOf<null extends ViewType["downObjs"] ? "NULLABLE" : "NONNULL">().toEqualTypeOf<
            "NULLABLE"
        >();

        make<ViewType>().upObj?.upObj?.upObj;
        make<ViewType>().downObjs![0]!.downObjs![0]!.downObjs![0];
    });
});

type ElementOf<T> = 
    T extends ReadonlyArray<infer R> 
        ? R 
        : never;

function make<T>(): T {
    throw new Error("Not implemented");
}