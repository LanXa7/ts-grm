import { StateError } from "@/error/common";
import { AbstractTable } from "./abstract_table";
import { BaseModelImplementor } from "./base_query_implementor";
import { BaseQuerySelectMapArgs } from "@/dsl";
import { makeErr } from "@/error/util";

export class BaseTableTarget {

    private _self: TypedBaseTable | undefined;

    private _args: BaseQuerySelectMapArgs | undefined;

    constructor(
        readonly baseModel: BaseModelImplementor<any>,
        readonly __isPrev: boolean
    ) {}
    
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
        const self = this._self ?? makeErr("The self has not been initialized");
        const args = { ...this.baseModel.__args };
        for (const key in args) {
            const value = args[key];
            args[key] = value.forShadow(self);
        }
        this._args = args;
        return args;
    }
}

export interface TypedBaseTable extends AbstractTable {

    __type(): {
        tableLike: true,
        baseTable: true
    };
    
    __unwrap(): BaseTableTarget;

    __isPrev: boolean;
}

export function createTypedBaseTable(
    baseModel: BaseModelImplementor<any>,
    prev: boolean
): TypedBaseTable {
    const baseTable = new BaseTableTarget(baseModel, prev);
    const proxy = new Proxy(baseTable, typedBaseTableHandler) as any as TypedBaseTable;
    baseTable.__initialize(proxy);
    return proxy;
}

const typedBaseTableHandler: ProxyHandler<BaseTableTarget> = {
    get: (target: BaseTableTarget, prop: string | symbol, _: any) => {
        if (typeof prop === 'symbol') {
            return Reflect.get(target, prop);
        }
        switch (prop) {
            case "__type":
                return () => {
                    return { tableLike: true, baseTable: true };
                };
            case "__unwrap":
                return () => target;
            case "__isPrev":
                return target.__isPrev;
            case "entity":
                return undefined;
            case "baseModel":
                return target.baseModel;
            case "shadow":
                return undefined;
            default:
                return target.__args[prop] ?? Reflect.get(target, prop);
        }
    }
};
