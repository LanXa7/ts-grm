import { AbstractSelection, RootQueryProjection, RootQuerySelection } from "@ts-grm/core";

export abstract class AbstractRootQueryProjection<T, TKind = "ONE" | "ARRAY" | "MAP"> 
implements RootQueryProjection<T, TKind> {

    __type(): {selectedProjection: [T, TKind] | true; } {
        return { selectedProjection: true };
    }

    static of(arg: any): AbstractRootQueryProjection<any, any> {
        if (Array.isArray(arg)) {
            return new ArrRootQueryProjection(arg as ReadonlyArray<RootQuerySelection<any>>);
        }
        if (arg instanceof AbstractSelection) {
            return new ValRootQueryProjection(arg as RootQuerySelection<any>);
        }
        return new MapRootQueryProjection(arg as { readonly [key:string]: RootQuerySelection<any> });
    }
}

export class ValRootQueryProjection<T> extends AbstractRootQueryProjection<T, "ONE"> {

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
