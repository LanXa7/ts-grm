import { EntityTable } from "@/dsl/table";
import { NumExpression, Predicate, StrExpression } from "@/dsl/expression";
import { AUTHOR, BOOK, BOOK_STORE } from "../model/model";
import { describe, it, expectTypeOf, } from "vitest";

function book(): EntityTable<typeof BOOK> {
    throw new Error();
}

function store(): EntityTable<typeof BOOK_STORE> {
    throw new Error();
}

describe("TableMembers", () => {

    it("dsl", () => {
        const authorLastName = store().books().$acceptMulti().authors().name().lastName;
        expectTypeOf<typeof authorLastName>().toEqualTypeOf<StrExpression<string>>();
        
        const storeId = book().storeId;
        expectTypeOf<typeof storeId>().toEqualTypeOf<NumExpression<string | null>>();

        const bookId = book().id;
        expectTypeOf<typeof bookId>().toEqualTypeOf<NumExpression<number>>();

        const storeName1 = book().store().name;
        expectTypeOf<typeof storeName1>().toEqualTypeOf<StrExpression<string>>();

        const storeName2 = book().store("LEFT").name;
        expectTypeOf<typeof storeName2>().toEqualTypeOf<StrExpression<string | null>>();

        const storeName3 = book().store({
            filter: ctx => ctx.source.name.eq(ctx.target.name)
        }).name;
        expectTypeOf<typeof storeName3>().toEqualTypeOf<StrExpression<string>>();

        const weakJoinName1 = store().join(
            AUTHOR, 
            ctx => ctx.source.name.eq(ctx.target.name().firstName)
        ).$acceptMulti().name().firstName;
        expectTypeOf<typeof weakJoinName1>().toEqualTypeOf<StrExpression<string>>();

        const weakJoinName2 = store().join(
            AUTHOR, 
            {
                joinType: "LEFT",
                filter: ctx => ctx.source.name.eq(ctx.target.name().firstName)
            }
        ).$acceptMulti().name().firstName;
        expectTypeOf<typeof weakJoinName2>().toEqualTypeOf<StrExpression<string | null>>();
    });

    it("rhsType", () => {

        const bookStoreId = store().id;
        expectTypeOf<typeof bookStoreId>().toEqualTypeOf<NumExpression<string>>();

        const storeId = book().storeId;
        expectTypeOf<typeof storeId>().toEqualTypeOf<NumExpression<string | null>>();

        const pred1 = bookStoreId.eq(storeId);
        expectTypeOf<typeof pred1>().toEqualTypeOf<Predicate>();
        const pred2 = bookStoreId.eq("3");
        expectTypeOf<typeof pred2>().toEqualTypeOf<Predicate>();
    });
});
