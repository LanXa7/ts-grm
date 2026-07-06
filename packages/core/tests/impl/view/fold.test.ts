import { describe, expect, it } from "vitest";
import { dto } from "@/schema/dto";
import { BOOK} from "../../model/model";
import { expectCode } from "../../utils";
import { mapperJson, makeReader, shapeJson } from "./utils";
import { createView } from "@/schema/view";

describe("FoldTest", () => {

    it("foldScalars", () => {
        const view = createView(BOOK, {
            id: true,
            $fold: {
                key: c => c({
                    name: true,
                    edition: true
                })
            }
        });
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
        expect(shapeJson(view.mapper)).toEqual({
            "id": 0,
            "key": {
                "name": 1,
                "edition": 2
            }
        });
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        key: null
                    };
                    this._key(dto).name = reader.get(1);
                    this._key(dto).edition = reader.get(2);
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
                }
                _key(dto) {
                    let o = dto.key;
                    if (o == null) {
                        dto.key = o = {
                            name: null, 
                            edition: null
                        };
                    }
                    return o;
                }
            }
        `);
        const row = view.mapper.dtoRowReader.read(
            undefined, 
            makeReader(3, "GraphQL in Action", 2)
        );
        expect(row.dto).toEqual({
            id: 3,
            key: {
                name: "GraphQL in Action",
                edition: 2
            }
        });
        expect(row.implicit).toEqual(undefined);
    });

    it("foldAssociations", () => {
        const view = createView(BOOK, {
            id: true,
            $fold: {
                associations: c => c({
                    authors: c => c({
                        $allScalars: true
                    })
                })
            }
        });
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
                            },
                            {
                                "columnIndex": 3,
                                "prop": "Author.gender",
                                "paths": ["gender"]
                            }
                        ]
                    }
                }
            ]
        });
        expect(shapeJson(view.mapper)).toEqual({
            "id": 0,
            "associations": {
                "authors": {
                    "__array": {
                        "id": 0,
                        "name": {
                            "firstName": 1,
                            "lastName": 2
                        },
                        "gender": 3
                    }
                }
            }
        });

        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        associations: null
                    };
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
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
                        case 1:
                            return row.dto.id;
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
            makeReader(12)
        );
        expect(row.dto).toEqual({
            id: 12,
            associations: null
        });

        const authorMapper = view.mapper.fields.find(f => f.prop.name === "authors")!.subMapper!;
        expectCode(authorMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: null, 
                        gender: ThisClass.__GENDER__OUTPUT_FN(reader.get(3))
                    };
                    this._name(dto).firstName = reader.get(1);
                    this._name(dto).lastName = reader.get(2);
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
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
                static __GENDER__OUTPUT_FN = $entity.expandedPropMap.get("gender").getOutputFn(false);
            }
        `);
        const authorRow = authorMapper.dtoRowReader.read(
            undefined,
            makeReader(3, "Alex", "Banks", "M")
        );
        expect(authorRow.dto).toEqual({
            id: 3,
            name: {
                firstName: "Alex",
                lastName: "Banks"
            },
            gender: "MALE"
        });
    });

    it("mixedWithFlat", () => {
        const view = createView(BOOK, {
            $fold: {
                key: $ => $({
                    name: true,
                    edition: true
                }),
                associations: $ => $({
                    $flat: $ => $({
                        store: $ => $({
                            id: true,
                            $fold: {
                                key: $ => $({
                                    name: true,
                                    version: true
                                })
                            },
                        })
                    }),
                    authors: $ => $({
                        $flat: $ => $({
                            name: {
                                prefix: ""
                            }
                        })
                    })
                })
            }
        });
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Book",
            "fields": [
                {
                    "prop": "Book.name",
                    "paths": [
                        ["key", "name"]
                    ],
                    "columnIndex": 0
                },
                {
                    "prop": "Book.edition",
                    "paths": [
                        ["key", "edition"]
                    ],
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
                                "paths": [
                                    ["..", "associations", "storeId"]
                                ],
                                "columnIndex": 0
                            },
                            {
                                "prop": "BookStore.name",
                                "paths": [
                                    ["..", "associations", "storeKey", "name"]
                                ],
                                "columnIndex": 1
                            },
                            {
                                "prop": "BookStore.version",
                                "paths": [
                                    ["..", "associations", "storeKey", "version"]
                                ],
                                "columnIndex": 2
                            }
                        ]
                    },
                    "dependencies": [2]
                },
                {
                    "prop": "Book.id",
                    "paths": [],
                    "isDependent": true,
                    "columnIndex": 3
                },
                {
                    "prop": "Book.authors",
                    "paths": [
                        ["associations", "authors"]
                    ],
                    "subMapper": {
                        "entity": "Author",
                        "associatedProp": "Book.authors",
                        "fields": [
                            {
                                "prop": "Author.name.firstName",
                                "paths": ["firstName"],
                                "columnIndex": 0
                            },
                            {
                                "prop": "Author.name.lastName",
                                "paths": ["lastName"],
                                "columnIndex": 1
                            }
                        ]
                    },
                    "dependencies": [4]
                }
            ]
        });
        expect(shapeJson(view.mapper)).toEqual({
            "key": {
                "name": 0,
                "edition": 1
            },
            "__implicit": {
                "_2": 2,
                "_4": 3
            },
            "associations": {
                "storeKey": {
                    "name": undefined,
                    "version": undefined
                },
                "authors": {
                    "__array": {
                        "firstName": 0,
                        "lastName": 1
                    }
                }
            }
        });
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        key: null, 
                        associations: null
                    };
                    const implicit = {
                        _2: reader.get(2), 
                        _4: reader.get(3)
                    };
                    this._key(dto).name = reader.get(0);
                    this._key(dto).edition = reader.get(1);
                    return { reader: this, parents, dto, implicit, typeName: undefined };
                }
                _key(dto) {
                    let o = dto.key;
                    if (o == null) {
                        dto.key = o = {
                            name: null, 
                            edition: null
                        };
                    }
                    return o;
                }
                _associations(dto) {
                    let o = dto.associations;
                    if (o == null) {
                        dto.associations = o = {
                            storeId: null, 
                            storeKey: null, 
                            authors: null
                        };
                    }
                    return o;
                }
                _associations_storeKey(dto) {
                    let o = this._associations(dto).storeKey;
                    if (o == null) {
                        this._associations(dto).storeKey = o = {
                            name: null, 
                            version: null
                        };
                    }
                    return o;
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
                            break;
                        case 5:
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
            makeReader("GraphQL in Action", 3, 2, 12)
        );
        expect(row.dto).toEqual({
            "key": {
                "name": "GraphQL in Action",
                "edition": 3
            },
            "associations": null
        });
        expect(row.implicit).toEqual({
            "_2": 2,
            "_4": 12
        });

        const storeMapper = view.mapper.fields.find(f => f.prop.name === "store")!.subMapper!;
        expectCode(storeMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                    };
                    const reader_0 = reader.get(0);
                    for (const parent of parents) {
                        parent.reader._associations(parent.dto).storeId = reader_0;
                    }
                    const reader_1 = reader.get(1);
                    for (const parent of parents) {
                        parent.reader._associations_storeKey(parent.dto).name = reader_1;
                    }
                    const reader_2 = reader.get(2);
                    for (const parent of parents) {
                        parent.reader._associations_storeKey(parent.dto).version = reader_2;
                    }
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
                }
            }
        `);
        storeMapper.dtoRowReader.read(
            [row],
            makeReader(2, "MANNING", 2)
        );
        expect(row.dto).toEqual({
            "key": {
                "name": "GraphQL in Action",
                "edition": 3
            },
            "associations": {
                "storeId": 2,
                "storeKey": {
                    "name": "MANNING",
                    "version": 2
                },
                "authors": null
            }
        });
    });
});