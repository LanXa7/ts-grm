import { AbstractExpr } from "./ast";
import { AbstractEntityTable } from "./entity_table";

export class BaseTableTarget {

    constructor(
        readonly projection: {
            readonly [key: string]: AbstractEntityTable | AbstractExpr<any> 
        }
    ) {} 
}

interface TypedBaseTable {
    __unwrap(): BaseTableTarget
}

export function createTypedBaseTable(
    projection: {
        readonly [key: string]: AbstractEntityTable | AbstractExpr<any> 
    }
): TypedBaseTable {
    const baseTable = new BaseTableTarget({...projection});
    return new Proxy(baseTable, typedBaseTableHandler) as any as TypedBaseTable;
}

const typedBaseTableHandler: ProxyHandler<BaseTableTarget> = {
    get: (target: BaseTableTarget, prop: string | symbol, _: any) => {
        if (typeof prop === 'symbol') {
            return Reflect.get(target, prop);
        }
        if (prop === "__unwrap") {
            return target;
        }
        return target.projection[prop] ?? Reflect.get(target, prop);
    }
};