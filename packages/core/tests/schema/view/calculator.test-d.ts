import { describe, expectTypeOf, it } from "vitest";
import { BOOK_STORE } from "../../model/model";
import { TypeOf } from "@/index";
import { newView } from "@/schema/dto/index";

describe("CalculatorTest", () => {

    it("simpleWithoutBody", () => {
        const view = newView(BOOK_STORE, c => [
            c.id,
            c.newestBooks
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: string;
            newestBooks: {
                id: number;
                name: string;
                edition: number;
                price: number;
            }[];
        }>();
    });

    it("simpleWithBody", () => {
        const view = newView(BOOK_STORE, c => [
            c.id,
            c.newestBooks.with(c => [
                c.name,
                c.edition
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: string;
            newestBooks: {
                name: string;
                edition: number;
            }[];
        }>();
    });

    it("singleParameterizedWithoutBody", () => {
        const view = newView(BOOK_STORE, c => [
            c.id,
            c.$parameterized("specifiedBooks", {maxPrice: 30})
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: string;
            specifiedBooks: {
                id: number;
                name: string;
                edition: number;
                price: number;
            }[];
        }>();
    });

    it("singleParameterizedWithBody", () => {
        const view = newView(BOOK_STORE, c => [
            c.id,
            c.$parameterized("specifiedBooks", {maxPrice: 30}).with(c => [
                c.name,
                c.edition
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: string;
            specifiedBooks: {
                name: string;
                edition: number;
            }[];
        }>();
    });

    it("multipleParameterizedWithoutBody", () => {
        const view = newView(BOOK_STORE, c => [
            c.id,
            c.$parameterized(
                "specifiedBooks", 
                { maxPrice: 30 }
            ).as("cheapBooks"),
            c.$parameterized(
                "specifiedBooks",
                { minPrice: 60 }
            ).as("expensiveBooks")
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: string;
            cheapBooks: {
                id: number;
                name: string;
                edition: number;
                price: number;
            }[];
            expensiveBooks: {
                id: number;
                name: string;
                edition: number;
                price: number;
            }[];
        }>();
    });

    it("multipleParameterizedWithBody", () => {
        const view = newView(BOOK_STORE, c => [
            c.id,
            c.$parameterized(
                "specifiedBooks", 
                { maxPrice: 30 }
            ).as("cheapBooks").with(c => [c.id]),
            c.$parameterized(
                "specifiedBooks",
                { minPrice: 60 }
            ).as("expensiveBooks").with(c => [
                c.name,
                c.edition
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: string;
            cheapBooks: {
                id: number;
            }[];
            expensiveBooks: {
                name: string;
                edition: number;
            }[];
        }>();
    });
});