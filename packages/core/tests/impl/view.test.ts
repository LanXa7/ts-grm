import { describe, expect, it } from "vitest";
import { DtoMapper } from "@/impl/dto_mapper";
import { dto } from "@/schema/dto";
import { BOOK, AUTHOR, BOOK_STORE, TREE_NODE, ORDER_ITEM } from "../model/model";
import { buildShape } from "@/impl/shape";
import { DataReader } from "@/impl/data_reader";
import { expectCode } from "../utils";

describe("TestView", () => {
 
    function mapperJson(mapper: DtoMapper): any {
        return {
            entity: mapper.entity.name,
            associatedProp: mapper.associatedProp?.toString(),
            fields: mapper.fields.map(f => {
                return {
                    prop: f.prop.toString(),
                    paths: f.paths,
                    subMapper: f.subMapper != null
                        ? mapperJson(f.subMapper)
                        : undefined,
                    recursiveDepth: f.recursiveDepth,
                    dependencies: f.dependencies,
                    isDependent: f.isDependent ? true : undefined,
                    columnIndex: f.columnIndex
                };
            })
        }
    }

    function makeReader(...args: any[]): DataReader {
        return new class implements DataReader {
            next(): boolean {
                throw new Error("Unsupported Operation Error");
            }
            get(index: number): any {
                return args[index];
            }
        }
    }

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
        expect(buildShape(view.mapper)).toEqual({
            "id": 0,
            "name": 1,
            "edition": 2
        });

        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        edition: reader.get(2)
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
        const row = view.mapper.rowReader.read(
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
        expect(buildShape(view.mapper)).toEqual({
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

        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
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
                    return { reader: this, parent, dto, implicit };
                }
            }
        `);
        const row = view.mapper.rowReader.read(
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
        expectCode(storeMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        version: reader.get(2)
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
        const storeRow = storeMapper.rowReader.read(
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
        expectCode(authorMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: null
                    };
                    this._name(dto).firstName = reader.get(1);
                    this._name(dto).lastName = reader.get(2);
                    return { reader: this, parent, dto, implicit: undefined };
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
        const authorRow = authorMapper.rowReader.read(
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

    it("deepAssocitions", () => {
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
        expect(buildShape(view.mapper)).toEqual({
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

        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        books: null
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
        const row = view.mapper.rowReader.read(
            undefined, 
            makeReader(2, "MANNING")
        );
        expect(row.dto).toEqual({
            id: 2,
            name: "MANNING",
            books: null
        });
        
        const bookMapper = view.mapper.fields.find(f => f.prop.name === "books")!.subMapper!;
        expectCode(bookMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        authors: null
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
        const bookRow = bookMapper.rowReader.read(
            undefined, 
            makeReader(12, "GraphQL in Action")
        );
        expect(bookRow.dto).toEqual({
            id: 12,
            name: "GraphQL in Action",
            authors: null
        });

        const authorMapper = bookMapper.fields.find(f => f.prop.name === "authors")!.subMapper!;
        expectCode(authorMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: null
                    };
                    this._name(dto).firstName = reader.get(1);
                    this._name(dto).lastName = reader.get(2);
                    return { reader: this, parent, dto, implicit: undefined };
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
        const authorRow = authorMapper.rowReader.read(
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
        expect(buildShape(view.mapper)).toEqual({
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

        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        name: reader.get(0), 
                        books: null
                    };
                    const implicit = {
                        _1: reader.get(1)
                    };
                    return { reader: this, parent, dto, implicit };
                }
            }
        `);
        const row = view.mapper.rowReader.read(
            undefined, 
            makeReader("MANNING", 2)
        );
        expect(row.dto).toEqual({name: "MANNING", books: null});
        expect(row.implicit).toEqual({"_1": 2});

        const bookMapper = view.mapper.fields.find(f => f.prop.name === "books")!.subMapper!;
        expectCode(bookMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        name: reader.get(0), 
                        authors: null
                    };
                    const implicit = {
                        _1: reader.get(1)
                    };
                    return { reader: this, parent, dto, implicit };
                }
            }
        `);
        const bookRow = bookMapper.rowReader.read(
            undefined,
            makeReader("GraphQL in Action", 12)
        );
        expect(bookRow.dto).toEqual({name: "GraphQL in Action", "authors": null});
        expect(bookRow.implicit).toEqual({"_1": 12});

        const authorMapper = bookMapper.fields.find(f => f.prop.name === "authors")!.subMapper!;
        expectCode(authorMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        name: null
                    };
                    this._name(dto).firstName = reader.get(0);
                    this._name(dto).lastName = reader.get(1);
                    return { reader: this, parent, dto, implicit: undefined };
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
        const authorRow = authorMapper.rowReader.read(
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

    it("flatAssociation", () => {

        const view = dto.view(BOOK, $ => $
            .allScalars()
            .flat("store", $ => $
                .id
                .name
            )
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
                },
                {
                    "columnIndex": 3,
                    "prop": "Book.price",
                    "paths": ["price"]
                },
                {
                    "columnIndex": 4,
                    "isDependent": true,
                    "prop": "Book.storeId",
                    "paths": [] // Implicit property `Book.storeId` to fetch `Book.store`
                },
                {
                    "dependencies": [4],
                    "prop": "Book.store",
                    "paths": [], // Implicit property because of flatten operation.
                    "subMapper": {
                        "entity": "BookStore",
                        "associatedProp": "Book.store",
                        "fields": [
                            {
                                "columnIndex": 0,
                                "prop": "BookStore.id",
                                "paths": [
                                    ["..", "storeId"]
                                ]
                            },
                            {
                                "columnIndex": 1,
                                "prop": "BookStore.name",
                                "paths": [
                                    ["..", "storeName"]
                                ]
                            }
                        ]
                    }
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "id": 0,
            "name": 1,
            "edition": 2,
            "price": 3,
            "storeId": undefined,
            "storeName": undefined,
            "__implicit": {
                "_4": 4
            }
        });

        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        edition: reader.get(2), 
                        price: reader.get(3), 
                        storeId: null, 
                        storeName: null
                    };
                    const implicit = {
                        _4: reader.get(4)
                    };
                    return { reader: this, parent, dto, implicit };
                }
            }
        `);
        const row = view.mapper.rowReader.read(
            undefined, 
            makeReader(12, "GraphQL in Action", 3, 59.9, 2)
        );
        expect(row.dto).toEqual({
            id: 12,
            name: "GraphQL in Action",
            edition: 3,
            price: 59.9,
            storeId: null,
            storeName: null
        });

        const storeMapper = view.mapper.fields.find(f => f.prop.name === "store")!.subMapper!;
        expectCode(storeMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                    };
                    parent.dto.storeId = reader.get(0);
                    parent.dto.storeName = reader.get(1);
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
        storeMapper.rowReader.read(
            row, 
            makeReader(2, "MANNING")
        );
        expect(row.dto).toEqual({
            id: 12,
            name: "GraphQL in Action",
            edition: 3,
            price: 59.9,
            storeId: 2,
            storeName: "MANNING"
        });
    });

    it("flatEmbedded", () => {
        const view = dto.view(AUTHOR, $ => $
            .id
            .flat({
                prop: "name",
                prefix: "flatten"
            })
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Author",
            "fields": [
                {
                    "columnIndex": 0,
                    "prop": "Author.id",
                    "paths": ["id"]
                },
                {
                    "columnIndex": 1,
                    "prop": "Author.name.firstName",
                    "paths": ["flattenFirstName"]
                },
                {
                    "columnIndex": 2,
                    "prop": "Author.name.lastName",
                    "paths": ["flattenLastName"]
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "id": 0,
            "flattenFirstName": 1,
            "flattenLastName": 2
        });

        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        flattenFirstName: reader.get(1), 
                        flattenLastName: reader.get(2)
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
        const row = view.mapper.rowReader.read(
            undefined, 
            makeReader(3, "Alex", "Banks")
        );
        expect(row.dto).toEqual({
            id: 3,
            flattenFirstName: "Alex",
            flattenLastName: "Banks"
        });
    });

    it("foldScalars", () => {
        const view = dto.view(BOOK, $ => $
            .id
            .fold("key", $ => $.name.edition)
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
                    "paths": [
                        ["key", "name"]
                    ]
                },
                {
                    "columnIndex": 2,
                    "prop": "Book.edition",
                    "paths": [
                        ["key", "edition"]
                    ]
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "id": 0,
            "key": {
                "name": 1,
                "edition": 2
            }
        });
    });

    it("foldAssociations", () => {
        const view = dto.view(BOOK, $ => $
            .id
            .fold("associations", $ => $
                .authors($ => $
                    .allScalars()
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
                    "paths": ["id"]
                },
                {
                    "dependencies": [0],
                    "prop": "Book.authors",
                    "paths": [
                        ["associations", "authors"]
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
        expect(buildShape(view.mapper)).toEqual({
            "id": 0,
            "associations": {
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
        });

        expect(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        associations: null
                    };
                    return { reader: this, parent, dto, implicit: undefined };
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
            }
        `);
        const row = view.mapper.rowReader.read(
            undefined, 
            makeReader(12)
        );
        expect(row.dto).toEqual({
            id: 12,
            associations: null
        });

        const authorMapper = view.mapper.fields.find(f => f.prop.name === "authors")!.subMapper!;
        expectCode(authorMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: null
                    };
                    this._name(dto).firstName = reader.get(1);
                    this._name(dto).lastName = reader.get(2);
                    return { reader: this, parent, dto, implicit: undefined };
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
        const authorRow = authorMapper.rowReader.read(
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
        expect(buildShape(view.mapper)).toEqual({
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

        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        bookId: reader.get(0), 
                        key: null, 
                        associations: null
                    };
                    this._key(dto).bookName = reader.get(1);
                    this._key(dto).bookEdition = reader.get(2);
                    return { reader: this, parent, dto, implicit: undefined };
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
            }
        `);
        const row = view.mapper.rowReader.read(
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
        expectCode(authorMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        flattenFn: reader.get(1), 
                        flattenLn: reader.get(2)
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
        const authorRow = authorMapper.rowReader.read(
            undefined,
            makeReader(3, "Alex", "Banks")
        );
        expect(authorRow.dto).toEqual({
            id: 3,
            flattenFn: "Alex",
            flattenLn: "Banks"
        });
    });

    it("deepFlat", () => {
        const view = dto.view(TREE_NODE, $ => $
            .allScalars()
            .flat({prop: "parentNode", prefix: "parent"}, $ => $
                .allScalars()
                .flat({prop: "parentNode", prefix: "grand"}, $ => $
                    .allScalars()
                )
            )
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "TreeNode",
            "fields": [
                {
                    "columnIndex": 0,
                    "prop": "TreeNode.id",
                    "paths": ["id"]
                },
                {
                    "columnIndex": 1,
                    "prop": "TreeNode.name",
                    "paths": ["name"]
                },
                {
                    "columnIndex": 2,
                    "isDependent": true,
                    "prop": "TreeNode.parentNodeId",
                    "paths": [] // Implicit property to fetch `TreeNode.parentNode`
                },
                {
                    "dependencies": [2],
                    "prop": "TreeNode.parentNode",
                    "paths": [],
                    "subMapper": {
                        "entity": "TreeNode",
                        "associatedProp": "TreeNode.parentNode",
                        "fields": [
                            {
                                "columnIndex": 0,
                                "prop": "TreeNode.id",
                                "paths": [
                                    ["..", "parentId"]
                                ]
                            },
                            {
                                "columnIndex": 1,
                                "prop": "TreeNode.name",
                                "paths": [
                                    ["..", "parentName"]
                                ]
                            },
                            {
                                "columnIndex": 2,
                                "isDependent": true,
                                "prop": "TreeNode.parentNodeId",
                                "paths": [] // Implicit property to fetch `TreeNode.parentNode`
                            },
                            {
                                "dependencies": [2],
                                "prop": "TreeNode.parentNode",
                                "paths": [],
                                "subMapper": {
                                    "entity": "TreeNode",
                                    "associatedProp": "TreeNode.parentNode",
                                    "fields": [
                                        {
                                            "columnIndex": 0,
                                            "prop": "TreeNode.id",
                                            "paths": [
                                                ["..", "..", "parentGrandId"]
                                            ]
                                        },
                                        {
                                            "columnIndex": 1,
                                            "prop": "TreeNode.name",
                                            "paths": [
                                                ["..", "..", "parentGrandName"]
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
        expect(buildShape(view.mapper)).toEqual({
            "__implicit": {
                "_2": 2
            },
            "parentNode": {
                "__implicit": {
                    "_2": 2
                },
            },
            "id": 0,
            "name": 1,
            "parentId": undefined,
            "parentName": undefined,
            "parentGrandId": undefined,
            "parentGrandName": undefined
        });
        
        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        parentId: null, 
                        parentName: null, 
                        parentGrandId: null, 
                        parentGrandName: null
                    };
                    const implicit = {
                        _2: reader.get(2)
                    };
                    return { reader: this, parent, dto, implicit };
                }
            }
        `);
        const row = view.mapper.rowReader.read(
            undefined,
            makeReader(10, "Cococala", 3)
        );
        expect(row.dto).toEqual({
            id: 10,
            name: "Cococala",
            parentId: null,
            parentName: null,
            parentGrandId: null,
            parentGrandName: null
        });
        expect(row.implicit).toEqual({
            "_2": 3
        });

        const pMapper = view.mapper.fields.find(f => f.prop.name === "parentNode")!.subMapper!;
        expectCode(pMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                    };
                    parent.dto.parentId = reader.get(0);
                    parent.dto.parentName = reader.get(1);
                    const implicit = {
                        _2: reader.get(2)
                    };
                    return { reader: this, parent, dto, implicit };
                }
            }
        `);
        const pRow = pMapper.rowReader.read(
            row,
            makeReader(3, "Drinks", 1)
        );
        expect(pRow.implicit).toEqual({
            _2: 1
        });
        expect(row.dto).toEqual({
            id: 10,
            name: "Cococala",
            parentId: 3,
            parentName: "Drinks",
            parentGrandId: null,
            parentGrandName: null
        });

        const ppMapper = pMapper.fields.find(f => f.prop.name === "parentNode")!.subMapper!;
        expectCode(ppMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                    };
                    parent.parent.dto.parentGrandId = reader.get(0);
                    parent.parent.dto.parentGrandName = reader.get(1);
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
        ppMapper.rowReader.read(
            pRow,
            makeReader(1, "Food", 1)
        );
        expect(row.dto).toEqual({
            id: 10,
            name: "Cococala",
            parentId: 3,
            parentName: "Drinks",
            parentGrandId: 1,
            parentGrandName: "Food"
        });
    });

    it("implicitEmbeddedReferenceKey", () => {
        const view = dto.view(ORDER_ITEM, $ => $
            .order($ => $
                .name
            )
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "OrderItem",
            "fields": [
                {
                    "columnIndex": 0,
                    "isDependent": true,
                    "prop": "OrderItem.orderId.x",
                    "paths": [] // Implicit foreign key to fetch `OrderItem.order`
                },
                {
                    "columnIndex": 1,
                    "isDependent": true,
                    "prop": "OrderItem.orderId.y.a",
                    "paths": [] // Implicit foreign key to fetch `OrderItem.order`
                },
                {
                    "columnIndex": 2,
                    "isDependent": true,
                    "prop": "OrderItem.orderId.y.b",
                    "paths": [] // Implicit foreign key to fetch `OrderItem.order`
                },
                {
                    "dependencies": [0, 1, 2],
                    "prop": "OrderItem.order",
                    "paths": [
                        "order"
                    ],
                    "subMapper": {
                        "entity": "Order",
                        "associatedProp": "OrderItem.order",
                        "fields": [
                            {
                                "columnIndex": 0,
                                "prop": "Order.name",
                                "paths": [
                                    "name"
                                ]
                            }
                        ]
                    }
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "order": {
                "__ref": {
                    "name": 0
                }
            },
            "__implicit": {
                "_0": 0,
                "_1": 1,
                "_2": 2
            }
        });

        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        order: null
                    };
                    const implicit = {
                        _0: reader.get(0), 
                        _1: reader.get(1), 
                        _2: reader.get(2)
                    };
                    return { reader: this, parent, dto, implicit };
                }
            }
        `);
        const row = view.mapper.rowReader.read(
            undefined,
            makeReader(32, 16, 16)
        );
        expect(row.implicit).toEqual({
            _0: 32,
            _1: 16,
            _2: 16
        });

        const orderMapper = view.mapper.fields.find(f => f.prop.name === "order")!.subMapper!;
        expectCode(orderMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        name: reader.get(0)
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
        const orderRow = orderMapper.rowReader.read(
            undefined,
            makeReader("my-order")
        );
        expect(orderRow.dto).toEqual({
            name: "my-order"
        });
    });

    it("explicitEmbeddedReferenceKey", () => {
        const view = dto.view(ORDER_ITEM, $ => $
            .orderId()
            .order($ => $
                .name
            )
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "OrderItem",
            "fields": [
                {
                    "columnIndex": 0,
                    "isDependent": true,
                    "prop": "OrderItem.orderId.x",
                    "paths": [
                        ["orderId", "x"]
                    ]
                },
                {
                    "columnIndex": 1,
                    "isDependent": true,
                    "prop": "OrderItem.orderId.y.a",
                    "paths": [
                        ["orderId", "y", "a"]
                    ]
                },
                {
                    "columnIndex": 2,
                    "isDependent": true,
                    "prop": "OrderItem.orderId.y.b",
                    "paths": [
                        ["orderId", "y", "b"]
                    ]
                },
                {
                    "dependencies": [0, 1, 2],
                    "prop": "OrderItem.order",
                    "paths": [
                        "order"
                    ],
                    "subMapper": {
                        "entity": "Order",
                        "associatedProp": "OrderItem.order",
                        "fields": [
                            {
                                "columnIndex": 0,
                                "prop": "Order.name",
                                "paths": [
                                    "name"
                                ]
                            }
                        ]
                    }
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "orderId": {
                "x": 0,
                "y": {
                    "a": 1,
                    "b": 2
                }
            },
            "order": {
                "__ref": {
                    "name": 0
                }
            }
        });

        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        orderId: null, 
                        order: null
                    };
                    this._orderId(dto).x = reader.get(0);
                    this._orderId_y(dto).a = reader.get(1);
                    this._orderId_y(dto).b = reader.get(2);
                    return { reader: this, parent, dto, implicit: undefined };
                }
                _orderId(dto) {
                    let o = dto.orderId;
                    if (o == null) {
                        dto.orderId = o = {
                            x: null, 
                            y: null
                        };
                    }
                    return o;
                }
                _orderId_y(dto) {
                    let o = this._orderId(dto).y;
                    if (o == null) {
                        this._orderId(dto).y = o = {
                            a: null, 
                            b: null
                        };
                    }
                    return o;
                }
            }
        `);
        const row = view.mapper.rowReader.read(
            undefined,
            makeReader(32, 16, 16)
        );
        expect(row.dto).toEqual({
            orderId: {
                x: 32,
                y: {
                    a: 16,
                    b: 16
                }
            },
            order: null
        });

        const orderMapper = view.mapper.fields.find(f => f.prop.name === "order")!.subMapper!;
        expectCode(orderMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        name: reader.get(0)
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
        const orderRow = orderMapper.rowReader.read(
            undefined,
            makeReader("my-order")
        );
        expect(orderRow.dto).toEqual({
            name: "my-order"
        });
    });

    it("mixedEmbeddedReferenceKey", () => {
        const view = dto.view(ORDER_ITEM, $ => $
            .orderId($ => $.y())
            .order($ => $
                .name
            )
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "OrderItem",
            "fields": [
                {
                    "columnIndex": 0,
                    "isDependent": true,
                    "prop": "OrderItem.orderId.y.a",
                    "paths": [
                        ["orderId", "y", "a"]
                    ]
                },
                {
                    "columnIndex": 1,
                    "isDependent": true,
                    "prop": "OrderItem.orderId.y.b",
                    "paths": [
                        ["orderId", "y", "b"]
                    ]
                },
                {
                    "columnIndex": 2,
                    "isDependent": true,
                    "prop": "OrderItem.orderId.x",
                    "paths": [] // Implicit property to fetch `OrderItem.order`
                },
                {
                    "dependencies": [2, 0, 1],
                    "prop": "OrderItem.order",
                    "paths": [
                        "order"
                    ],
                    "subMapper": {
                        "entity": "Order",
                        "associatedProp": "OrderItem.order",
                        "fields": [
                            {
                                "columnIndex": 0,
                                "prop": "Order.name",
                                "paths": [
                                    "name"
                                ]
                            }
                        ]
                    }
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "orderId": {
                "y": {
                    "a": 0,
                    "b": 1
                }
            },
            "order": {
                "__ref": {
                    "name": 0
                }
            },
            "__implicit": {
                "_2": 2
            }
        });

        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        orderId: null, 
                        order: null
                    };
                    this._orderId_y(dto).a = reader.get(0);
                    this._orderId_y(dto).b = reader.get(1);
                    const implicit = {
                        _2: reader.get(2)
                    };
                    return { reader: this, parent, dto, implicit };
                }
                _orderId(dto) {
                    let o = dto.orderId;
                    if (o == null) {
                        dto.orderId = o = {
                            y: null
                        };
                    }
                    return o;
                }
                _orderId_y(dto) {
                    let o = this._orderId(dto).y;
                    if (o == null) {
                        this._orderId(dto).y = o = {
                            a: null, 
                            b: null
                        };
                    }
                    return o;
                }
            }
        `);
        const row = view.mapper.rowReader.read(
            undefined,
            makeReader(16, 16, 32)
        );
        expect(row.dto).toEqual({
            orderId: {
                y: {
                    a: 16,
                    b: 16
                }
            },
            order: null
        });
        expect(row.implicit).toEqual({
            _2: 32
        });

        const orderMapper = view.mapper.fields.find(f => f.prop.name === "order")!.subMapper!;
        expectCode(orderMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        name: reader.get(0)
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
            }
        `);
        const orderRow = orderMapper.rowReader.read(
            undefined,
            makeReader("my-order")
        );
        expect(orderRow.dto).toEqual({
            name: "my-order"
        });
    });

    it("recursive", () => {
        const view = dto.view(TREE_NODE, $ => $
            .name
            .recursive("parentNode")
            .recursive("childNodes")
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "TreeNode",
            "fields": [
                {
                    "columnIndex": 0,
                    "prop": "TreeNode.name",
                    "paths": ["name"]
                },
                {
                    "columnIndex": 1,
                    "isDependent": true,
                    "prop": "TreeNode.parentNodeId",
                    "paths": [] // Implicit field to fetch `TreeNode.parentNode`
                },
                {
                    "dependencies": [1],
                    "prop": "TreeNode.parentNode",
                    "paths": ["parentNode"],
                    "recursiveDepth": -1, // Unlimited depth
                    "subMapper": {
                        "entity": "TreeNode",
                        "associatedProp": "TreeNode.parentNode",
                        "fields": [
                            {
                                "columnIndex": 0,
                                "prop": "TreeNode.name",
                                "paths": ["name"]
                            },
                            {
                                "columnIndex": 1,
                                "isDependent": true,
                                "prop": "TreeNode.parentNodeId",
                                "paths": [] // Implicit field to fetch `TreeNode.parentNode`
                            },
                            {
                                "dependencies": [1],
                                "prop": "TreeNode.parentNode",
                                "paths": ["parentNode"]
                            }
                        ]
                    }
                },
                {
                    "columnIndex": 2,
                    "isDependent": true,
                    "prop": "TreeNode.id",
                    "paths": [] // Implict field to fetch `TreeNode.childNodes`
                },
                {
                    "dependencies": [3],
                    "prop": "TreeNode.childNodes",
                    "paths": ["childNodes"],
                    "recursiveDepth": -1, // Unlimited depth
                    "subMapper": {
                        "entity": "TreeNode",
                        "associatedProp": "TreeNode.childNodes",
                        "fields": [
                            {
                                "columnIndex": 0,
                                "prop": "TreeNode.name",
                                "paths": ["name"]
                            },
                            {
                                "columnIndex": 1,
                                "isDependent": true,
                                "prop": "TreeNode.id",
                                "paths": [] // Implict field to fetch `TreeNode.childNodes`
                            },
                            {
                                "dependencies": [1],
                                "prop": "TreeNode.childNodes",
                                "paths": ["childNodes"]
                            }
                        ]
                    }
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "name": 0,
            "parentNode": {
                "__recursive": 1,
                "__ref": {
                    "name": 0,
                    "__implicit": {
                        "_1": 1
                    },
                    "parentNode": undefined
                }
            },
            "childNodes": {
                "__recursive": 1,
                "__array": {
                    "name": 0,
                    "__implicit": {
                        "_1": 1
                    },
                    "childNodes": undefined
                }
            },
            "__implicit": {
                "_1": 1,
                "_3": 2
            }
        });

        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        name: reader.get(0), 
                        parentNode: null, 
                        childNodes: null
                    };
                    const implicit = {
                        _1: reader.get(1), 
                        _3: reader.get(2)
                    };
                    return { reader: this, parent, dto, implicit };
                }
            }
        `);
        const row = view.mapper.rowReader.read(
            undefined, 
            makeReader("Drinks", 1, 3)
        );
        expect(row.dto).toEqual({
            name: "Drinks",
            parentNode: null,
            childNodes: null
        });
        expect(row.implicit).toEqual({
            _1: 1,
            _3: 3
        });

        const parentMapper = view.mapper.fields.find(f => f.prop.name === "parentNode")!.subMapper!;
        expectCode(parentMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        name: reader.get(0), 
                        parentNode: null
                    };
                    const implicit = {
                        _1: reader.get(1)
                    };
                    return { reader: this, parent, dto, implicit };
                }
            }
        `);
        const parentRow = parentMapper.rowReader.read(
            undefined,
            makeReader("Food", 1)
        );
        expect(parentRow.dto).toEqual({
            name: "Food",
            parentNode: null
        });
        expect(parentRow.implicit).toEqual({
            _1: 1
        });

        const childMapper = view.mapper.fields.find(f => f.prop.name === "childNodes")!.subMapper!;
        expectCode(childMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        name: reader.get(0), 
                        childNodes: null
                    };
                    const implicit = {
                        _1: reader.get(1)
                    };
                    return { reader: this, parent, dto, implicit };
                }
            }
        `);
        const childRow = childMapper.rowReader.read(
            undefined,
            makeReader("Cococala", 10)
        );
        expect(childRow.dto).toEqual({
            name: "Cococala",
            childNodes: null
        });
        expect(childRow.implicit).toEqual({
            _1: 10
        });
    });
});

