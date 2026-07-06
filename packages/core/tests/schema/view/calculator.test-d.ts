import { createView } from "@/schema/view";
import { describe, expectTypeOf, it } from "vitest";
import { BOOK_STORE } from "../../model/model";
import { TypeOf } from "@/index";

describe("CalculatorTest", () => {

    it("simpleWithoutBody", () => {
        const view = createView(BOOK_STORE, {
            id: true,
            newestBooks: true
        });
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
        const view = createView(BOOK_STORE, {
            id: true,
            newestBooks: c => c({
                name: true,
                edition: true
            })
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: string;
            newestBooks: {
                name: string;
                edition: number;
            }[];
        }>();
    });

    it("singleParameterizedWithoutBody", () => {
        const view = createView(BOOK_STORE, {
            id: true,
            specifiedBooks: {
                parameter: { maxPrice: 30 }
            }
        });
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
        const view = createView(BOOK_STORE, {
            id: true,
            specifiedBooks: {
                parameter: { maxPrice: 30 },
                with: c => c({
                    name: true,
                    edition: true
                })
            }
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: string;
            specifiedBooks: {
                name: string;
                edition: number;
            }[];
        }>();
    });

    it("multipleParameterizedWithoutBody", () => {
        const view = createView(BOOK_STORE, {
            id: true,
            specifiedBooks: [
                {
                    alias: "cheapBooks",
                    parameter: { maxPrice: 30 }
                },
                {
                    alias: "expensiveBooks",
                    parameter: { minPrice: 60 }
                }
            ]
        });
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
        const view = createView(BOOK_STORE, {
            id: true,
            specifiedBooks: [
                {
                    alias: "cheapBooks",
                    parameter: { maxPrice: 30 },
                    with: c => c({
                        id: true
                    })
                },
                {
                    alias: "expensiveBooks",
                    parameter: { minPrice: 60 },
                    with: c => c({
                        name: true,
                        edition: true
                    })
                }
            ]
        });
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