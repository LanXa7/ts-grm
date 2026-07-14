import { describe, expect, it } from "vitest";
import { ORDER_ITEM } from "../../model/model";
import { expectCode } from "../../utils";
import { mapperJson, makeReader, shapeJson } from "./utils";
import { newView } from "@/schema/dto/index";

describe("EmbeddedTest", () => {

    it("implicitEmbeddedReferenceKey", () => {
        const view = newView(ORDER_ITEM, c => [
            c.order.with(c => [c.name])
        ]);
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
        expect(shapeJson(view.mapper)).toEqual({
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

        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        order: null
                    };
                    const implicit = {
                        _0: reader.get(0), 
                        _1: reader.get(1), 
                        _2: reader.get(2)
                    };
                    return { reader: this, parents, dto, implicit, typeName: undefined };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return [
                                row.implicit._0, 
                                row.implicit._1, 
                                row.implicit._2
                            ];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] == null && dependency[1] == null && dependency[2] == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] + "\\x1F" + dependency[1] + "\\x1F" + dependency[2];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            row.dto.order = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const row = view.mapper.dtoRowReader.read(
            undefined,
            makeReader(32, 16, 16)
        );
        expect(row.implicit).toEqual({
            _0: 32,
            _1: 16,
            _2: 16
        });

        const orderMapper = view.mapper.fields.find(f => f.prop.name === "order")!.subMapper!;
        expectCode(orderMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0)
                    };
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
                }
            }
        `);
        const orderRow = orderMapper.dtoRowReader.read(
            undefined,
            makeReader("my-order")
        );
        expect(orderRow.dto).toEqual({
            name: "my-order"
        });
    });

    it("explicitEmbeddedReferenceKey", () => {
        const view = newView(ORDER_ITEM, c => [
            c.orderId,
            c.order.with(c => [c.name])
        ]);
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
        expect(shapeJson(view.mapper)).toEqual({
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

        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        orderId: null, 
                        order: null
                    };
                    this._orderId(dto).x = reader.get(0);
                    this._orderId_y(dto).a = reader.get(1);
                    this._orderId_y(dto).b = reader.get(2);
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
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return [
                                row.dto.orderId?.x, 
                                row.dto.orderId?.y?.a, 
                                row.dto.orderId?.y?.b
                            ];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] == null && dependency[1] == null && dependency[2] == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] + "\\x1F" + dependency[1] + "\\x1F" + dependency[2];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            row.dto.order = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const row = view.mapper.dtoRowReader.read(
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
        expectCode(orderMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0)
                    };
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
                }
            }
        `);
        const orderRow = orderMapper.dtoRowReader.read(
            undefined,
            makeReader("my-order")
        );
        expect(orderRow.dto).toEqual({
            name: "my-order"
        });
    });

    it("mixedEmbeddedReferenceKey", () => {
        const view = newView(ORDER_ITEM, c => [
            c.orderId.with(c => [c.y]),
            c.order.with(c => [c.name])
        ]);
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
        expect(shapeJson(view.mapper)).toEqual({
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

        expectCode(view.mapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        orderId: null, 
                        order: null
                    };
                    const implicit = {
                        _2: reader.get(2)
                    };
                    this._orderId_y(dto).a = reader.get(0);
                    this._orderId_y(dto).b = reader.get(1);
                    return { reader: this, parents, dto, implicit, typeName: undefined };
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
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return [
                                row.implicit._2, 
                                row.dto.orderId?.y?.a, 
                                row.dto.orderId?.y?.b
                            ];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyNullable(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] == null && dependency[1] == null && dependency[2] == null;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            return dependency[0] + "\\x1F" + dependency[1] + "\\x1F" + dependency[2];
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 3:
                            row.dto.order = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const row = view.mapper.dtoRowReader.read(
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
        expectCode(orderMapper.dtoRowReader.constructor.toString(), `
            class ThisClass extends $baseClass {
                read(parents, reader) {
                    const dto = {
                        name: reader.get(0)
                    };
                    return { reader: this, parents, dto, implicit: undefined, typeName: undefined };
                }
            }
        `);
        const orderRow = orderMapper.dtoRowReader.read(
            undefined,
            makeReader("my-order")
        );
        expect(orderRow.dto).toEqual({
            name: "my-order"
        });
    });
});