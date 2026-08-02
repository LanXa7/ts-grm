import { dsl, dto } from "@/index";
import { describe, it, expect } from "vitest";
import { AUTHOR, BOOK, BOOK_STORE, STUDENT } from "../../model/model";
import { makeReader, mapperJson, shapeJson } from "./utils";
import { expectCode } from "../../utils";
import z from "zod";

describe("FormulaTest", () => {

    it("tsFormula", () => {
        const view = dto.view(AUTHOR, c => [
            c.id,
            c.fullName
        ]);
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
        expect(shapeJson(view.mapper)).toEqual({
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
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        fullName: null
                    };
                    const implicit = {
                        fullName: null
                    };
                    this._implicit_fullName_name(implicit).firstName = reader.get(1);
                    this._implicit_fullName_name(implicit).lastName = reader.get(2);
                    return { reader: this, parents, dto, implicit, typeName: undefined };
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
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return [
                                row.implicit.fullName?.name?.firstName, 
                                row.implicit.fullName?.name?.lastName
                            ];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] == null && dependency[1] == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] + "\\x1F" + dependency[1];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            row.dto.fullName = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolveTsFormulas(row) {
                    const fullNameValue = ThisClass.__FULL_NAME__TS_FORMULA_FN(row.implicit.fullName);
                    row.dto.fullName = fullNameValue;
                }
                static __FULL_NAME__TS_FORMULA_FN = $tsFormulaFunMap.get("fullName");
            }
        `);
        const row = view.mapper.dtoRowReader.read(
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
        const view = dto.view(AUTHOR, c => [
            c.id,
            c.fullName,
            c.name
        ]);
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
        expect(shapeJson(view.mapper)).toEqual({
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
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
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
                    return { reader: this, parents, dto, implicit, typeName: undefined };
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
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return [
                                row.implicit.fullName?.name?.firstName, 
                                row.implicit.fullName?.name?.lastName
                            ];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] == null && dependency[1] == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] + "\\x1F" + dependency[1];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            row.dto.fullName = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolveTsFormulas(row) {
                    const fullNameValue = ThisClass.__FULL_NAME__TS_FORMULA_FN(row.implicit.fullName);
                    row.dto.fullName = fullNameValue;
                }
                static __FULL_NAME__TS_FORMULA_FN = $tsFormulaFunMap.get("fullName");
            }
        `);
        const row = view.mapper.dtoRowReader.read(
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
        const view = dto.view(AUTHOR, c => [
            c.id,
            c.$fold("formula", c => [
                c.fullName.as("fn")
            ])
        ]);
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
        expect(shapeJson(view.mapper)).toEqual({
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
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        formula: null
                    };
                    const implicit = {
                        fullName: null
                    };
                    this._implicit_fullName_name(implicit).firstName = reader.get(1);
                    this._implicit_fullName_name(implicit).lastName = reader.get(2);
                    return { reader: this, parents, dto, implicit, typeName: undefined };
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
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return [
                                row.implicit.fullName?.name?.firstName, 
                                row.implicit.fullName?.name?.lastName
                            ];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] == null && dependency[1] == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] + "\\x1F" + dependency[1];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            this._formula(row.dto).fn = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolveTsFormulas(row) {
                    const fullNameValue = ThisClass.__FULL_NAME__TS_FORMULA_FN(row.implicit.fullName);
                    this._formula(row.dto).fn = fullNameValue;
                }
                static __FULL_NAME__TS_FORMULA_FN = $tsFormulaFunMap.get("fullName");
            }
        `);
        const row = view.mapper.dtoRowReader.read(
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

    it("tsFormulaWithMapper", () => {
        const view = dto.view(AUTHOR, c => [
            c.id,
            c.fullName.output(z.string(), value => value.toUpperCase())
        ]);
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
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        fullName: null
                    };
                    const implicit = {
                        fullName: null
                    };
                    this._implicit_fullName_name(implicit).firstName = reader.get(1);
                    this._implicit_fullName_name(implicit).lastName = reader.get(2);
                    return { reader: this, parents, dto, implicit, typeName: undefined };
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
                static __FULL_NAME__OUTPUT_FN = $outputFunMap.get("fullName");
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return [
                                row.implicit.fullName?.name?.firstName, 
                                row.implicit.fullName?.name?.lastName
                            ];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] == null && dependency[1] == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] + "\\x1F" + dependency[1];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            row.dto.fullName = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolveTsFormulas(row) {
                    const fullNameValue = ThisClass.__FULL_NAME__OUTPUT_FN(ThisClass.__FULL_NAME__TS_FORMULA_FN(row.implicit.fullName));
                    row.dto.fullName = fullNameValue;
                }
                static __FULL_NAME__TS_FORMULA_FN = $tsFormulaFunMap.get("fullName");
            }
        `);
        const row = view.mapper.dtoRowReader.read(undefined, makeReader(1, "Jim", "Green"));
        view.mapper.dtoRowReader.resolveTsFormulas(row);
        expect(row.dto).toEqual({
            "id": 1, 
            "fullName": "JIM GREEN" 
        });
    });

    it("sqlFormula", () => {
        const view = dto.view(BOOK, c => [
            c.authorCount
        ]);
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
        expect(shapeJson(view.mapper)).toEqual({"authorCount":0});
        const row = view.mapper.dtoRowReader.read(
            undefined,
            makeReader(2)
        );
        expect(row.dto).toEqual({
            authorCount: 2
        });
        expect(row.implicit).toEqual(undefined);
    });

    it("dtoLevelTsFormula", () => {
        const view = dto.view(BOOK, c => [
            c.$formula.ts({
                alias: "key",
                valueType: z.string(),
                dependency: c => [
                    c.name,
                    c.edition
                ],
                fn: data => `${data.name}(${data.edition})`
            })
        ]);
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Book",
            "fields": [
                {
                    "prop": "Book.name",
                    "paths": [
                        ["<implicit:key>", "name"]
                    ],
                    "isDependent": true,
                    "columnIndex": 0
                },
                {
                    "prop": "Book.edition",
                    "paths": [
                        ["<implicit:key>", "edition"]
                    ],
                    "isDependent": true,
                    "columnIndex": 1
                },
                {
                    "prop": "Book.$formula(key)",
                    "paths": ["key"],
                    "dependencies": [0, 1]
                }
            ]
        });
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        key: null
                    };
                    const implicit = {
                        key: null
                    };
                    this._implicit_key(implicit).name = reader.get(0);
                    this._implicit_key(implicit).edition = reader.get(1);
                    return { reader: this, parents, dto, implicit, typeName: undefined };
                }
                _implicit_key(implicit) {
                    let o = implicit.key;
                    if (o == null) {
                        implicit.key = o = {
                            name: null, 
                            edition: null
                        };
                    }
                    return o;
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return [
                                row.implicit.key?.name, 
                                row.implicit.key?.edition
                            ];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency[0] == null && dependency[1] == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency[0] + "\\x1F" + dependency[1];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            row.dto.key = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolveTsFormulas(row) {
                    const keyValue = ThisClass.__KEY__TS_FORMULA_FN(row.implicit.key);
                    row.dto.key = keyValue;
                }
                static __KEY__TS_FORMULA_FN = $tsFormulaFunMap.get("key");
            }
        `);
        const row = view.mapper.dtoRowReader.read(undefined, makeReader("Yugabyute", 7));
        view.mapper.dtoRowReader.resolveTsFormulas(row);
        expect(row.dto).toEqual({ 
            key: "Yugabyute(7)"
        });
    });

    it("dtoLevelSqlFormula", () => {
        const view = dto.view(BOOK_STORE, c => [
            c.name,
            c.$formula.sql({
                alias: "avgPrice",
                valueType: z.number(),
                fn: store => dsl.subQuery(BOOK, (q, book) => {
                    q.where(store.id.eq(book.storeId));
                    return q.select(dsl.avg(book.price).asNonNull());
                })
            })
        ]);
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "BookStore",
            "fields": [
                {
                    "prop": "BookStore.name",
                    "paths": ["name"],
                    "columnIndex": 0
                },
                {
                    "prop": "BookStore.$formula(avgPrice)",
                    "paths": ["avgPrice"],
                    "columnIndex": 1
                }
            ]
        });
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0), 
                        avgPrice: reader.get(1)
                    };
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
                }
            }
        `);
    });

    it("dtoLevelByCollection", () => {
        const view = dto.view(BOOK, c => [
            c.name,
            c.edition,
            c.$formula.ts({
                alias: "authorNames",
                valueType: z.array(z.string()),
                dependency: c => [
                    c.authors.with(c => [
                        c.name
                    ])
                ],
                fn: data => data.authors.map(a => `${a.name.firstName} ${a.name.lastName}`)
            })
        ]);
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Book",
            "fields": [
                {
                    "prop": "Book.name",
                    "paths": ["name"],
                    "columnIndex": 0
                },
                {
                    "prop": "Book.edition",
                    "paths": ["edition"],
                    "columnIndex": 1
                },
                {
                    "prop": "Book.id",
                    "paths": [],
                    "isDependent": true,
                    "columnIndex": 2
                },
                {
                    "prop": "Book.authors",
                    "paths": [
                        ["<implicit:authorNames>", "authors"]
                    ],
                    "subMapper": {
                        "entity": "Author",
                        "associatedProp": "Book.authors",
                        "fields": [
                            {
                                "prop": "Author.name.firstName",
                                "paths": [
                                    ["name", "firstName"]
                                ],
                                "columnIndex": 0
                            },
                            {
                                "prop": "Author.name.lastName",
                                "paths": [
                                    ["name", "lastName"]
                                ],
                                "columnIndex": 1
                            }
                        ]
                    },
                    "dependencies": [2],
                    "isDependent": true
                },
                {
                    "prop": "Book.$formula(authorNames)",
                    "paths": ["authorNames"],
                    "dependencies": [3]
                }
            ]
        });
        expect(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0), 
                        edition: reader.get(1), 
                        authorNames: null
                    };
                    const implicit = {
                        _2: reader.get(2), 
                        authorNames: null
                    };
                    return { reader: this, parents, dto, implicit, typeName: undefined };
                }
                _implicit_authorNames(implicit) {
                    let o = implicit.authorNames;
                    if (o == null) {
                        implicit.authorNames = o = {
                            authors: null
                        };
                    }
                    return o;
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return row.implicit._2;
                        case 4:
                            return row.implicit.authorNames?.authors;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency == null;
                        case 4:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency;
                        case 4:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            this._implicit_authorNames(row.implicit).authors = value;
                            break;
                        case 4:
                            row.dto.authorNames = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolveTsFormulas(row) {
                    const authorNamesValue = ThisClass.__AUTHOR_NAMES__TS_FORMULA_FN(row.implicit.authorNames);
                    row.dto.authorNames = authorNamesValue;
                }
                static __AUTHOR_NAMES__TS_FORMULA_FN = $tsFormulaFunMap.get("authorNames");
            }
        `);
    });

    it("dtoLevelByJoinEntity", () => {
        const view = dto.view(STUDENT, c => [
            c.name,
            c.$formula.ts({
                alias: "courseNames",
                valueType: z.array(z.string()),
                dependency: c => [
                    c.courses.with(c => [
                        c.name
                    ])
                ],
                fn: data => data.courses.map(course => course.name)
            })
        ]);
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Student",
            "fields": [
                {
                    "prop": "Student.name",
                    "paths": ["name"],
                    "columnIndex": 0
                },
                {
                    "prop": "Student.id",
                    "paths": [],
                    "isDependent": true,
                    "columnIndex": 1
                },
                {
                    "prop": "Student.learningLinks",
                    "paths": [
                        ["<implicit:courseNames>", "courses"]
                    ],
                    "subMapper": {
                        "entity": "LearningLink",
                        "associatedProp": "Student.learningLinks",
                        "fields": [
                            {
                                "prop": "LearningLink.courseId",
                                "paths": [],
                                "isDependent": true,
                                "columnIndex": 0
                            },
                            {
                                "prop": "LearningLink.course",
                                "paths": [],
                                "subMapper": {
                                    "entity": "Course",
                                    "associatedProp": "LearningLink.course",
                                    "fields": [
                                        {
                                            "prop": "Course.name",
                                            "paths": [
                                                ["..", "name"]
                                            ],
                                            "columnIndex": 0
                                        }
                                    ]
                                },
                                "dependencies": [0]
                            }
                        ]
                    },
                    "dependencies": [1],
                    "isDependent": true
                },
                {
                    "prop": "Student.$formula(courseNames)",
                    "paths": ["courseNames"],
                    "dependencies": [2]
                }
            ]
        });
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0), 
                        courseNames: null
                    };
                    const implicit = {
                        _1: reader.get(1), 
                        courseNames: null
                    };
                    return { reader: this, parents, dto, implicit, typeName: undefined };
                }
                _implicit_courseNames(implicit) {
                    let o = implicit.courseNames;
                    if (o == null) {
                        implicit.courseNames = o = {
                            courses: null
                        };
                    }
                    return o;
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return row.implicit._1;
                        case 3:
                            return row.implicit.courseNames?.courses;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency == null;
                        case 3:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency;
                        case 3:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            this._implicit_courseNames(row.implicit).courses = value;
                            break;
                        case 3:
                            row.dto.courseNames = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolveTsFormulas(row) {
                    const courseNamesValue = ThisClass.__COURSE_NAMES__TS_FORMULA_FN(row.implicit.courseNames);
                    row.dto.courseNames = courseNamesValue;
                }
                static __COURSE_NAMES__TS_FORMULA_FN = $tsFormulaFunMap.get("courseNames");
            }
        `);
    });
});