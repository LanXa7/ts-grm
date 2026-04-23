import { dto } from "@/index";
import { describe, expect, it } from "vitest";
import { AUTHOR } from "../../model/model";
import { mapperJson } from "./utils";
import { buildShape } from "@/impl/shape";

describe("ComputedTest", () => {

    it("tsFormula", () => {
        const view = dto.view(AUTHOR, $ => $
            .id
            .fullName
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Author",
            "fields": [
                {
                    "prop": "Author.id",
                    "paths": ["id"],
                    "columnIndex": 0
                },
                {
                    "prop": "Author.name.firstName",
                    "paths": [
                        ["<implicit:fullName>", "name", "firstName"]
                    ],
                    "isDependent": true,
                    "columnIndex": 1
                },
                {
                    "prop": "Author.name.lastName",
                    "paths": [
                        ["<implicit:fullName>", "name", "lastName"]
                    ],
                    "isDependent": true,
                    "columnIndex": 2
                },
                {
                    "prop": "Author.fullName",
                    "paths": ["fullName"],
                    "dependencies": [1, 2]
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "id": 0,
            "fullName": "fullName",
            "__implicit": {
                "fullName": {
                    "name": {
                        "firstName": 1,
                        "lastName": 2
                    }
                }
            }
        });
    });

    it("foldTsFormula", () => {
        const view = dto.view(AUTHOR, $ => $
            .id
            .fold("formula", $ => $.fullName)
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Author",
            "fields": [
                {
                    "prop": "Author.id",
                    "paths": ["id"],
                    "columnIndex": 0
                },
                {
                    "prop": "Author.name.firstName",
                    "paths": [
                        ["<implicit:fullName>", "name", "firstName"]
                    ],
                    "isDependent": true,
                    "columnIndex": 1
                },
                {
                    "prop": "Author.name.lastName",
                    "paths": [
                        ["<implicit:fullName>", "name", "lastName"]
                    ],
                    "isDependent": true,
                    "columnIndex": 2
                },
                {
                    "prop": "Author.fullName",
                    "paths": [
                        ["formula", "fullName"]
                    ],
                    "dependencies": [1, 2]
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "id": 0,
            "formula": {
                "fullName": "fullName"
            },
            "__implicit": {
                "fullName": {
                    "name": {
                        "firstName": 1,
                        "lastName": 2
                    }
                }
            }
        });
    });
});