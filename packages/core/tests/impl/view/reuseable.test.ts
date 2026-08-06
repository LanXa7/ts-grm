import { dto, TypeOf } from "@/index";
import { describe, expect, expectTypeOf, it } from "vitest";
import { BOOK } from "../../model/model";
import { mapperJson } from "./utils";
import z from "zod";

describe("ReuseableTest", () => {

    it("mergeFlatAndReference", () => {
        const view = dto.view(BOOK, c => [
            c.name,
            c.$flat("store").with(c => [
                c.name
            ]),
            c.store.with(c => [
                c.version
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            name: string;
            storeName: string | null;
            store: {
                version: number;
            } | null;
        }>();
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Book",
            "fields": [
                {
                    "prop": "Book.name",
                    "paths": ["name"],
                    "columnIndex": 0
                },
                {
                    "prop": "Book.storeId",
                    "paths": [],
                    "isDependent": true,
                    "columnIndex": 1
                },
                {
                    "prop": "Book.store",
                    "paths": ["store"],
                    "subMapper": {
                        "entity": "BookStore",
                        "associatedProp": "Book.store",
                        "fields": [
                            {
                                "prop": "BookStore.name",
                                "paths": [
                                    ["..", "storeName"]
                                ],
                                "columnIndex": 0
                            },
                            {
                                "prop": "BookStore.version",
                                "paths": ["version"],
                                "columnIndex": 1
                            }
                        ]
                    },
                    "dependencies": [1]
                }
            ]
        });
    });

    it("mergeFlats", () => {
        const view = dto.view(BOOK, c => [
            c.name,
            c.$flat("store").with(c => [
                c.name
            ]),
            c.$flat("store").with(c => [
                c.name.as("name2")
            ]),
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            name: string;
            storeName: string | null;
            storeName2: string | null;
        }>();
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Book",
            "fields": [
                {
                    "prop": "Book.name",
                    "paths": ["name"],
                    "columnIndex": 0
                },
                {
                    "prop": "Book.storeId",
                    "paths": [],
                    "isDependent": true,
                    "columnIndex": 1
                },
                {
                    "prop": "Book.store",
                    "paths": [],
                    "subMapper": {
                        "entity": "BookStore",
                        "associatedProp": "Book.store",
                        "fields": [
                            {
                                "prop": "BookStore.name",
                                "paths": [
                                    ["..", "storeName"],
                                    ["..", "storeName2"]
                                ],
                                "columnIndex": 0
                            }
                        ]
                    },
                    "dependencies": [1]
                }
            ]
        });
    });

    it("mergeDependencyAndCollection", () => {
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
                fn: data => data.authors.map(author => `${
                    author.name.firstName
                } ${
                    author.name.lastName
                }`)
            }),
            c.authors
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf< {
            authorNames: string[];
            authors: {
                id: number;
                gender: "FEMALE" | "MALE";
                name: {
                    firstName: string;
                    lastName: string;
                };
            }[];
            name: string;
        }>();
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
                        ["<implicit:authorNames>", "authors"],
                        "authors"
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
                            },
                            {
                                "prop": "Author.id",
                                "paths": ["id"],
                                "columnIndex": 2
                            },
                            {
                                "prop": "Author.gender",
                                "paths": ["gender"],
                                "columnIndex": 3
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
    });

    it("mergeDependencyAndCollectionFailed", () => {
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
                fn: data => data.authors.map(author => `${
                    author.name.firstName
                } ${
                    author.name.lastName
                }`)
            }),
            c.authors.with(c => [c.name.as("fn")])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            authorNames: string[];
            authors: {
                fn: {
                    firstName: string;
                    lastName: string;
                };
            }[];
            name: string;
        }>();
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
                    "prop": "Book.authors",
                    "paths": ["authors"],
                    "subMapper": {
                        "entity": "Author",
                        "associatedProp": "Book.authors",
                        "fields": [
                            {
                                "prop": "Author.name.firstName",
                                "paths": [
                                    ["fn", "firstName"]
                                ],
                                "columnIndex": 0
                            },
                            {
                                "prop": "Author.name.lastName",
                                "paths": [
                                    ["fn", "lastName"]
                                ],
                                "columnIndex": 1
                            }
                        ]
                    },
                    "dependencies": [1]
                },
                {
                    "prop": "Book.$formula(authorNames)",
                    "paths": ["authorNames"],
                    "dependencies": [2]
                }
            ]
        });
    });

    it("mergeCollections", () => {
        const view = dto.view(BOOK, c => [
            c.name,
            c.authors.as("authorList1").with(c => [
                c.name
            ]),
            c.authors.as("authorList2").with(c => [
                c.name
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            authorList1: {
                name: {
                    firstName: string;
                    lastName: string;
                };
            }[];
            authorList2: {
                name: {
                    firstName: string;
                    lastName: string;
                };
            }[];
            name: string;
        }>();
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
                    "paths": ["authorList1", "authorList2"],
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
                    "dependencies": [1]
                }
            ]
        });
    });

    it("mergeCollectionsFailed", () => {
        const view = dto.view(BOOK, c => [
            c.name,
            c.authors.as("authorList1").with(c => [
                c.id,
                c.name
            ]),
            c.authors.as("authorList2").with(c => [
                c.name
            ])
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            authorList1: {
                id: number;
                name: {
                    firstName: string;
                    lastName: string;
                };
            }[];
            authorList2: {
                name: {
                    firstName: string;
                    lastName: string;
                };
            }[];
            name: string;
        }>();
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
                        "authorList1"
                    ],
                    "subMapper": {
                        "entity": "Author",
                        "associatedProp": "Book.authors",
                        "fields": [
                            {
                                "prop": "Author.id",
                                "paths": ["id"],
                                "columnIndex": 0
                            },
                            {
                                "prop": "Author.name.firstName",
                                "paths": [
                                    ["name", "firstName"]
                                ],
                                "columnIndex": 1
                            },
                            {
                                "prop": "Author.name.lastName",
                                "paths": [
                                    ["name", "lastName"]
                                ],
                                "columnIndex": 2
                            }
                        ]
                    },
                    "dependencies": [1]
                },
                {
                    "prop": "Book.authors",
                    "paths": [
                        "authorList2"
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
                    "dependencies": [1]
                }
            ]
        });
    });
});