// import { createView } from "@/schema/view";
import { describe, it } from "vitest";
// import { BOOK, BOOK_STORE, ELECTRONIC_BOOK, PAPER_BOOK, PDF_ELECTRONIC_BOOK, PHYSICAL_BOOK_STORE } from "../../model/model";
// import { TypeOf } from "@/index";

describe("PolymorephismTest", () => {

    it("simple", () => {});

    // it("simple", () => {
    //     const view = createView(BOOK_STORE, {
    //         id: true,
    //         $polymorphism: BOOK_STORE.when(PHYSICAL_BOOK_STORE, {
    //             city: true
    //         })
    //     });
    //     expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
    //         __typename: "BookStore";
    //         id: string;
    //     } | {
    //         __typename: "PhysicalBookStore";
    //         id: string;
    //         city: string;
    //     }>();
    // });

    // it("deep", () => {
    //     const view = createView(BOOK, {
    //         name: true,
    //         edition: true,
    //         $polymorphism: BOOK.when(ELECTRONIC_BOOK, {
    //             address: true,
    //             $polymorphism: ELECTRONIC_BOOK.when(PDF_ELECTRONIC_BOOK, {
    //                 pdfVersion: true
    //             })
    //         })
    //     });
    //     expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<
    //         {
    //             __typename: "Book";
    //             edition: number;
    //             name: string;
    //         } | {
    //             __typename: "ElectronicBook";
    //             address: string;
    //             edition: number;
    //             name: string;
    //         } | {
    //             __typename: "PdfElectronicBook";
    //             address: string;
    //             edition: number;
    //             name: string;
    //             pdfVersion: string | null;
    //         }
    //     >();
    // });

    // it("deepAndWide", () => {
    //     const view = createView(BOOK, {
    //         name: true,
    //         edition: true,
    //         $polymorphism:
    //             BOOK
    //                 .when(PAPER_BOOK, {
    //                     size: true
    //                 })
    //                 .when(ELECTRONIC_BOOK, {
    //                     address: true,
    //                     $polymorphism: ELECTRONIC_BOOK.when(PDF_ELECTRONIC_BOOK, {
    //                         pdfVersion: true
    //                     })
    //                 })
    //     });
    //     expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<
    //         {
    //             __typename: "Book";
    //             edition: number;
    //             name: string;
    //         } | {
    //             __typename: "PaperBook";
    //             edition: number;
    //             name: string;
    //             size: {
    //                 width: number;
    //                 height: number;
    //             };
    //         } | {
    //             __typename: "ElectronicBook";
    //             address: string;
    //             edition: number;
    //             name: string;
    //         } | {
    //             __typename: "PdfElectronicBook";
    //             address: string;
    //             edition: number;
    //             name: string;
    //             pdfVersion: string | null;
    //         }
    //     >();
    // });
});