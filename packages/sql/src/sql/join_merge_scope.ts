export class JoinMergeScope {

    private static _nextIdentity = 0;

    readonly identity: number = ++JoinMergeScope._nextIdentity;
}