import { describe, expectTypeOf, it } from "vitest";
import { ORDER } from "../model/model";
import { dsl } from "@/dsl";
import { AssociationTable } from "@/dsl/association";
import { MakeAssociationModel } from "@/dsl/association_internal_types";
import { FilterType } from "@/dsl/table_internal_types";

describe("AssociationTableTypeTest", () => {

    it("multiColumns", () => {
        const model = dsl.associationModel(ORDER, "tags");
        type TableType = AssociationTable<typeof model>;
        expectTypeOf<keyof TableType>().toEqualTypeOf<
            "source" | "target" | "sourceId" | "targetId" | "__type"
        >();
        expectTypeOf<keyof ReturnType<TableType["sourceId"]>>().toEqualTypeOf<"x" | "y">();
        expectTypeOf<keyof ReturnType<ReturnType<TableType["sourceId"]>["y"]>>().toEqualTypeOf<"a" | "b">();
        expectTypeOf<keyof ReturnType<TableType["targetId"]>>().toEqualTypeOf<"low" | "high">();

        expectTypeOf<typeof model>().toEqualTypeOf<MakeAssociationModel<typeof ORDER, "tags">>();
        type TheFilterType = FilterType<typeof ORDER, typeof model>;
        type CtxType = Parameters<TheFilterType>[0];
        expectTypeOf<keyof ReturnType<CtxType["target"]["targetId"]>>().toEqualTypeOf<"low" | "high">();
    });
});