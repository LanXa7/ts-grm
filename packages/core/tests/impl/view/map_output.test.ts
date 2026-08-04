import { dsl, dto } from "@/index";
import { describe, expect, it } from "vitest";
import { BOOK, BOOK_STORE } from "../../model/model";
import z from "zod";
import { mapperJson } from "./utils";
import { expectCode } from "../../utils";

describe("MapOutputTest", () => {
    
    it("tmpTsFormula", () => {
        const view = dto.view(BOOK, c => [
            c.name,
            c.$formula.ts({
                alias: "authorNames",
                valueType: z.array(z.string()),
                dependency: c => [
                    c.authors.with(c => [
                        c.name
                    ])
                ],
                fn: data => data.authors.map(author => `${author.name.firstName} ${author.name.lastName}`)
            }).mapOutput(
                z.string(), 
                value => `There are ${value.length} author(s): ${value.join(", ")}`
            )
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
                    "prop": "Book.id",
                    "paths": [],
                    "isDependent": true,
                    "columnIndex": 1
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
                    "dependencies": [1],
                    "isDependent": true
                },
                {
                    "prop": "Book.$formula(authorNames)",
                    "paths": ["authorNames"],
                    "dependencies": [2]
                }
            ]
        });
        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class extends $baseClass {
                constructor(outputFunMap, tsFormulaFunMap) {
                    super();
                    this.__author_names__OutputFn = outputFunMap.get("authorNames");
                    this.__author_names__TsFormulaFn = tsFormulaFunMap.get("authorNames");
                }
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0), 
                        authorNames: null
                    };
                    const implicit = {
                        _1: reader.get(1), 
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
                        case 2:
                            return row.implicit._1;
                        case 3:
                            return row.implicit.authorNames?.authors;
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
                            this._implicit_authorNames(row.implicit).authors = value;
                            break;
                        case 3:
                            row.dto.authorNames = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolveTsFormulas(row) {
                    const authorNamesValue = this.__author_names__OutputFn(this.__author_names__TsFormulaFn(row.implicit.authorNames));
                    row.dto.authorNames = authorNamesValue;
                }
            }
        `);
    });

    it("tmpSqlFormula", () => {
        const view = dto.view(BOOK_STORE, c => [
            c.name,
            c.$formula.sql({
                alias: "avgPrice",
                valueType: z.number(),
                fn: store => dsl.subQuery(BOOK, (q, book) => {
                    q.where(book.storeId.eq(store.id));
                    return q.select(dsl.avg(book.price).asNonNull());
                })
            }).mapOutput(
                z.string(), 
                value => `Thee average price of my books is: ${Math.round(value * 100) / 100}`
            )
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
            class extends $baseClass {
                constructor(outputFunMap, tsFormulaFunMap) {
                    super();
                    this.__avg_price__OutputFn = outputFunMap.get("avgPrice");
                }
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0), 
                        avgPrice: this.__avg_price__OutputFn(reader.get(1))
                    };
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
                }
            }
        `);
    });
});