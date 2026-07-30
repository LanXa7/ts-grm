import { dsl, dto } from "@/index";
import { describe, it, expect } from "vitest";
import { AUTHOR, BOOK, BOOK_STORE } from "../../model/model";
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
                static __FULL_NAME__TS_FORMULA_FN = $entity.expandedPropMap.get("fullName").getTsFormulaFn(false);
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
                static __FULL_NAME__TS_FORMULA_FN = $entity.expandedPropMap.get("fullName").getTsFormulaFn(false);
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
                static __FULL_NAME__TS_FORMULA_FN = $entity.expandedPropMap.get("fullName").getTsFormulaFn(false);
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
                static __KEY__TS_FORMULA_FN = $dtoTsFormulaFunMap.get("key");
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
});