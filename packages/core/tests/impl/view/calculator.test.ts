import { describe, expect, it } from "vitest";
import { BOOK, BOOK_STORE } from "../../model/model";
import { mapperJson, shapeJson } from "./utils";
import { expectCode } from "../../utils";
import { dto } from "@/index";

describe("ComputedTest", () => {

    it("targetCalculator", () => {
        const view = dto.view(BOOK_STORE, c => [
            c.newestBooks.with(c => [
                c.id,
                c.name
            ])
        ]);
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
        expect(shapeJson(view.mapper)).toEqual({
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
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        newestBooks: null
                    };
                    const implicit = {
                        _0: reader.get(0)
                    };
                    return { reader: this, parents, dto, implicit, typeName: undefined };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return row.implicit._0;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            row.dto.newestBooks = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
    });

    it("parameterizedTargetCalculator", () => {
        const view = dto.view(BOOK_STORE, c => [
            c.id,
            c.$parameterized("specifiedBooks", {maxPrice: 20}).as("cheapBooks"),
            c.$parameterized("specifiedBooks", {minPrice: 60}).as("expensiveBooks").with(c => [
                c.id,
                c.name
            ])
        ]);
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
        expect(shapeJson(view.mapper)).toEqual({
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
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        cheapBooks: null, 
                        expensiveBooks: null
                    };
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return row.dto.id;
                        case 2:
                            return row.dto.id;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return dependency == null;
                        case 2:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return dependency;
                        case 2:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            row.dto.cheapBooks = value;
                            break;
                        case 2:
                            row.dto.expensiveBooks = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const cheapBooksMapper = view
            .mapper
            .fields
            .find(f => f.prop.name === "specifiedBooks" && f.parameter.maxPrice != null)!
            .subMapper!;
        expectCode(cheapBooksMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        edition: reader.get(2), 
                        price: reader.get(3)
                    };
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
                }
            }
        `);
        const expensiveBooksMapper = view
            .mapper
            .fields
            .find(f => f.prop.name === "specifiedBooks" && f.parameter.minPrice != null)!
            .subMapper!;
        expectCode(expensiveBooksMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1)
                    };
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
                }
            }
        `);
    });

    it("formulaBasedOnAssociation", () => {
        const view = dto.view(BOOK_STORE, c => [
            c.id,
            c.bookNames
        ]);
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "BookStore",
            "fields": [
                {
                    "prop": "BookStore.id",
                    "paths": ["id"],
                    "isDependent": true,
                    "columnIndex": 0
                },
                {
                    "prop": "BookStore.books",
                    "paths": [
                        ["<implicit:bookNames>", "books"]
                    ],
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
                                "columnIndex": 1,
                                "paths": ["edition"],
                                "prop": "Book.edition"
                            }
                        ]
                    },
                    "dependencies": [0],
                    "isDependent": true
                },
                {
                    "prop": "BookStore.bookNames",
                    "paths": ["bookNames"],
                    "dependencies": [1]
                }
            ]
        });
        expect(shapeJson(view.mapper)).toEqual({
            "id": 0,
            "__implicit": {
                "bookNames": {
                    "books": {
                        "__array": {
                            "name": 0,
                            "edition": 1
                        }
                    }
                }
            },
            "bookNames": "bookNames"
        });
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        bookNames: null
                    };
                    const implicit = {
                        bookNames: null
                    };
                    return { reader: this, parents, dto, implicit, typeName: undefined };
                }
                _implicit_bookNames(implicit) {
                    let o = implicit.bookNames;
                    if (o == null) {
                        implicit.bookNames = o = {
                            books: null
                        };
                    }
                    return o;
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return row.dto.id;
                        case 2:
                            return row.implicit.bookNames?.books;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return dependency == null;
                        case 2:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return dependency;
                        case 2:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            this._implicit_bookNames(row.implicit).books = value;
                            break;
                        case 2:
                            row.dto.bookNames = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolveTsFormulas(row) {
                    const bookNamesValue = ThisClass.__BOOK_NAMES__TS_FORMULA_FN(row.implicit.bookNames);
                    row.dto.bookNames = bookNamesValue;
                }
                static __BOOK_NAMES__TS_FORMULA_FN = $tsFormulaFunMap.get("bookNames");
            }
        `);
    });

    it("flatFormulaBaseOnAssocoation", () => {
        const view = dto.view(BOOK, c => [
            c.name,
            c.edition,
            c.$flat("store").with(c => [
                c.bookNames
            ])
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
                    "prop": "Book.storeId",
                    "paths": [],
                    "isDependent": true,
                    "columnIndex": 2
                },
                {
                    "prop": "Book.store",
                    "paths": [],
                    "subMapper": {
                        "entity": "BookStore",
                        "associatedProp": "Book.store",
                        "fields": [
                            {
                                "prop": "BookStore.id",
                                "paths": [],
                                "isDependent": true,
                                "columnIndex": 0
                            },
                            {
                                "prop": "BookStore.books",
                                "paths": [
                                    ["<implicit:bookNames>", "books"]
                                ],
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
                                            "prop": "Book.edition",
                                            "paths": ["edition"],
                                            "columnIndex": 1
                                        }
                                    ]
                                },
                                "dependencies": [0],
                                "isDependent": true
                            },
                            {
                                "prop": "BookStore.bookNames",
                                "paths": [
                                    ["..", "storeBookNames"]
                                ],
                                "dependencies": [1]
                            }
                        ]
                    },
                    "dependencies": [2]
                }
            ]
        });
        expect(shapeJson(view.mapper)).toEqual({
            "name": 0,
            "edition": 1,
            "__implicit": {
                "_2": 2
            },
            "storeBookNames": undefined,
            "store": {
                "__implicit": {
                    "_0": 0,
                    "bookNames": {
                        "books": {
                            "__array": {
                                "name": 0,
                                "edition": 1
                            }
                        }
                    }
                }
            }
        });
        expect(Object.keys(shapeJson(view.mapper))).toEqual(
            ['name', 'edition', '__implicit', 'store', 'storeBookNames']
        );
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0), 
                        edition: reader.get(1), 
                        storeBookNames: null
                    };
                    const implicit = {
                        _2: reader.get(2)
                    };
                    return { reader: this, parents, dto, implicit, typeName: undefined };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return row.implicit._2;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);

        const storeMapper = view.mapper.fields.find(f => f.prop.name === "store")!.subMapper!;
        expect(mapperJson(storeMapper)).toEqual({
            "entity": "BookStore",
            "associatedProp": "Book.store",
            "fields": [
                {
                    "prop": "BookStore.id",
                    "paths": [],
                    "isDependent": true,
                    "columnIndex": 0
                },
                {
                    "prop": "BookStore.books",
                    "paths": [
                        ["<implicit:bookNames>", "books"]
                    ],
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
                                "prop": "Book.edition",
                                "paths": ["edition"],
                                "columnIndex": 1
                            }
                        ]
                    },
                    "dependencies": [0],
                    "isDependent": true
                },
                {
                    "prop": "BookStore.bookNames",
                    "paths": [
                        ["..", "storeBookNames"]
                    ],
                    "dependencies": [1]
                }
            ]
        });
        expectCode(storeMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                    };
                    const implicit = {
                        _0: reader.get(0), 
                        bookNames: null
                    };
                    return { reader: this, parents, dto, implicit, typeName: undefined };
                }
                _implicit_bookNames(implicit) {
                    let o = implicit.bookNames;
                    if (o == null) {
                        implicit.bookNames = o = {
                            books: null
                        };
                    }
                    return o;
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return row.implicit._0;
                        case 2:
                            return row.implicit.bookNames?.books;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return dependency == null;
                        case 2:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return dependency;
                        case 2:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            this._implicit_bookNames(row.implicit).books = value;
                            break;
                        case 2:
                            for (const parent of row.parents) {
                                parent.dto.storeBookNames = value;
                            }
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolveTsFormulas(row) {
                    const bookNamesValue = ThisClass.__BOOK_NAMES__TS_FORMULA_FN(row.implicit.bookNames);
                    for (const parent of row.parents) {
                        parent.dto.storeBookNames = bookNamesValue;
                    }
                }
                static __BOOK_NAMES__TS_FORMULA_FN = $tsFormulaFunMap.get("bookNames");
            }
        `);
    });
});