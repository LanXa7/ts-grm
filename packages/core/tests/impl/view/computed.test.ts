import { dto } from "@/index";
import { describe, expect, it } from "vitest";
import { AUTHOR, BOOK, BOOK_STORE } from "../../model/model";
import { mapperJson } from "./utils";
import { buildShape } from "@/impl/shape";

describe("ComputedTest", () => {

    it("tsFormula", () => {
        const view = dto.view(AUTHOR, $ => $
            .id
            .fullName
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Author",
            "fields": [
                {
                    "prop": "Author.id",
                    "paths": ["id"],
                    "columnIndex": 0
                },
                {
                    "prop": "Author.name.firstName",
                    "paths": [
                        ["<implicit:fullName>", "name", "firstName"]
                    ],
                    "isDependent": true,
                    "columnIndex": 1
                },
                {
                    "prop": "Author.name.lastName",
                    "paths": [
                        ["<implicit:fullName>", "name", "lastName"]
                    ],
                    "isDependent": true,
                    "columnIndex": 2
                },
                {
                    "prop": "Author.fullName",
                    "paths": ["fullName"],
                    "dependencies": [1, 2]
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "id": 0,
            "fullName": "fullName",
            "__implicit": {
                "fullName": {
                    "name": {
                        "firstName": 1,
                        "lastName": 2
                    }
                }
            }
        });
    });

    it("mixedTsFormula", () => {
        const view = dto.view(AUTHOR, $ => $
            .id
            .fullName
            .name()
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Author",
            "fields": [
                {
                    "prop": "Author.id",
                    "paths": ["id"],
                    "columnIndex": 0
                },
                {
                    "prop": "Author.name.firstName",
                    "paths": [
                        ["<implicit:fullName>", "name", "firstName"],
                        ["name", "firstName"]
                    ],
                    "isDependent": true,
                    "columnIndex": 1
                },
                {
                    "prop": "Author.name.lastName",
                    "paths": [
                        ["<implicit:fullName>", "name", "lastName"],
                        ["name", "lastName"]
                    ],
                    "isDependent": true,
                    "columnIndex": 2
                },
                {
                    "prop": "Author.fullName",
                    "paths": [
                        "fullName"
                    ],
                    "dependencies": [1, 2]
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "id": 0,
            "__implicit": {
                "fullName": {
                    "name": {
                        "firstName": 1,
                        "lastName": 2
                    }
                }
            },
            "name": {
                "firstName": 1,
                "lastName": 2
            },
            "fullName": "fullName"
        });
    });

    it("foldTsFormula", () => {
        const view = dto.view(AUTHOR, $ => $
            .id
            .fold("formula", $ => $.fullName.$as("fn"))
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Author",
            "fields": [
                {
                    "prop": "Author.id",
                    "paths": ["id"],
                    "columnIndex": 0
                },
                {
                    "prop": "Author.name.firstName",
                    "paths": [
                        ["<implicit:fullName>", "name", "firstName"]
                    ],
                    "isDependent": true,
                    "columnIndex": 1
                },
                {
                    "prop": "Author.name.lastName",
                    "paths": [
                        ["<implicit:fullName>", "name", "lastName"]
                    ],
                    "isDependent": true,
                    "columnIndex": 2
                },
                {
                    "prop": "Author.fullName",
                    "paths": [
                        ["formula", "fn"]
                    ],
                    "dependencies": [1, 2]
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "id": 0,
            "formula": {
                "fn": "fullName"
            },
            "__implicit": {
                "fullName": {
                    "name": {
                        "firstName": 1,
                        "lastName": 2
                    }
                }
            }
        });
    });

    it("sqlFormula", () => {
        const view = dto.view(BOOK, $ => $.authorCount);
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Book",
            "fields": [
                {
                    "prop": "Book.authorCount",
                    "paths": ["authorCount"],
                    "columnIndex": 0
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({"authorCount":0});
    });

    it("targetCalculator", () => {
        const view = dto.view(BOOK_STORE, $ => $
            .newestBooks($ => $.id.name)
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "BookStore",
            "fields": [
                {
                    "prop": "BookStore.id",
                    "paths": [],
                    "isDependent": true,
                    "columnIndex": 0
                },
                {
                    "prop": "BookStore.newestBooks",
                    "paths": ["newestBooks"],
                    "subMapper": {
                        "entity": "Book",
                        "associatedProp": "BookStore.newestBooks",
                        "fields": [
                            {
                                "prop": "Book.id",
                                "paths": ["id"],
                                "columnIndex": 0
                            },
                            {
                                "prop": "Book.name",
                                "paths": ["name"],
                                "columnIndex": 1
                            }
                        ]
                    },
                    "dependencies": [0]
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "newestBooks": {
                "id": 0,
                "name": 1
            },
            "__implicit": {
                "_0": 0
            }
        });
    });
});