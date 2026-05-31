import { dto } from "@/index";
import { describe, it, expect } from "vitest";
import { BOOK_STORE, PAPER_BOOK, ELECTRONIC_BOOK, PDF_ELECTRONIC_BOOK } from "../../model/model";
import { mapperJson } from "./utils";

describe("PolymorphismTest", () => {

    it("multipleTables", () => {

        const view = dto.view(BOOK_STORE, $ => $
            .name
            .books(
                $ => $
                    .name
                    .instanceOf(PAPER_BOOK, $ => $
                        .size($ => $.width.height)
                    )
                    .instanceOf(ELECTRONIC_BOOK, $ => $
                        .address
                    )
                    .instanceOf(PDF_ELECTRONIC_BOOK, $ => $
                        .pdfVersion
                    )
            )
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "BookStore",
            "fields": [
                {
                    "prop": "BookStore.name",
                    "paths": ["name"],
                    "columnIndex": 0
                },
                {
                    "prop": "BookStore.id",
                    "paths": [],
                    "isDependent": true,
                    "columnIndex": 1
                },
                {
                    "prop": "BookStore.books",
                    "paths": ["books"],
                    "subMapper": {
                        "entity": "Book",
                        "associatedProp": "BookStore.books",
                        "fields": [
                            {
                                "prop": "Book.name",
                                "paths": ["name"],
                                "columnIndex": 0
                            },
                            {
                                "prop": "Book.__typename",
                                "paths": ["__typename"],
                                "columnIndex": 1
                            },
                            {
                                "prop": "PaperBook.size.width",
                                "paths": [
                                    ["size", "width"]
                                ],
                                "columnIndex": 2,
                                "downcastTo": "PaperBook"
                            },
                            {
                                "prop": "PaperBook.size.height",
                                "paths": [
                                    ["size", "height"]
                                ],
                                "columnIndex": 3,
                                "downcastTo": "PaperBook"
                            },
                            {
                                "prop": "ElectronicBook.address",
                                "paths": ["address"],
                                "columnIndex": 4,
                                "downcastTo": "ElectronicBook"
                            },
                            {
                                "prop": "PdfElectronicBook.pdfVersion",
                                "paths": ["pdfVersion"],
                                "columnIndex": 5,
                                "downcastTo": "PdfElectronicBook"
                            }
                        ]
                    },
                    "dependencies": [1]
                }
            ]
        });
    });
});