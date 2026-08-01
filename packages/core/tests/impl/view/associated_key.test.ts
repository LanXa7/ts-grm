import { dto } from "@/index";
import { describe, expect, it } from "vitest";
import { BOOK, ORDER_ITEM, STUDENT } from "../../model/model";
import { makeReader, mapperJson } from "./utils";
import { expectCode } from "../../utils";

describe("AssociatedKeyTest", () => {

    it("simple", () => {
        const view = dto.view(BOOK, c => [
            c.id,
            c.name,
            c.storeId
        ]);
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Book",
            "fields": [
                {
                    "prop": "Book.id",
                    "paths": [ "id" ],
                    "columnIndex": 0
                },
                {
                    "prop": "Book.name",
                    "paths": ["name"],
                    "columnIndex": 1
                },
                {
                    "prop": "Book.storeId",
                    "paths": ["storeId"],
                    "columnIndex": 2
                }
            ]
        });
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        storeId: reader.get(2)
                    };
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
                }
            }
        `);
        const row = view.mapper.dtoRowReader.read(undefined, makeReader(12, "YugabyteDB", 2));
        expect(row.dto).toEqual({ 
            id: 12, 
            name: 'YugabyteDB', 
            storeId: 2 
        });
    });

    it("defaultEmbedded", () => {
        const view = dto.view(ORDER_ITEM, c => [
            c.id,
            c.orderId
        ]);
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "OrderItem",
            "fields": [
                {
                    "prop": "OrderItem.id",
                    "paths": ["id"],
                    "columnIndex": 0
                },
                {
                    "prop": "OrderItem.orderId.x",
                    "paths": [
                        ["orderId", "x"]
                    ],
                    "columnIndex": 1
                },
                {
                    "prop": "OrderItem.orderId.y.a",
                    "paths": [
                        ["orderId", "y", "a"]
                    ],
                    "columnIndex": 2
                },
                {
                    "prop": "OrderItem.orderId.y.b",
                    "paths": [
                        ["orderId", "y", "b"]
                    ],
                    "columnIndex": 3
                }
            ]
        });
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        orderId: null
                    };
                    this._orderId(dto).x = reader.get(1);
                    this._orderId_y(dto).a = reader.get(2);
                    this._orderId_y(dto).b = reader.get(3);
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
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
        const row = view.mapper.dtoRowReader.read(undefined, makeReader(1, 2, 3, 4));
        expect(row.dto).toEqual({
            "id": 1,
            "orderId": {
                "x": 2,
                "y": {
                    "a": 3,
                    "b": 4
                }
            }
        });
    });

    it("shapedEmbedded", () => {
        const view = dto.view(ORDER_ITEM, c => [
            c.id,
            c.orderId.with(c => [
                c.x,
                c.$flat("y").prefix("").with(c => [c.b])
            ])
        ]);
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "OrderItem",
            "fields": [
                {
                    "prop": "OrderItem.id",
                    "paths": ["id"],
                    "columnIndex": 0
                },
                {
                    "prop": "OrderItem.orderId.x",
                    "paths": [
                        ["orderId", "x"]
                    ],
                    "columnIndex": 1
                },
                {
                    "prop": "OrderItem.orderId.y.b",
                    "paths": [
                        ["orderId", "b"]
                    ],
                    "columnIndex": 2
                }
            ]
        });
        const row = view.mapper.dtoRowReader.read(undefined, makeReader(1, 2, 3));
        expect(row.dto).toEqual({
            "id": 1,
            "orderId": {
                "x": 2,
                "b": 3
            }
        });
    });

    it("m2m", () => {
        const view = dto.view(BOOK, c => [
            c.id,
            c.$associatedKeys("authors", "authorIds")
        ]);
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Book",
            "fields": [
                {
                    "prop": "Book.id",
                    "paths": ["id"],
                    "isDependent": true,
                    "columnIndex": 0
                },
                {
                    "prop": "Book.authors",
                    "paths": [
                        ["<implicit:authorIds>", "authors"]
                    ],
                    "subMapper": {
                        "entity": "Author",
                        "associatedProp": "Book.authors",
                        "fields": [
                            {
                                "prop": "Author.id",
                                "paths": ["id"],
                                "columnIndex": 0
                            }
                        ]
                    },
                    "dependencies": [0],
                    "isDependent": true
                },
                {
                    "prop": "Book.$formula(authorIds)",
                    "paths": ["authorIds"],
                    "dependencies": [1]
                }
            ]
        });
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        id: reader.get(0), 
                        authorIds: null
                    };
                    const implicit = {
                        authorIds: null
                    };
                    return { reader: this, parents, dto, implicit, typeName: undefined };
                }
                _implicit_authorIds(implicit) {
                    let o = implicit.authorIds;
                    if (o == null) {
                        implicit.authorIds = o = {
                            authors: null
                        };
                    }
                    return o;
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return row.dto.id;
                        case 2:
                            return row.implicit.authorIds?.authors;
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
                            this._implicit_authorIds(row.implicit).authors = value;
                            break;
                        case 2:
                            row.dto.authorIds = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolveTsFormulas(row) {
                    const authorIdsValue = ThisClass.__AUTHOR_IDS__TS_FORMULA_FN(row.implicit.authorIds);
                    row.dto.authorIds = authorIdsValue;
                }
                static __AUTHOR_IDS__TS_FORMULA_FN = $dtoTsFormulaFunMap.get("authorIds");
            }
        `);
    });

    it("m2mByJoinEntity", () => {
        const view = dto.view(STUDENT, c => [
            c.name,
            c.$associatedKeys("courses", "courceIds")
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
                        ["<implicit:courceIds>", "courses"]
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
                                            "prop": "Course.id",
                                            "paths": [
                                                ["..", "id"]
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
                    "prop": "Student.$formula(courceIds)",
                    "paths": [
                        "courceIds"
                    ],
                    "dependencies": [2]
                }
            ]
        });
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0), 
                        courceIds: null
                    };
                    const implicit = {
                        _1: reader.get(1), 
                        courceIds: null
                    };
                    return { reader: this, parents, dto, implicit, typeName: undefined };
                }
                _implicit_courceIds(implicit) {
                    let o = implicit.courceIds;
                    if (o == null) {
                        implicit.courceIds = o = {
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
                            return row.implicit.courceIds?.courses;
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
                            this._implicit_courceIds(row.implicit).courses = value;
                            break;
                        case 3:
                            row.dto.courceIds = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolveTsFormulas(row) {
                    const courceIdsValue = ThisClass.__COURCE_IDS__TS_FORMULA_FN(row.implicit.courceIds);
                    row.dto.courceIds = courceIdsValue;
                }
                static __COURCE_IDS__TS_FORMULA_FN = $dtoTsFormulaFunMap.get("courceIds");
            }
        `);
    });
});