export class JoinMergeScope {

    private static _nextIdentity = 0;

    private _identity: number;

    constructor() {
        this._identity = ++JoinMergeScope._nextIdentity;
    }

    get identity() {
        return this._identity;
    }
}