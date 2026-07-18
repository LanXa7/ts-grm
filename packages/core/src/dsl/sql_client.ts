import { AtLeastOne } from "./utils";
import { BaseModel } from "./base_query";
import { AtomRootQuery, MutableRootQuery, RootQueryProjection } from "./root_query";
import { Table } from "./table";
import { Criteria } from "./criteria";
import { AnyModel } from "@/schema/model";
import { AnyAssociationModel } from "./association";
import { FetchPageOptions, FetchRangeOptions, Page } from "./page";
import { TypeOf, View } from "@/schema/dto/api";
import { __ModelOf } from "@/schema/dto/internal_types";

export interface SqlClient {

    __type(): { sqlClient: undefined };

    findOne<V extends View<any, any>>(
        view: V,
        criteria: Criteria<__ModelOf<V>>
    ): Promise<TypeOf<V>>;

    findOneOrNull<V extends View<any, any>>(
        view: V,
        criteria: Criteria<__ModelOf<V>>
    ): Promise<TypeOf<V> | null>;

    findOneOrUndefined<V extends View<any, any>>(
        view: V,
        criteria: Criteria<__ModelOf<V>>
    ): Promise<TypeOf<V> | undefined>;

    findMany<V extends View<any, any>>(
        view: V,
        criteria: Criteria<__ModelOf<V>>
    ): Promise<Array<TypeOf<V>>>;

    findRange<V extends View<any, any>>(
        view: V,
        criteria: Criteria<__ModelOf<V>>,
        options: FetchRangeOptions
    ): Promise<Array<TypeOf<V>>>;

    findPage<V extends View<any, any>>(
        view: V,
        criteria: Criteria<__ModelOf<V>>,
        options: FetchPageOptions
    ): Promise<Page<TypeOf<V>>>;

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

    execute<R>(
        fn: () => Promise<R>
    ): Promise<R>;

    execute<R>(
        propagation: Propagation,
        fn: () => Promise<R>
    ): Promise<R>;

    execute<R>(
        isolation: Isolation,
        fn: () => Promise<R>
    ): Promise<R>;

    execute<R>(
        timeout: number,
        fn: () => Promise<R>
    ): Promise<R>;

    execute<R>(
        options: Partial<TransactionOptions>,
        fn: () => Promise<R>
    ): Promise<R>;

    createSchema(): Promise<Schema>;
}

export type Propagation =
    "REQUIRED"
    | "REQUIRES_NEW"
    | "NOT_SUPPORTED"
    | "NEVER"
    | "MANDATORY"
    | "NESTED";

export type Isolation =
    "READ_UNCOMMITTED" 
    | "READ_COMMITTED" 
    | "REPEATABLE_READ"
    | "SERIALIZABLE";

export type TransactionOptions =
    {
        readonly propagation: Propagation;
        readonly isolation: Isolation;
        readonly timeout: number;
    };

export interface Schema {

    readonly sqlArray: ReadonlyArray<string>;

    execute(): Promise<void>;

    toString(): string;
}