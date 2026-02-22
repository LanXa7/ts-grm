import { AbstractTable } from "./abstrat_table";
import { BaseModelImplementor } from "./base_query_implementor";

export class BaseTableTarget {

    constructor(
        readonly baseModel: BaseModelImplementor<any>
    ) {} 
}

export interface TypedBaseTable extends AbstractTable {
    __unwrap(): BaseTableTarget
}

export function createTypedBaseTable(
    baseModel: BaseModelImplementor<any>
): TypedBaseTable {
    const baseTable = new BaseTableTarget(baseModel);
    return new Proxy(baseTable, typedBaseTableHandler) as any as TypedBaseTable;
}

const typedBaseTableHandler: ProxyHandler<BaseTableTarget> = {
    get: (target: BaseTableTarget, prop: string | symbol, _: any) => {
        if (typeof prop === 'symbol') {
            return Reflect.get(target, prop);
        }
        switch (prop) {
            case "__unwrap":
                return target;
            case "entity":
                return undefined;
            case "baseModel":
                return target.baseModel;
            default:
                return target.baseModel.__args[prop] ?? Reflect.get(target, prop);
        }
    }
};