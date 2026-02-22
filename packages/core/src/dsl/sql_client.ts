import { ModelOf, TypeOf, View } from "@/schema/dto";
import { AtLeastOne } from "./utils";
import { BaseModel } from "./base_query";
import { AtomRootQuery, MutableRootQuery, RootQueryProjection } from "./root_query";
import { Table } from "./table";
import { Criteria } from "./criteria";
import { AnyModel } from "@/schema/model";

export interface SqlClient {

    __type(): { sqlClient: undefined };

    findNonNull<V extends View<any, any>>(
        view: V,
        criteria: Criteria<ModelOf<V>>
    ): Promise<TypeOf<V>>;

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
    ): AtomRootQuery<TProjection>;
}
