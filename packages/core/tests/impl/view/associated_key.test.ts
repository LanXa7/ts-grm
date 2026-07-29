import { dto } from "@/index";
import { describe, expect, it } from "vitest";
import { BOOK, ORDER_ITEM } from "../../model/model";
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
});