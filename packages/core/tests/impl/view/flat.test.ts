import { describe, expect, it } from "vitest";
import { dto } from "@/schema/dto";
import { BOOK, AUTHOR, TREE_NODE } from "../../model/model";
import { buildShape } from "@/impl/shape";
import { expectCode } from "../../utils";
import { mapperJson, makeReader } from "./utils";

describe("FlatTest", () => {

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

        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class extends $baseClass {
                read(parents, reader) {
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
                    return { reader: this, parents, dto, implicit };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 5:
                            return row.implicit._4;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 5:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 5:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 5:
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const row = view.mapper.dtoRowReader.read(
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
        expectCode(storeMapper.dtoRowReader.constructor.toString(), `
            class extends $baseClass {
                read(parents, reader) {
                    const dto = {
                    };
                    const reader_0 = reader.get(0);
                    for (const parent of parents) {
                        parent.dto.storeId = reader_0;
                    }
                    const reader_1 = reader.get(1);
                    for (const parent of parents) {
                        parent.dto.storeName = reader_1;
                    }
                    return { reader: this, parents, dto, implicit: undefined };
                }
            }
        `);
        storeMapper.dtoRowReader.read(
            [row], 
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

        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        flattenFirstName: reader.get(1), 
                        flattenLastName: reader.get(2)
                    };
                    return { reader: this, parents, dto, implicit: undefined };
                }
            }
        `);
        const row = view.mapper.dtoRowReader.read(
            undefined, 
            makeReader(3, "Alex", "Banks")
        );
        expect(row.dto).toEqual({
            id: 3,
            flattenFirstName: "Alex",
            flattenLastName: "Banks"
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
        
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class extends $baseClass {
                read(parents, reader) {
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
                    return { reader: this, parents, dto, implicit };
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
        const row = view.mapper.dtoRowReader.read(
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
        expectCode(pMapper.dtoRowReader.constructor.toString(), `
            class extends $baseClass {
                read(parents, reader) {
                    const dto = {
                    };
                    const implicit = {
                        _2: reader.get(2)
                    };
                    const reader_0 = reader.get(0);
                    for (const parent of parents) {
                        parent.dto.parentId = reader_0;
                    }
                    const reader_1 = reader.get(1);
                    for (const parent of parents) {
                        parent.dto.parentName = reader_1;
                    }
                    return { reader: this, parents, dto, implicit };
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
        const pRow = pMapper.dtoRowReader.read(
            [row],
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
        expectCode(ppMapper.dtoRowReader.constructor.toString(), `
            class extends $baseClass {
                read(parents, reader) {
                    const dto = {
                    };
                    const reader_0 = reader.get(0);
                    for (const parent of parents) {
                        for (const parent2 of parent.parents) {
                            parent2.dto.parentGrandId = reader_0;
                        }
                    }
                    const reader_1 = reader.get(1);
                    for (const parent of parents) {
                        for (const parent2 of parent.parents) {
                            parent2.dto.parentGrandName = reader_1;
                        }
                    }
                    return { reader: this, parents, dto, implicit: undefined };
                }
            }
        `);
        ppMapper.dtoRowReader.read(
            [pRow],
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
});