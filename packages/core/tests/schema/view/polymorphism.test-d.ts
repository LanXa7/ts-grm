import { createView } from "@/schema/view";
import { describe, expectTypeOf, it } from "vitest";
import { BOOK, BOOK_STORE, ELECTRONIC_BOOK, PAPER_BOOK, PDF_ELECTRONIC_BOOK, PHYSICAL_BOOK_STORE } from "../../model/model";
import { TypeOf } from "@/index";

describe("PolymorephismTest", () => {

    it("simple", () => {});

    it("simple", () => {
        const view = createView(BOOK_STORE, {
            id: true,
            $polymorphism: ctx => ctx.when(PHYSICAL_BOOK_STORE, {
                city: true
            })
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            __typename: "BookStore";
            id: string;
        } | {
            __typename: "PhysicalBookStore";
            id: string;
            city: string;
        }>();
    });

    it("deep", () => {
        const view = createView(BOOK, {
            name: true,
            edition: true,
            $polymorphism: ctx => ctx.when(ELECTRONIC_BOOK, {
                address: true,
                $polymorphism: ctx => ctx.when(PDF_ELECTRONIC_BOOK, {
                    pdfVersion: true
                })
            })
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<
            {
                __typename: "Book";
                edition: number;
                name: string;
            } | {
                __typename: "ElectronicBook";
                address: string;
                edition: number;
                name: string;
            } | {
                __typename: "PdfElectronicBook";
                address: string;
                edition: number;
                name: string;
                pdfVersion: string | null;
            }
        >();
    });

    it("deepAndWide", () => {
        const view = createView(BOOK, {
            name: true,
            edition: true,
            $polymorphism:
                ctx => ctx
                    .when(PAPER_BOOK, {
                        size: true
                    })
                    .when(ELECTRONIC_BOOK, {
                        address: true,
                        $polymorphism: ctx => ctx.when(PDF_ELECTRONIC_BOOK, {
                            pdfVersion: true
                        })
                    })
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<
            {
                __typename: "Book";
                edition: number;
                name: string;
            } | {
                __typename: "PaperBook";
                edition: number;
                name: string;
                size: {
                    width: number;
                    height: number;
                };
            } | {
                __typename: "ElectronicBook";
                address: string;
                edition: number;
                name: string;
            } | {
                __typename: "PdfElectronicBook";
                address: string;
                edition: number;
                name: string;
                pdfVersion: string | null;
            }
        >();
    });

    it("associatedDeepAndWide", () => {
        const view = createView(BOOK_STORE, {
            $allScalars: true,
            books: ctx => ctx({
                name: true,
                edition: true,
                $polymorphism:
                    ctx => ctx
                        .when(PAPER_BOOK, {
                            size: true
                        })
                        .when(ELECTRONIC_BOOK, {
                            address: true,
                            $polymorphism: ctx => ctx.when(PDF_ELECTRONIC_BOOK, {
                                pdfVersion: true
                            })
                        })
            })
        });
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: string;
            name: string;
            version: number;
            books: ({
                __typename: "Book";
                edition: number;
                name: string;
            } | {
                __typename: "PaperBook";
                edition: number;
                name: string;
                size: {
                    height: number;
                    width: number;
                };
            } | {
                __typename: "ElectronicBook";
                address: string;
                edition: number;
                name: string;
            } | {
                __typename: "PdfElectronicBook";
                address: string;
                edition: number;
                name: string;
                pdfVersion: string | null;
            })[];
        }>();
    })
});