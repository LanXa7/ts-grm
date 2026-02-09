import { Entity } from "@/index";
import { AUTHOR, BOOK, BOOK_STORE, ORDER_ITEM } from "../model/model";
import { describe, expect, it } from "vitest";
import { EntityTable } from "@/dsl/table";
import { AbstractNumExpr } from "@/impl/ast/num_expr";
import { AbstractStrExpr } from "@/impl/ast/string_expr";
import { AbstractEntityTable } from "@/impl/entity_table";
import { expectCode } from "../utils";

describe("RuntimeTableTest", () => {

    it("store", () => {
        const table = Entity.of(BOOK_STORE).table(undefined) as any as EntityTable<typeof BOOK_STORE>;
        expectCode(table.constructor.toString(), `
            class ThisClass extends $baseClass {
                constructor(entity, joinOperation) {
                    super(entity, joinOperation);
                }
                _id = undefined;
                _name = undefined;
                _version = undefined;
                _books = undefined;
                _books_LEFT = undefined;
                get id() {
                    let expr = this._id;
                    if (expr == null) {
                        this._id = expr = $createTableProp(this, ThisClass.__id);
                    }
                    return expr;
                }
                get name() {
                    let expr = this._name;
                    if (expr == null) {
                        this._name = expr = $createTableProp(this, ThisClass.__name);
                    }
                    return expr;
                }
                get version() {
                    let expr = this._version;
                    if (expr == null) {
                        this._version = expr = $createTableProp(this, ThisClass.__version);
                    }
                    return expr;
                }
                books(options) {
                    const joinType = options == null ? "INNER" : (
                        typeof options === "string" ? options : options.joinType ?? "INNER"
                    );
                    const filter = options?.filter;
                    if (filter == null && joinType === "INNER") {
                        let join = this._books;
                        if (join == null) {
                            this._books = join = ThisClass.__books.targetEntity.table({
                                parent: this, 
                                joinType, 
                                joinProp: ThisClass.__books, 
                                filter: undefined
                            });
                        }
                        return join;
                    }
                    if (filter == null && joinType === "LEFT") {
                        let join = this._books_LEFT;
                        if (join == null) {
                            this._books_LEFT = join = ThisClass.__books.targetEntity.table({
                                parent: this, 
                                joinType, 
                                joinProp: ThisClass.__books, 
                                filter: undefined
                            });
                        }
                        return join;
                    }
                    return ThisClass.__books.targetEntity.table({
                        parent: this, 
                        joinType, 
                        joinProp: ThisClass.__books, 
                        filter
                    });
                }
                static __id = $entity.expanedPropMap.get("id");
                static __name = $entity.expanedPropMap.get("name");
                static __version = $entity.expanedPropMap.get("version");
                static __books = $entity.expanedPropMap.get("books");
            }
        `);
        expect(true).toEqual(table.id instanceof AbstractNumExpr);
        expect(true).toEqual(table.name instanceof AbstractStrExpr);
        expect(true).toEqual(table.version instanceof AbstractNumExpr);
        expect(true).toEqual(table.books() instanceof AbstractEntityTable);
    });

    it("book", () => {
        const table = Entity.of(BOOK).table(undefined) as any as EntityTable<typeof BOOK>;
        expectCode(table.constructor.toString(), `
            class ThisClass extends $baseClass {
                constructor(entity, joinOperation) {
                    super(entity, joinOperation);
                }
                _id = undefined;
                _name = undefined;
                _edition = undefined;
                _price = undefined;
                _store = undefined;
                _store_LEFT = undefined;
                _authors = undefined;
                _authors_LEFT = undefined;
                _storeId = undefined;
                get id() {
                    let expr = this._id;
                    if (expr == null) {
                        this._id = expr = $createTableProp(this, ThisClass.__id);
                    }
                    return expr;
                }
                get name() {
                    let expr = this._name;
                    if (expr == null) {
                        this._name = expr = $createTableProp(this, ThisClass.__name);
                    }
                    return expr;
                }
                get edition() {
                    let expr = this._edition;
                    if (expr == null) {
                        this._edition = expr = $createTableProp(this, ThisClass.__edition);
                    }
                    return expr;
                }
                get price() {
                    let expr = this._price;
                    if (expr == null) {
                        this._price = expr = $createTableProp(this, ThisClass.__price);
                    }
                    return expr;
                }
                store(options) {
                    const joinType = options == null ? "INNER" : (
                        typeof options === "string" ? options : options.joinType ?? "INNER"
                    );
                    const filter = options?.filter;
                    if (filter == null && joinType === "INNER") {
                        let join = this._store;
                        if (join == null) {
                            this._store = join = ThisClass.__store.targetEntity.table({
                                parent: this, 
                                joinType, 
                                joinProp: ThisClass.__store, 
                                filter: undefined
                            });
                        }
                        return join;
                    }
                    if (filter == null && joinType === "LEFT") {
                        let join = this._store_LEFT;
                        if (join == null) {
                            this._store_LEFT = join = ThisClass.__store.targetEntity.table({
                                parent: this, 
                                joinType, 
                                joinProp: ThisClass.__store, 
                                filter: undefined
                            });
                        }
                        return join;
                    }
                    return ThisClass.__store.targetEntity.table({
                        parent: this, 
                        joinType, 
                        joinProp: ThisClass.__store, 
                        filter
                    });
                }
                authors(options) {
                    const joinType = options == null ? "INNER" : (
                        typeof options === "string" ? options : options.joinType ?? "INNER"
                    );
                    const filter = options?.filter;
                    if (filter == null && joinType === "INNER") {
                        let join = this._authors;
                        if (join == null) {
                            this._authors = join = ThisClass.__authors.targetEntity.table({
                                parent: this, 
                                joinType, 
                                joinProp: ThisClass.__authors, 
                                filter: undefined
                            });
                        }
                        return join;
                    }
                    if (filter == null && joinType === "LEFT") {
                        let join = this._authors_LEFT;
                        if (join == null) {
                            this._authors_LEFT = join = ThisClass.__authors.targetEntity.table({
                                parent: this, 
                                joinType, 
                                joinProp: ThisClass.__authors, 
                                filter: undefined
                            });
                        }
                        return join;
                    }
                    return ThisClass.__authors.targetEntity.table({
                        parent: this, 
                        joinType, 
                        joinProp: ThisClass.__authors, 
                        filter
                    });
                }
                get storeId() {
                    let expr = this._storeId;
                    if (expr == null) {
                        this._storeId = expr = $createTableProp(this, ThisClass.__storeId);
                    }
                    return expr;
                }
                static __id = $entity.expanedPropMap.get("id");
                static __name = $entity.expanedPropMap.get("name");
                static __edition = $entity.expanedPropMap.get("edition");
                static __price = $entity.expanedPropMap.get("price");
                static __store = $entity.expanedPropMap.get("store");
                static __authors = $entity.expanedPropMap.get("authors");
                static __storeId = $entity.expanedPropMap.get("storeId");
            }
        `);
        expect(true).toEqual(table.id instanceof AbstractNumExpr);
        expect(true).toEqual(table.name instanceof AbstractStrExpr);
        expect(true).toEqual(table.edition instanceof AbstractNumExpr);
        expect(true).toEqual(table.price instanceof AbstractNumExpr);
        expect(true).toEqual(table.storeId instanceof AbstractNumExpr);
        expect(true).toEqual(table.store() instanceof AbstractEntityTable);
        expect(true).toEqual(table.authors() instanceof AbstractEntityTable);
    });

    it("author", () => {
        const table = Entity.of(AUTHOR).table(undefined) as any as EntityTable<typeof AUTHOR>;
        expectCode(table.constructor.toString(), `
            class ThisClass extends $baseClass {
                constructor(entity, joinOperation) {
                    super(entity, joinOperation);
                }
                _id = undefined;
                _name = undefined;
                _books = undefined;
                _books_LEFT = undefined;
                get id() {
                    let expr = this._id;
                    if (expr == null) {
                        this._id = expr = $createTableProp(this, ThisClass.__id);
                    }
                    return expr;
                }
                name() {
                    let embedded = this._name;
                    if (embedded == null) {
                        this._name = embedded = new class {
                            _firstName = undefined;
                            _lastName = undefined;
                            get firstName() {
                                let expr = this._firstName;
                                if (expr == null) {
                                    this._firstName = expr = $createTableProp(this, ThisClass.__name_firstName);
                                }
                                return expr;
                            }
                            get lastName() {
                                let expr = this._lastName;
                                if (expr == null) {
                                    this._lastName = expr = $createTableProp(this, ThisClass.__name_lastName);
                                }
                                return expr;
                            }
                        }
                    }
                    return embedded;
                }
                books(options) {
                    const joinType = options == null ? "INNER" : (
                        typeof options === "string" ? options : options.joinType ?? "INNER"
                    );
                    const filter = options?.filter;
                    if (filter == null && joinType === "INNER") {
                        let join = this._books;
                        if (join == null) {
                            this._books = join = ThisClass.__books.targetEntity.table({
                                parent: this, 
                                joinType, 
                                joinProp: ThisClass.__books, 
                                filter: undefined
                            });
                        }
                        return join;
                    }
                    if (filter == null && joinType === "LEFT") {
                        let join = this._books_LEFT;
                        if (join == null) {
                            this._books_LEFT = join = ThisClass.__books.targetEntity.table({
                                parent: this, 
                                joinType, 
                                joinProp: ThisClass.__books, 
                                filter: undefined
                            });
                        }
                        return join;
                    }
                    return ThisClass.__books.targetEntity.table({
                        parent: this, 
                        joinType, 
                        joinProp: ThisClass.__books, 
                        filter
                    });
                }
                static __id = $entity.expanedPropMap.get("id");
                static __name_firstName = $entity.expanedPropMap.get("name.firstName");
                static __name_lastName = $entity.expanedPropMap.get("name.lastName");
                static __books = $entity.expanedPropMap.get("books");
            }
        `);
        expect(true).toEqual(table.id instanceof AbstractNumExpr);
        expect(true).toEqual(table.name().firstName instanceof AbstractStrExpr);
        expect(true).toEqual(table.name().lastName instanceof AbstractStrExpr);
        expect(true).toEqual(table.books().$acceptRisk() instanceof AbstractEntityTable);
    });

    it("orderItem", () => {
        const table = Entity.of(ORDER_ITEM).table(undefined) as any as EntityTable<typeof ORDER_ITEM>;
        expectCode(table.constructor.toString(), `
            class ThisClass extends $baseClass {
                constructor(entity, joinOperation) {
                    super(entity, joinOperation);
                }
                _id = undefined;
                _order = undefined;
                _order_LEFT = undefined;
                _orderId = undefined;
                get id() {
                    let expr = this._id;
                    if (expr == null) {
                        this._id = expr = $createTableProp(this, ThisClass.__id);
                    }
                    return expr;
                }
                order(options) {
                    const joinType = options == null ? "INNER" : (
                        typeof options === "string" ? options : options.joinType ?? "INNER"
                    );
                    const filter = options?.filter;
                    if (filter == null && joinType === "INNER") {
                        let join = this._order;
                        if (join == null) {
                            this._order = join = ThisClass.__order.targetEntity.table({
                                parent: this, 
                                joinType, 
                                joinProp: ThisClass.__order, 
                                filter: undefined
                            });
                        }
                        return join;
                    }
                    if (filter == null && joinType === "LEFT") {
                        let join = this._order_LEFT;
                        if (join == null) {
                            this._order_LEFT = join = ThisClass.__order.targetEntity.table({
                                parent: this, 
                                joinType, 
                                joinProp: ThisClass.__order, 
                                filter: undefined
                            });
                        }
                        return join;
                    }
                    return ThisClass.__order.targetEntity.table({
                        parent: this, 
                        joinType, 
                        joinProp: ThisClass.__order, 
                        filter
                    });
                }
                orderId() {
                    let embedded = this._orderId;
                    if (embedded == null) {
                        this._orderId = embedded = new class {
                            _x = undefined;
                            _y = undefined;
                            get x() {
                                let expr = this._x;
                                if (expr == null) {
                                    this._x = expr = $createTableProp(this, ThisClass.__orderId_x);
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
                                                this._a = expr = $createTableProp(this, ThisClass.__orderId_y_a);
                                            }
                                            return expr;
                                        }
                                        get b() {
                                            let expr = this._b;
                                            if (expr == null) {
                                                this._b = expr = $createTableProp(this, ThisClass.__orderId_y_b);
                                            }
                                            return expr;
                                        }
                                    }
                                }
                                return embedded;
                            }
                        }
                    }
                    return embedded;
                }
                static __id = $entity.expanedPropMap.get("id");
                static __order = $entity.expanedPropMap.get("order");
                static __orderId_x = $entity.expanedPropMap.get("orderId.x");
                static __orderId_y_a = $entity.expanedPropMap.get("orderId.y.a");
                static __orderId_y_b = $entity.expanedPropMap.get("orderId.y.b");
            }
        `);
        expect(true).toEqual(table.id instanceof AbstractNumExpr);
        expect(true).toEqual(table.order() instanceof AbstractEntityTable);
        expect(true).toEqual(table.orderId().x instanceof AbstractNumExpr);
        expect(true).toEqual(table.orderId().y().a instanceof AbstractNumExpr);
        expect(true).toEqual(table.orderId().y().b instanceof AbstractNumExpr);
    });
});