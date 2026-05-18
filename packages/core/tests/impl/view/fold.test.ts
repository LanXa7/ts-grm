import { describe, expect, it } from "vitest";
import { dto } from "@/schema/dto";
import { BOOK} from "../../model/model";
import { buildShape } from "@/impl/shape";
import { expectCode } from "../../utils";
import { mapperJson, makeReader } from "./utils";

describe("FoldTest", () => {

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
        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        key: null
                    };
                    this._key(dto).name = reader.get(1);
                    this._key(dto).edition = reader.get(2);
                    return { reader: this, parent, dto, implicit: undefined };
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
                dependency(unresolvedFieldIndex, row) {
                    throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                }
                resolve(unresolvedFieldIndex, row, value) {
                    throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                }
            }
        `);
        const row = view.mapper.rowReader.read(
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

        expectCode(view.mapper.rowReader.constructor.toString(), `
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
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return row.dto.id;
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
                dependency(unresolvedFieldIndex, row) {
                    throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                }
                resolve(unresolvedFieldIndex, row, value) {
                    throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
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
});