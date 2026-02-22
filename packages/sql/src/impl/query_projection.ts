import { ast, BaseQuerySelectMapArgs, RootQueryProjection, RootQuerySelection } from "@ts-grm/core";

export abstract class AbstractQueryProjection {}

export abstract class AbstractRootQueryProjection<T, TKind = "ONE" | "ARRAY" | "MAP"> 
implements RootQueryProjection<T, TKind> {

    __type(): {selectedProjection: [T, TKind] | true; } {
        return { selectedProjection: true };
    }

    static of(arr: any): AbstractRootQueryProjection<any, any> {
        if (arr.length > 1) {
            return new ArrRootQueryProjection(arr as ReadonlyArray<RootQuerySelection<any>>);
        }
        const arg = arr[0];
        if (arg instanceof ast.AbstractSelection) {
            return new ValRootQueryProjection(arg as RootQuerySelection<any>);
        }
        return new MapRootQueryProjection(arg as { readonly [key:string]: RootQuerySelection<any> });
    }
}

export class ValRootQueryProjection<T> extends AbstractRootQueryProjection<T, "ONE"> {

    readonly kind = "ROOT_SINGLE";

    constructor(
        readonly selection: RootQuerySelection<T>
    ) {
        super();
    }
}

export class ArrRootQueryProjection<T> extends AbstractRootQueryProjection<T, "ARRAY"> {

    constructor(
        readonly selections: ReadonlyArray<RootQuerySelection<any>>
    ) {
        super();
    }
}

export class MapRootQueryProjection<T> extends AbstractRootQueryProjection<T, "MAP"> {

    constructor(
        readonly selections: { readonly [key: string]: RootQuerySelection<any> }
    ) {
        super();
    }
}

export class MapBaseQueryProjection<T extends BaseQuerySelectMapArgs> extends AbstractQueryProjection {

    __type(): { baseQueryProjection: T | true } {
        return { baseQueryProjection: true };
    }

    constructor(readonly args: T) {
        super();
    }
}