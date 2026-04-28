import { dto } from "@/index";
import { describe, expect, it } from "vitest";
import { AUTHOR, BOOK, BOOK_STORE } from "../../model/model";
import { makeReader, mapperJson } from "./utils";
import { buildShape } from "@/impl/shape";
import { expectCode } from "../../utils";

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
        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        fullName: null
                    };
                    const implicit = {
                        fullName: null
                    };
                    this._implicit_fullName_name(implicit).firstName = reader.get(1);
                    this._implicit_fullName_name(implicit).lastName = reader.get(2);
                    return { reader: this, parent, dto, implicit };
                }
                _implicit_fullName(implicit) {
                    let o = implicit.fullName;
                    if (o == null) {
                        implicit.fullName = o = {
                            name: null
                        };
                    }
                    return o;
                }
                _implicit_fullName_name(implicit) {
                    let o = this._implicit_fullName(implicit).name;
                    if (o == null) {
                        this._implicit_fullName(implicit).name = o = {
                            firstName: null, 
                            lastName: null
                        };
                    }
                    return o;
                }
            }
        `);
        const row = view.mapper.rowReader.read(
            undefined,
            makeReader(1, "Alex", "Banks")
        );
        expect(row.dto).toEqual({
            id: 1,
            fullName: null
        });
        expect(row.implicit).toEqual({
            fullName: {
                name: {
                    firstName: "Alex",
                    lastName: "Banks"
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
        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: null, 
                        fullName: null
                    };
                    const implicit = {
                        fullName: null
                    };
                    this._implicit_fullName_name(implicit).firstName = reader.get(1);
                    this._name(dto).firstName = reader.get(1);
                    this._implicit_fullName_name(implicit).lastName = reader.get(2);
                    this._name(dto).lastName = reader.get(2);
                    return { reader: this, parent, dto, implicit };
                }
                _name(dto) {
                    let o = dto.name;
                    if (o == null) {
                        dto.name = o = {
                            firstName: null, 
                            lastName: null
                        };
                    }
                    return o;
                }
                _implicit_fullName(implicit) {
                    let o = implicit.fullName;
                    if (o == null) {
                        implicit.fullName = o = {
                            name: null
                        };
                    }
                    return o;
                }
                _implicit_fullName_name(implicit) {
                    let o = this._implicit_fullName(implicit).name;
                    if (o == null) {
                        this._implicit_fullName(implicit).name = o = {
                            firstName: null, 
                            lastName: null
                        };
                    }
                    return o;
                }
            }
        `);
        const row = view.mapper.rowReader.read(
            undefined,
            makeReader(1, "Alex", "Banks")
        );
        expect(row.dto).toEqual({
            id: 1,
            name: {
                firstName: "Alex",
                lastName: "Banks"
            },
            fullName: null
        });
        expect(row.implicit).toEqual({
            fullName: {
                name: {
                    firstName: "Alex",
                    lastName: "Banks"
                }
            }
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
        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        formula: null
                    };
                    const implicit = {
                        fullName: null
                    };
                    this._implicit_fullName_name(implicit).firstName = reader.get(1);
                    this._implicit_fullName_name(implicit).lastName = reader.get(2);
                    return { reader: this, parent, dto, implicit };
                }
                _formula(dto) {
                    let o = dto.formula;
                    if (o == null) {
                        dto.formula = o = {
                            fn: null
                        };
                    }
                    return o;
                }
                _implicit_fullName(implicit) {
                    let o = implicit.fullName;
                    if (o == null) {
                        implicit.fullName = o = {
                            name: null
                        };
                    }
                    return o;
                }
                _implicit_fullName_name(implicit) {
                    let o = this._implicit_fullName(implicit).name;
                    if (o == null) {
                        this._implicit_fullName(implicit).name = o = {
                            firstName: null, 
                            lastName: null
                        };
                    }
                    return o;
                }
            }
        `);
        const row = view.mapper.rowReader.read(
            undefined,
            makeReader(1, "Alex", "Banks")
        );
        expect(row.dto).toEqual({
            id: 1,
            formula: null
        });
        expect(row.implicit).toEqual({
            fullName: {
                name: {
                    firstName: "Alex",
                    lastName: "Banks"
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
        const row = view.mapper.rowReader.read(
            undefined,
            makeReader(2)
        );
        expect(row.dto).toEqual({
            authorCount: 2
        });
        expect(row.implicit).toEqual(undefined);
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
                "__array": {
                    "id": 0,
                    "name": 1
                }
            },
            "__implicit": {
                "_0": 0
            }
        });
        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        newestBooks: null
                    };
                    const implicit = {
                        _0: reader.get(0)
                    };
                    return { reader: this, parent, dto, implicit };
                }
            }
        `);
    });

    it("parameterizedTargetCalculator", () => {
        const view = dto.view(BOOK_STORE, $ => $
            .id
            .specifiedBooks({maxPrice: 20}).$as("cheapBooks")
            .specifiedBooks({minPrice: 60}, $ => $.id.name).$as("expensiveBooks")
        );
        expect(JSON.stringify(mapperJson(view.mapper)), `
            {
                "entity": "BookStore",
                "fields": [
                    {
                        "prop": "BookStore.id",
                        "paths": ["id"],
                        "isDependent": true,
                        "columnIndex": 0
                    },
                    {
                        "prop": "BookStore.specifiedBooks",
                        "parameter": {"maxPrice": 20},
                        "paths": ["cheapBooks"],
                        "subMapper": {
                            "entity": "Book",
                            "associatedProp": "BookStore.specifiedBooks",
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
                                },
                                {
                                    "prop": "Book.edition",
                                    "paths": ["edition"],
                                    "columnIndex": 2
                                },
                                {
                                    "prop": "Book.price",
                                    "paths": ["price"],
                                    "columnIndex": 3
                                }
                            ]
                        },
                        "dependencies": [0]
                    },
                    {
                        "prop": "BookStore.specifiedBooks",
                        "parameter": {"minPrice": 60},
                        "paths": ["expensiveBooks"],
                        "subMapper": {
                            "entity": "Book",
                            "associatedProp": "BookStore.specifiedBooks",
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
            }
        `);
        expect(buildShape(view.mapper)).toEqual({
            "id": 0,
            "cheapBooks": {
                "__array": {
                    "id": 0,
                    "name": 1,
                    "edition": 2,
                    "price": 3
                }
            },
            "expensiveBooks": {
                "__array": {
                    "id": 0,
                    "name": 1
                }
            }
        });
        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        cheapBooks: null, 
                        expensiveBooks: null
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
        const cheapBooksMapper = view
            .mapper
            .fields
            .find(f => f.prop.name === "specifiedBooks" && f.parameter.maxPrice != null)!
            .subMapper!;
        expectCode(cheapBooksMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        edition: reader.get(2), 
                        price: reader.get(3)
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
        const expensiveBooksMapper = view
            .mapper
            .fields
            .find(f => f.prop.name === "specifiedBooks" && f.parameter.minPrice != null)!
            .subMapper!;
        expectCode(expensiveBooksMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1)
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
    });
});