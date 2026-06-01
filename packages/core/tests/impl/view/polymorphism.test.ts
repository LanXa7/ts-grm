import { dto } from "@/index";
import { describe, it, expect } from "vitest";
import { BOOK_STORE, PAPER_BOOK, ELECTRONIC_BOOK, PDF_ELECTRONIC_BOOK } from "../../model/model";
import { mapperJson } from "./utils";
import { buildShape } from "@/impl/shape";
import { Entity } from "@/impl";
import { expectCode } from "../../utils";

describe("PolymorphismTest", () => {

    it("withoutDerivedFormula", () => {

        const view = dto.view(BOOK_STORE, $ => $
            .name
            .books(
                $ => $
                    .name
                    .instanceOf(PAPER_BOOK, $ => $
                        .size()
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
        expect(buildShape(view.mapper)).toEqual({
            "name": {
                "columnIndex": 0,
                "scalarType": "STR"
            },
            "__implicit": {
                "_1": {
                    "columnIndex": 1,
                    "scalarType": "I64"
                }
            },
            "books": {
                "targetShape": {
                    "name": {
                        "columnIndex": 0,
                        "scalarType": "STR"
                    },
                    "__typename": {
                        "columnIndex": 1
                    },
                    "size": {
                        "downcastTo": Entity.of(PAPER_BOOK),
                        "scalarType": "I32",
                        "targetShape": {
                            "width": {
                                "downcastTo": Entity.of(PAPER_BOOK),
                                "columnIndex": 2,
                                "scalarType": "I32"
                            },
                            "height": {
                                "downcastTo": Entity.of(PAPER_BOOK),
                                "columnIndex": 3,
                                "scalarType": "I32"
                            }
                        }
                    },
                    "address": {
                        "downcastTo": Entity.of(ELECTRONIC_BOOK),
                        "columnIndex": 4,
                        "scalarType": "STR"
                    },
                    "pdfVersion": {
                        "downcastTo": Entity.of(PDF_ELECTRONIC_BOOK),
                        "columnIndex": 5,
                        "scalarType": "STR"
                    }
                },
                "targetKind": "COLLECTION"
            }
        });
        const bookMapper = view.mapper.fields.find(f => f.prop.name === "books")!.subMapper!;
        expectCode(bookMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const typeName = $entity.findByDiscriminatorValue(reader.get(1));
                    let dto;
                    switch (typeName) {
                        case 'Book':
                            dto = {
                                name: reader.get(0), 
                                __typename: typeName
                            };
                            break;
                        case 'PaperBook':
                            dto = {
                                name: reader.get(0), 
                                __typename: typeName, 
                                size: null
                            };
                            break;
                        case 'ElectronicBook':
                            dto = {
                                name: reader.get(0), 
                                __typename: typeName, 
                                address: reader.get(4)
                            };
                            break;
                        case 'PdfElectronicBook':
                            dto = {
                                name: reader.get(0), 
                                __typename: typeName, 
                                address: reader.get(4), 
                                pdfVersion: reader.get(5)
                            };
                            break;
                    }
                    switch (typeName) {
                        case 'Book':
                            break;
                        case 'PaperBook':
                            this._size(dto).width = reader.get(2);
                            this._size(dto).height = reader.get(3);
                            break;
                        case 'ElectronicBook':
                            break;
                        case 'PdfElectronicBook':
                            break;
                    }
                    return { reader: this, parents, dto, implicit: undefined, typeName };
                }
                _size(dto) {
                    let o = dto.size;
                    if (o == null) {
                        dto.size = o = {
                            width: null, 
                            height: null
                        };
                    }
                    return o;
                }
            }
        `);
    });

    it("widthDerivedFormulua", () => {
        const view = dto.view(BOOK_STORE, $ => $
            .name
            .books(
                $ => $
                    .name
                    .instanceOf(PAPER_BOOK, $ => $
                        .area
                    )
                    .instanceOf(ELECTRONIC_BOOK, $ => $
                        .address
                    )
                    .instanceOf(PDF_ELECTRONIC_BOOK, $ => $
                        .pdfVersion
                    )
            )
        );
        console.log(JSON.stringify(mapperJson(view.mapper)));
    });
});