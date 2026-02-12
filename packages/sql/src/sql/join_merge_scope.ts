export class JoinMergeScope {

    private static _nextIdentity = 0;

    private _identity: number;

    constructor(readonly parent: JoinMergeScope | undefined) {
        this._identity = JoinMergeScope._nextIdentity++;
    }

    get identity() {
        return this._identity;
    }
}