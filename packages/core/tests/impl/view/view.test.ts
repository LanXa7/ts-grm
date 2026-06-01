import { describe, expect, it } from "vitest";
import { dto } from "@/schema/dto";
import { BOOK, BOOK_STORE } from "../../model/model";
import { expectCode } from "../../utils";
import { mapperJson, makeReader, shapeJson } from "./utils";

describe("ViewTest", () => {

    it("allScalars", () => {
        const view = dto.view(BOOK, $ => $
            .allScalars()
            .remove("price")
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Book",
            "fields": [
                {
                    "columnIndex": 0,
                    "prop": "Book.id",
                    "paths": ["id"]
                },
                {
                    "columnIndex": 1,
                    "prop": "Book.name",
                    "paths": ["name"]
                },
                {
                    "columnIndex": 2,
                    "prop": "Book.edition",
                    "paths": ["edition"]
                }
            ]
        });
        expect(shapeJson(view.mapper)).toEqual({
            "id": 0,
            "name": 1,
            "edition": 2
        });

        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        edition: reader.get(2)
                    };
                    return { reader: this, parents, dto, implicit: undefined };
                }
            }
        `);
        const row = view.mapper.dtoRowReader.read(
            undefined, 
            makeReader(3, "GraphQL in Action", 2)
        );
        expect(row.dto).toEqual({
            id: 3,
            name: "GraphQL in Action",
            edition: 2
        });
        expect(row.implicit).toEqual(undefined);
    });

    it("wideAssociations", () => {
        const view = dto.view(BOOK, $ => $
            .allScalars()
            .remove("id", "price")
            .store($ => $.allScalars())
            .authors($ => $.id.name())
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Book",
            "fields": [
                {
                    "columnIndex": 0,
                    "prop": "Book.name",
                    "paths": ["name"]
                },
                {
                    "columnIndex": 1,
                    "prop": "Book.edition",
                    "paths": ["edition"]
                },
                {
                    "columnIndex": 2,
                    "isDependent": true,
                    "prop": "Book.storeId",
                    "paths": [] // implicit `Book.storeId` to fetch `Book.store`
                },
                {
                    "dependencies": [2],
                    "prop": "Book.store",
                    "paths": ["store"],
                    "subMapper": {
                        "entity": "BookStore",
                        "associatedProp": "Book.store",
                        "fields": [
                            {
                                "columnIndex": 0,
                                "prop": "BookStore.id",
                                "paths": ["id"]
                            },
                            {
                                "columnIndex": 1,
                                "prop": "BookStore.name",
                                "paths": ["name"]
                            },
                            {
                                "columnIndex": 2,
                                "prop": "BookStore.version",
                                "paths": ["version"]
                            }
                        ]
                    }
                },
                {
                    "columnIndex": 3,
                    "isDependent": true,
                    "prop": "Book.id",
                    "paths": [] // Implicit field `Book.id` to fetch `Book.authors`
                },
                {
                    "dependencies": [4],
                    "prop": "Book.authors",
                    "paths": ["authors"],
                    "subMapper": {
                        "entity": "Author",
                        "associatedProp": "Book.authors",
                        "fields": [
                            {
                                "columnIndex": 0,
                                "prop": "Author.id",
                                "paths": ["id"]
                            },
                            {
                                "columnIndex": 1,
                                "prop": "Author.name.firstName",
                                "paths": [
                                    ["name", "firstName"]
                                ]
                            },
                            {
                                "columnIndex": 2,
                                "prop": "Author.name.lastName",
                                "paths": [
                                    ["name", "lastName"]
                                ]
                            }
                        ]
                    }
                }
            ]
        });
        expect(shapeJson(view.mapper)).toEqual({
                "name": 0,
                "edition": 1,
                "store": {
                    "__ref": {
                        "id": 0,
                        "name": 1,
                        "version": 2
                    }
                },
                "authors": {
                    "__array": {
                        "id": 0,
                        "name": {
                            "firstName": 1,
                            "lastName": 2
                        }
                    }
                },
                "__implicit": {
                    "_2": 2,
                    "_4": 3
                }
        });

        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0), 
                        edition: reader.get(1), 
                        store: null, 
                        authors: null
                    };
                    const implicit = {
                        _2: reader.get(2), 
                        _4: reader.get(3)
                    };
                    return { reader: this, parents, dto, implicit };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return row.implicit._2;
                        case 5:
                            return row.implicit._4;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency == null;
                        case 5:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency;
                        case 5:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            row.dto.store = value;
                            break;
                        case 5:
                            row.dto.authors = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const row = view.mapper.dtoRowReader.read(
            undefined, 
            makeReader("GraphQL in Action", 3, 2, 12)
        );
        expect(row.dto).toEqual({
            authors: null,
            edition: 3,
            name: "GraphQL in Action",
            store: null
        });
        expect(row.implicit).toEqual({
            _2: 2,
            _4: 12
        });

        const storeMapper = view
            .mapper
            .fields
            .find(f => f.prop.name === "store")!
            .subMapper!;
        expectCode(storeMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        version: reader.get(2)
                    };
                    return { reader: this, parents, dto, implicit: undefined };
                }
            }
        `);
        const storeRow = storeMapper.dtoRowReader.read(
            undefined,
            makeReader(2, "MANNING", 0)
        );
        expect(storeRow.dto).toEqual({
            id: 2,
            name: "MANNING",
            version: 0
        });

        const authorMapper = view
            .mapper
            .fields
            .find(f => f.prop.name === "authors")!
            .subMapper!;
        expectCode(authorMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: null
                    };
                    this._name(dto).firstName = reader.get(1);
                    this._name(dto).lastName = reader.get(2);
                    return { reader: this, parents, dto, implicit: undefined };
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
            }
        `);
        const authorRow = authorMapper.dtoRowReader.read(
            undefined, 
            makeReader(3, "Alex", "Banks")
        );
        expect(authorRow.dto).toEqual({
            id: 3,
            name: {
                firstName: "Alex",
                lastName: "Banks"
            }
        });
    });

    it("deepAssociations", () => {
        const view = dto.view(BOOK_STORE, $ => $
            .id
            .name
            .books($ => $
                .id
                .name
                .authors($ => $
                    .id
                    .name()
                )
            )
        );

        expect(mapperJson(view.mapper)).toEqual({
            "entity": "BookStore",
            "fields": [
                {
                    "columnIndex": 0,
                    "isDependent": true,
                    "prop": "BookStore.id",
                    "paths": ["id"]
                },
                {
                    "columnIndex": 1,
                    "prop": "BookStore.name",
                    "paths": ["name"]
                },
                {
                    "dependencies": [0],
                    "prop": "BookStore.books",
                    "paths": ["books"],
                    "subMapper": {
                        "entity": "Book",
                        "associatedProp": "BookStore.books",
                        "fields": [
                            {
                                "columnIndex": 0,
                                "isDependent": true,
                                "prop": "Book.id",
                                "paths": ["id"]
                            },
                            {
                                "columnIndex": 1,
                                "prop": "Book.name",
                                "paths": ["name"]
                            },
                            {
                                "dependencies": [0],
                                "prop": "Book.authors",
                                "paths": ["authors"],
                                "subMapper": {
                                    "entity": "Author",
                                    "associatedProp": "Book.authors",
                                    "fields": [
                                        {
                                            "columnIndex": 0,
                                            "prop": "Author.id",
                                            "paths": ["id"]
                                        },
                                        {
                                            "columnIndex": 1,
                                            "prop": "Author.name.firstName",
                                            "paths": [
                                                ["name", "firstName"]
                                            ]
                                        },
                                        {
                                            "columnIndex": 2,
                                            "prop": "Author.name.lastName",
                                            "paths": [
                                                ["name", "lastName"]
                                            ]
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        });
        expect(shapeJson(view.mapper)).toEqual({
            "id": 0,
            "name": 1,
            "books": {
                "__array": {
                    "id": 0,
                    "name": 1,
                    "authors": {
                        "__array": {
                            "id": 0,
                            "name": {
                                "firstName": 1,
                                "lastName": 2
                            }
                        }
                    }
                }
            }
        });

        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        books: null
                    };
                    return { reader: this, parents, dto, implicit: undefined };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return row.dto.id;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            row.dto.books = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const row = view.mapper.dtoRowReader.read(
            undefined, 
            makeReader(2, "MANNING")
        );
        expect(row.dto).toEqual({
            id: 2,
            name: "MANNING",
            books: null
        });
        
        const bookMapper = view.mapper.fields.find(f => f.prop.name === "books")!.subMapper!;
        expectCode(bookMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        authors: null
                    };
                    return { reader: this, parents, dto, implicit: undefined };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return row.dto.id;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            row.dto.authors = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const bookRow = bookMapper.dtoRowReader.read(
            undefined, 
            makeReader(12, "GraphQL in Action")
        );
        expect(bookRow.dto).toEqual({
            id: 12,
            name: "GraphQL in Action",
            authors: null
        });

        const authorMapper = bookMapper.fields.find(f => f.prop.name === "authors")!.subMapper!;
        expectCode(authorMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: null
                    };
                    this._name(dto).firstName = reader.get(1);
                    this._name(dto).lastName = reader.get(2);
                    return { reader: this, parents, dto, implicit: undefined };
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
            }
        `);
        const authorRow = authorMapper.dtoRowReader.read(
            undefined, 
            makeReader(3, "Alex", "Banks")
        );
        expect(authorRow.dto).toEqual({
            id: 3,
            name: {
                firstName: "Alex",
                lastName: "Banks"
            }
        });
    });

    it("implicitDeepAssociations", () => {
        const view = dto.view(BOOK_STORE, $ => $
            .name
            .books($ => $
                .name
                .authors($ => $
                    .name()
                )
            )
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "BookStore",
            "fields": [
                {
                    "columnIndex": 0,
                    "prop": "BookStore.name",
                    "paths": ["name"]
                },
                {
                    "columnIndex": 1,
                    "prop": "BookStore.id",
                    "paths": [], // Implicit property to fetch `BookStore.books`
                    "isDependent": true
                },
                {
                    "prop": "BookStore.books",
                    "paths": [
                        "books"
                    ],
                    "subMapper": {
                        "entity": "Book",
                        "associatedProp": "BookStore.books",
                        "fields": [
                            {
                                "columnIndex": 0,
                                "prop": "Book.name",
                                "paths": [
                                    "name"
                                ]
                            },
                            {
                                "columnIndex": 1,
                                "prop": "Book.id",
                                "paths": [], // Implicit property to fetch `Book.authors`
                                "isDependent": true
                            },
                            {
                                "prop": "Book.authors",
                                "paths": [
                                    "authors"
                                ],
                                "subMapper": {
                                    "entity": "Author",
                                    "associatedProp": "Book.authors",
                                    "fields": [
                                        {
                                            "columnIndex": 0,
                                            "prop": "Author.name.firstName",
                                            "paths": [
                                                ["name", "firstName"]
                                            ]
                                        },
                                        {
                                            "columnIndex": 1,
                                            "prop": "Author.name.lastName",
                                            "paths": [
                                                ["name", "lastName"]
                                            ]
                                        }
                                    ]
                                },
                                "dependencies": [1]
                            }
                        ]
                    },
                    "dependencies": [1]
                }
            ]
        });
        expect(shapeJson(view.mapper)).toEqual({
            "name": 0,
            "__implicit": {
                "_1": 1
            },
            "books": {
                "__array": {
                    "name": 0,
                    "__implicit": {
                        "_1": 1
                    },
                    "authors": {
                        "__array": {
                            "name": {
                                "firstName": 0,
                                "lastName": 1
                            }
                        }
                    }
                }
            }
        });

        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0), 
                        books: null
                    };
                    const implicit = {
                        _1: reader.get(1)
                    };
                    return { reader: this, parents, dto, implicit };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return row.implicit._1;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            row.dto.books = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const row = view.mapper.dtoRowReader.read(
            undefined, 
            makeReader("MANNING", 2)
        );
        expect(row.dto).toEqual({name: "MANNING", books: null});
        expect(row.implicit).toEqual({"_1": 2});

        const bookMapper = view.mapper.fields.find(f => f.prop.name === "books")!.subMapper!;
        expectCode(bookMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0), 
                        authors: null
                    };
                    const implicit = {
                        _1: reader.get(1)
                    };
                    return { reader: this, parents, dto, implicit };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return row.implicit._1;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            row.dto.authors = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const bookRow = bookMapper.dtoRowReader.read(
            undefined,
            makeReader("GraphQL in Action", 12)
        );
        expect(bookRow.dto).toEqual({name: "GraphQL in Action", "authors": null});
        expect(bookRow.implicit).toEqual({"_1": 12});

        const authorMapper = bookMapper.fields.find(f => f.prop.name === "authors")!.subMapper!;
        expectCode(authorMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: null
                    };
                    this._name(dto).firstName = reader.get(0);
                    this._name(dto).lastName = reader.get(1);
                    return { reader: this, parents, dto, implicit: undefined };
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
            }
        `);
        const authorRow = authorMapper.dtoRowReader.read(
            undefined, 
            makeReader("Alex", "Banks")
        );
        expect(authorRow.dto).toEqual({
            name: {
                firstName: "Alex",
                lastName: "Banks"
            }
        });
    });

    it("rename", () => {
        const view = dto.view(BOOK, $ => $
            .id.$as("bookId")
            .fold("key", $ => $
                .name.$as("bookName")
                .edition.$as("bookEdition")
            )
            .fold("associations", $ => $
                .authors($ => $
                    .allScalars()
                    .remove("name")
                    .flat({
                        prop: "name",
                        prefix: "flatten"
                    }, $ => $
                        .firstName.$as("fn")
                        .lastName.$as("ln")
                    )
                )
            )
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Book",
            "fields": [
                {
                    "columnIndex": 0,
                    "isDependent": true,
                    "prop": "Book.id",
                    "paths": [
                        "bookId"
                    ]
                },
                {
                    "columnIndex": 1,
                    "prop": "Book.name",
                    "paths": [
                        [
                            "key",
                            "bookName"
                        ]
                    ]
                },
                {
                    "columnIndex": 2,
                    "prop": "Book.edition",
                    "paths": [
                        [
                            "key",
                            "bookEdition"
                        ]
                    ]
                },
                {
                    "dependencies": [0],
                    "prop": "Book.authors",
                    "paths": [
                        [
                            "associations",
                            "authors"
                        ]
                    ],
                    "subMapper": {
                        "entity": "Author",
                        "associatedProp": "Book.authors",
                        "fields": [
                            {
                                "columnIndex": 0,
                                "prop": "Author.id",
                                "paths": ["id"]
                            },
                            {
                                "columnIndex": 1,
                                "prop": "Author.name.firstName",
                                "paths": ["flattenFn"]
                            },
                            {
                                "columnIndex": 2,
                                "prop": "Author.name.lastName",
                                "paths": ["flattenLn"]
                            }
                        ]
                    }
                }
            ]
        });
        expect(shapeJson(view.mapper)).toEqual({
            "bookId": 0,
            "key": {
                "bookName": 1,
                "bookEdition": 2
            },
            "associations": {
                "authors": {
                    "__array": {
                        "id": 0,
                        "flattenFn": 1,
                        "flattenLn": 2
                    }
                }
            }
        });

        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        bookId: reader.get(0), 
                        key: null, 
                        associations: null
                    };
                    this._key(dto).bookName = reader.get(1);
                    this._key(dto).bookEdition = reader.get(2);
                    return { reader: this, parents, dto, implicit: undefined };
                }
                _key(dto) {
                    let o = dto.key;
                    if (o == null) {
                        dto.key = o = {
                            bookName: null, 
                            bookEdition: null
                        };
                    }
                    return o;
                }
                _associations(dto) {
                    let o = dto.associations;
                    if (o == null) {
                        dto.associations = o = {
                            authors: null
                        };
                    }
                    return o;
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return row.dto.bookId;
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
                            this._associations(row.dto).authors = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const row = view.mapper.dtoRowReader.read(
            undefined, 
            makeReader(12, "GraphQL in Action", 3)
        );
        expect(row.dto).toEqual({
            bookId: 12,
            key: {
                bookName: "GraphQL in Action",
                bookEdition: 3
            },
            associations: null
        });

        const authorMapper = view.mapper.fields.find(f => f.prop.name === "authors")!.subMapper!;
        expectCode(authorMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        flattenFn: reader.get(1), 
                        flattenLn: reader.get(2)
                    };
                    return { reader: this, parents, dto, implicit: undefined };
                }
            }
        `);
        const authorRow = authorMapper.dtoRowReader.read(
            undefined,
            makeReader(3, "Alex", "Banks")
        );
        expect(authorRow.dto).toEqual({
            id: 3,
            flattenFn: "Alex",
            flattenLn: "Banks"
        });
    });
});
