import { StateError } from "@/error/common";
import { AbstractTable, createJoinedTable } from "./abstract_table";
import { BaseModelImplementor } from "./base_query_implementor";
import { BaseQuerySelectMapArgs } from "@/dsl/base_query";
import { makeErr } from "@/error/util";
import { JoinFilter, JoinOperation } from "./entity_table";
import { ModelLike } from "@/dsl/table_internal_types";
import { JoinType } from "@/dsl/table";

class BaseTableTarget {

    // This class is uesed to be stub of proxy, _self means the proxy
    private _self: TypedBaseTable | undefined;

    private _args: BaseQuerySelectMapArgs | undefined;

    readonly __joinOperation: JoinOperation | undefined;

    readonly __isPrev: boolean = false;

    constructor(
        readonly __baseModel: BaseModelImplementor<any>,
        options: JoinOperation | "PREV" | undefined
    ) {
        let joinOperation: JoinOperation | undefined;
        let isPrev: boolean | undefined;

        if (typeof options === "string") {
            joinOperation = undefined;
            isPrev = true;
        } else if (options != null) {
            joinOperation = options;
            isPrev = false;
        } else {
            joinOperation = undefined;
            isPrev = false;
        }
        this.__joinOperation = joinOperation;
        this.__isPrev = isPrev;
    }
    
    __initialize(self: TypedBaseTable) {
        if (this._self != null) {
            throw new StateError("BaseTableTarget cannot be initialized twice");
        }
        this._self = self;
    }

    get __args(): BaseQuerySelectMapArgs {
        if (this._args != null) {
            return this._args;
        }
        const self = this.self;
        const args = { ...this.__baseModel.__args };
        for (const key in args) {
            const value = args[key];
            args[key] = value.__forShadow(self);
        }
        this._args = args;
        return args;
    }

    get self(): TypedBaseTable {
        return this._self ?? makeErr("The self has not been initialized");
    }
}

export interface TypedBaseTable extends AbstractTable {

    __type(): {
        tableLike: true,
        baseTable: true
    };
    
    __unwrap(): BaseTableTarget;
}

export function createTypedBaseTable(
    baseModel: BaseModelImplementor<any>,
    options: JoinOperation | "PREV" | undefined
): TypedBaseTable {
    const baseTable = new BaseTableTarget(baseModel, options);
    const proxy = new Proxy(baseTable, typedBaseTableHandler) as any as TypedBaseTable;
    baseTable.__initialize(proxy);
    return proxy;
}

const typedBaseTableHandler: ProxyHandler<BaseTableTarget> = {
    get: (target: BaseTableTarget, prop: string | symbol, _: any) => {
        if (typeof prop === "symbol") {
            return Reflect.get(target, prop);
        }
        switch (prop) {
            case "__type":
                return () => {
                    return { tableLike: true, baseTable: true };
                };
            case "__prototype":
                return target.self;
            case "__isNullable":
                return target.__joinOperation?.joinType === "LEFT";
            case "__unwrap":
                return () => target;
            case "__isCte":
                return target.__baseModel.__isCte;
            case "__isPrev":
                return target.__isPrev;
            case "__entity":
                return undefined;
            case "__baseModel":
                return target.__baseModel;
            case "__associationEntity":
                return undefined;
            case "__anchor":
                return undefined;
            case "__shadow":
                return undefined;
            case "join":
                return (model: ModelLike, options: {
                    readonly joinType?: JoinType,
                    readonly filter: JoinFilter
                }) => createJoinedTable(target.self, model, options);
            default:
                return target.__args[prop] ?? Reflect.get(target, prop);
        }
    }
};
