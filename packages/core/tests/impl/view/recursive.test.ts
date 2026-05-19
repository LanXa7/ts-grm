import { describe, expect, it } from "vitest";
import { dto } from "@/schema/dto";
import { TREE_NODE } from "../../model/model";
import { buildShape } from "@/impl/shape";
import { expectCode } from "../../utils";
import { mapperJson, makeReader } from "./utils";

describe("RecursiveTest", () => {

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

        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0), 
                        parentNode: null, 
                        childNodes: null
                    };
                    const implicit = {
                        _1: reader.get(1), 
                        _3: reader.get(2)
                    };
                    return { reader: this, parents, dto, implicit };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return row.implicit._1;
                        case 4:
                            return row.implicit._3;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency == null;
                        case 4:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency;
                        case 4:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            row.dto.parentNode = value;
                            break;
                        case 4:
                            row.dto.childNodes = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const row = view.mapper.dtoRowReader.read(
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
        expectCode(parentMapper.dtoRowReader.constructor.toString(), `
            class extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0), 
                        parentNode: null
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
                            row.dto.parentNode = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const parentRow = parentMapper.dtoRowReader.read(
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
        expectCode(childMapper.dtoRowReader.constructor.toString(), `
            class extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0), 
                        childNodes: null
                    };
                    const implicit = {
                        _1: reader.get(1)
                    };
                    return { reader: this, parents, dto, implicit };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 4:
                            return row.implicit._3;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 4:
                            return dependency == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 4:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 4:
                            row.dto.childNodes = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const childRow = childMapper.dtoRowReader.read(
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