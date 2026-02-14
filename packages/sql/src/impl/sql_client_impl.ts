import { SqlClientOptions } from "@/cfg";
import { Driver } from "@/driver/deriver";
import { SqlClientImplementor } from "@/sql_client";
import type { 
    Criteria, 
    View, 
    TypeOf, 
    ModelOf, 
    AtLeastOne, 
    AnyModel,
    BaseModel,
    RootQueryProjection,
    RootQuery,
    MutableRootQuery,
    Table
} from "@ts-grm/core";
import { supressUnused, metadata } from "@ts-grm/core";
import { MutableRootQueryImpl } from "./mutable_root_query_impl";
import { RootQueryImpl } from "./root_query_impl";
import { AbstractRootQueryProjection } from "./root_query_projection";

export class SqlClientImpl implements SqlClientImplementor {

    __type(): { sqlClient: undefined } {
        return { sqlClient: undefined }
    }

    constructor(
        readonly driver: Driver,
        readonly options: SqlClientOptions
    ) {}

    findNonNull<V extends View<any, any>>(
        view: V,
        criteria: Criteria<ModelOf<V>>
    ): Promise<TypeOf<V>> {
        supressUnused(view);
        supressUnused(criteria);
        throw new Error();
    }

    createQuery<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any>>,
        TProjection extends RootQueryProjection<any>
    >(
        ...args: [
            ...symbols: TModels,
            fn: (
                q: MutableRootQuery,
                ...tables: {
                    [K in keyof TModels]: Table<TModels[K]>
                } extends infer T ? T extends any[] ? T : never : never
            ) => TProjection
        ]
    ): RootQuery<TProjection> {
        const mutableQuery = new MutableRootQueryImpl(this);
        const fnArgs: Array<any> = [ mutableQuery ];
        for (let i = 0; i < args.length - 1; i++) {
            fnArgs[i + 1] = metadata.Entity.of(args[i] as AnyModel).table(undefined);
        }
        const fn = args[args.length - 1] as Function;
        const projection = fn.apply(undefined, fnArgs) as AbstractRootQueryProjection<any>;
        return new RootQueryImpl<TProjection>(mutableQuery, projection, undefined);
    }
}