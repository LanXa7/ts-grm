import { dsl, Table } from "@/dsl";
import { AbstractEntityTable, Entity } from "@/impl";
import { describe, expect, it } from "vitest";
import { BOOK, ORDER } from "../model/model";
import { expectCode } from "../utils";
import { AbstractNumExpr } from "@/impl/ast";

describe("AssociationTableTest", () => {

    it("association", () => {
        const model = dsl.associationModel(BOOK, "authors");
        const table = Entity
            .of(BOOK)
            .association("authors")
            .table(undefined) as any as Table<typeof model>;
        expectCode(table.constructor.toString(), `
            class ThisClass extends $baseClass {
                constructor(entity, joinOperation) {
                    super(entity, joinOperation);
                }
                _sourceId = undefined;
                _targetId = undefined;
                get sourceId() {
                    let expr = this._sourceId;
                    if (expr == null) {
                        this._sourceId = expr = $createTableProp(this, ThisClass.__sourceId);
                    }
                    return expr;
                }
                get targetId() {
                    let expr = this._targetId;
                    if (expr == null) {
                        this._targetId = expr = $createTableProp(this, ThisClass.__targetId);
                    }
                    return expr;
                }
                static __sourceId = $entity.prop("sourceId");
                static __targetId = $entity.prop("targetId");
            }
        `);
        expect(table.source() instanceof AbstractEntityTable).toEqual(true);
        expect(table.sourceId instanceof AbstractNumExpr).toEqual(true);
        expect(table.target() instanceof AbstractEntityTable).toEqual(true);
        expect(table.targetId instanceof AbstractNumExpr).toEqual(true);
    });

    it("multiColumnsAssociation", () => {
        const model = dsl.associationModel(ORDER, "tags");
        const table = Entity
            .of(ORDER)
            .association("tags")
            .table(undefined) as any as Table<typeof model>;
        expectCode(table.constructor.toString(), `
            class ThisClass extends $baseClass {
                constructor(entity, joinOperation) {
                    super(entity, joinOperation);
                }
                _sourceId = undefined;
                _targetId = undefined;
                sourceId() {
                    const self = this;
                    let embedded = this._sourceId;
                    if (embedded == null) {
                        this._sourceId = embedded = new class {
                            _x = undefined;
                            _y = undefined;
                            get x() {
                                let expr = this._x;
                                if (expr == null) {
                                    this._x = expr = $createTableProp(self, ThisClass.__sourceId_x);
                                }
                                return expr;
                            }
                            y() {
                                let embedded = this._y;
                                if (embedded == null) {
                                    this._y = embedded = new class {
                                        _a = undefined;
                                        _b = undefined;
                                        get a() {
                                            let expr = this._a;
                                            if (expr == null) {
                                                this._a = expr = $createTableProp(self, ThisClass.__sourceId_y_a);
                                            }
                                            return expr;
                                        }
                                        get b() {
                                            let expr = this._b;
                                            if (expr == null) {
                                                this._b = expr = $createTableProp(self, ThisClass.__sourceId_y_b);
                                            }
                                            return expr;
                                        }
                                    };
                                }
                                return embedded;
                            }
                        };
                    }
                    return embedded;
                }
                targetId() {
                    const self = this;
                    let embedded = this._targetId;
                    if (embedded == null) {
                        this._targetId = embedded = new class {
                            _low = undefined;
                            _high = undefined;
                            get low() {
                                let expr = this._low;
                                if (expr == null) {
                                    this._low = expr = $createTableProp(self, ThisClass.__targetId_low);
                                }
                                return expr;
                            }
                            get high() {
                                let expr = this._high;
                                if (expr == null) {
                                    this._high = expr = $createTableProp(self, ThisClass.__targetId_high);
                                }
                                return expr;
                            }
                        };
                    }
                    return embedded;
                }
                static __sourceId_x = $entity.prop("sourceId.x");
                static __sourceId_y_a = $entity.prop("sourceId.y.a");
                static __sourceId_y_b = $entity.prop("sourceId.y.b");
                static __targetId_low = $entity.prop("targetId.low");
                static __targetId_high = $entity.prop("targetId.high");
            }
        `);
        expect(table.source() instanceof AbstractEntityTable).toEqual(true);
        expect(table.sourceId().x instanceof AbstractNumExpr).toEqual(true);
        expect(table.sourceId().y().a instanceof AbstractNumExpr).toEqual(true);
        expect(table.sourceId().y().b instanceof AbstractNumExpr).toEqual(true);
    });
});