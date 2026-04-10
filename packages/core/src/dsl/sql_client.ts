import { ModelOf, TypeOf, View } from "@/schema/dto";
import { AtLeastOne } from "./utils";
import { BaseModel } from "./base_query";
import { AtomRootQuery, MutableRootQuery, RootQueryProjection } from "./root_query";
import { Table } from "./table";
import { Criteria } from "./criteria";
import { AnyModel } from "@/schema/model";
import { AnyAssociationModel } from "./association";

export interface SqlClient {

    __type(): { sqlClient: undefined };

    findOne<V extends View<any, any>>(
        view: V,
        criteria: Criteria<ModelOf<V>>
    ): Promise<TypeOf<V>>;

    findOneOrNull<V extends View<any, any>>(
        view: V,
        criteria: Criteria<ModelOf<V>>
    ): Promise<TypeOf<V> | null>;

    findOneOrDefined<V extends View<any, any>>(
        view: V,
        criteria: Criteria<ModelOf<V>>
    ): Promise<TypeOf<V> | undefined>;

    findMany<V extends View<any, any>>(
        view: V,
        criteria: Criteria<ModelOf<V>>
    ): Promise<Array<TypeOf<V>>>;

    createQuery<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any> | AnyAssociationModel>,
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
