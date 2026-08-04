import { dsl, dto, TypeOf } from "@/index";
import { describe, it, expectTypeOf } from "vitest";
import { AUTHOR, BOOK, BOOK_STORE } from "../../model/model";
import z from "zod";

describe("MapOutputTest", () => {

    it("changeEnumType", () => {
        const view = dto.view(AUTHOR, c => [
            c.name,
            c.gender.mapOutput(z.enum(["Boy", "Girl"]), gender => {
                return gender === "MALE" ? "Boy" : "Girl";
            })
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            name: {
                firstName: string;
                lastName: string;
            };
            gender: "Boy" | "Girl";
        }>();
    });

    it("changeSqlFormulaType", () => {
        const view = dto.view(BOOK, c => [
            c.name,
            c.authorCount.mapOutput(
                z.string(), 
                value => `${value} author(s)`
            )
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            name: string;
            authorCount: string;
        }>();
    });

    it("changeTmpTsFormulaType", () => {
        const view = dto.view(BOOK_STORE, c => [
            c.name,
            c.$formula.ts({
                alias: "priceVariance",
                valueType: z.number(),
                dependency: c => [
                    c.books.with(c => [
                        c.price
                    ])
                ],
                fn: data => {
                    const prices = data.books.map(book => book.price);
                    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
                    return prices.reduce((a, b) => a + (b - mean) ** 2, 0) / prices.length;
                }
            }).mapOutput(
                z.string(), 
                value => `The variance of book prices is ${value}`
            )
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            name: string,
            priceVariance: string
        }>();
    });

    it("changeTmpSqlFormulaType", () => {
        const view = dto.view(BOOK_STORE, c => [
            c.name,
            c.$formula.sql({
                alias: "avgPrice",
                valueType: z.number(),
                fn: store => dsl.subQuery(BOOK, (q, book) => {
                    q.where(book.storeId.eq(store.id));
                    return q.select(dsl.avg(book.price).asNonNull());
                })
            }).mapOutput(
                z.string(), 
                value => `Thee average price of my books is: ${Math.round(value * 100) / 100}`
            )
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            name: string;
            avgPrice: string;
        }>();
    });
});