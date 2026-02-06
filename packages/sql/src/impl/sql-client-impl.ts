import { 
    type SqlClient, 
    type Criteria, 
    type View, 
    type TypeOf, 
    type ModelOf, 
    type AtLeastOne, 
    type AnyModel,
    type BaseModel,
    type RootQueryProjection,
    type RootQuery,
    type MutableRootQuery,
    type Table,
    supressUnused
} from "@ts-grm/core";

export class SqlClientImpl implements SqlClient {

    __type(): { sqlClient: undefined } {
        return { sqlClient: undefined }
    }

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
        supressUnused(args);
        throw new Error();
    }
}