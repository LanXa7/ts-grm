import { 
    ast, 
    dsl, 
    err,
    metadata, 
    RootQuery, 
    RootQueryProjection, 
    View, 
    ExpressionLike, 
    ExpressionOrder, 
    AnyModel, 
    RootQuerySelectArrArgs, 
    Expression, 
    AtLeastTwo, 
    Predicate, 
    EntityTableLike,
    EntityTable,
    SelectionLike
} from "@ts-grm/core";
import { MergedRootQueryImpl } from "./merged_query";
import { AtomRootQueryImpl } from "./atom_root_query_impl";
import { Composite } from "@/sql/fragment";
import { SqlBuilder } from "@/sql/sql_builder";
import { DataRow, DataRowReader, DataRows } from "./data_row_reader";
import { SqlClientImplementor } from "@/sql_client";

export async function executeQuery<TProjection extends RootQueryProjection<any>>(
    query: RootQuery<TProjection>
): Promise<ReadonlyArray<any>> {
    const contract = query as any as ast.QueryContract;
    const sqlClient = contract.kind === "ATOM"
        ? (query as AtomRootQueryImpl<TProjection>).mutableQuery.sqlClient
        : (query as any as MergedRootQueryImpl<TProjection>).sqlClient;
    const [sql, args] = buildStatement(sqlClient, query);
    const transactionManager = sqlClient.driver.transactionManager;
    return transactionManager.executeReadonly(async () => {
        const dataRows = await sqlClient.executor.executeStatement(sql, args, { kind: "QUERY" });
        const dataRowReader = DataRowReader.of(dataRows);
        switch (contract.projection.kind) {
            case "ROOT_SINGLE":
                const selection = contract.projection.selection;
                if (selection instanceof metadata.FetchedViewImpl) {
                    return await readDto(sqlClient, selection.view.mapper, dataRowReader);
                }
                throw new Error();
            default:
                throw new Error();
        }
    });
}

function buildStatement(
    sqlClient: SqlClientImplementor,
    query: RootQuery<any>
): [string, ReadonlyArray<any>] {
    const composite = Composite.of(query, sqlClient, undefined);
    const builder = SqlBuilder.of(sqlClient);
    composite.into(builder);
    const [sql, argumentMap] = builder.build();
    const args = Array.from(argumentMap.values());
    return [sql, args];
}

async function readDto(
    sqlClient: SqlClientImplementor,
    mapper: metadata.DtoMapper,
    dataRowReader: DataRowReader
): Promise<ReadonlyArray<any>> {
    const dtoRows: Array<metadata.DtoRow> = [];
    const dtos: Array<any> = [];
    const dtoRowReader = mapper.dtoRowReader;
    while (dataRowReader.next()) {
        const dtoRow = dtoRowReader.read(undefined, dataRowReader);
        dtoRows.push(dtoRow);
        dtos.push(dtoRow.dto);
    }
    await resolveAssociations(sqlClient, mapper, dtoRows, undefined);
    return dtos;
}

async function resolveAssociations(
    sqlClient: SqlClientImplementor,
    mapper: metadata.DtoMapper,
    sourceRows: ReadonlyArray<metadata.DtoRow>,
    recursiveContext: RecursiveContext | undefined
): Promise<void> {
    if (sourceRows.length === 0) {
        return;
    }
    for (const unresolvedField of mapper.unresolvedFields) {
        if (unresolvedField.subMapper != null || recursiveContext != null) {
            await new AssociationResolver(
                sqlClient, 
                mapper, 
                unresolvedField, 
                sourceRows, 
                recursiveContext
            ).resolve();
        }
    }
}

class AssociationResolver {

    private readonly _unresolvedField: metadata.DtoMapperField;

    private readonly _targetMapper: metadata.DtoMapper;

    private readonly _sourceDtoRowReader: metadata.DtoRowReader;

    private readonly _targetDtoRowReader: metadata.DtoRowReader;

    private readonly _isCollection: boolean;

    private readonly _batchSize: number;

    private readonly _bindingMap = new Map<any, Binding>();

    constructor(
        private _sqlClient: SqlClientImplementor,
        private readonly _sourceMapper: metadata.DtoMapper,
        unresolvedField: metadata.DtoMapperField,
        private readonly _sourceRows: ReadonlyArray<metadata.DtoRow>,
        private readonly _recursiveContext: RecursiveContext | undefined
    ) {
        if (unresolvedField.subMapper != null) { // Assocaition
            this._unresolvedField = unresolvedField;
            this._targetMapper = unresolvedField.subMapper!;
        } else { // Recursive
            this._unresolvedField = _sourceMapper.fields.find(f => f.prop === unresolvedField.prop)!;
            this._targetMapper = _sourceMapper;
        }
        this._sourceDtoRowReader = this._sourceMapper.dtoRowReader;
        this._targetDtoRowReader = this._targetMapper.dtoRowReader;
        const associationType = unresolvedField.prop.associationType;
        this._isCollection = associationType === "ONE_TO_MANY" || associationType === "MANY_TO_MANY";
        if (this._isCollection) {
            this._batchSize = _sqlClient.options.defaultListBatchSize;
        } else {
            this._batchSize = _sqlClient.options.defaultBatchSize;
        }
    }

    private _dependencyArr(
        targetTable: any
    ): ReadonlyArray<Expression<any>> {
        const entityTable = targetTable as any as metadata.AbstractEntityTable;
        if (this._unresolvedField.prop.referenceKeyProp != null) {
            const keyProps = this._unresolvedField.prop.targetKeyProp!.scalarProps!;
            return keyProps.map(p => entityTable.__expression(p)) as any;
        }
        return targetTable.__inverseAssociatedKeyArr(
            this._sourceMapper.entity.model, 
            this._unresolvedField.prop.name
        );
    }

    private _keyExprArr(
        targetTable: any
    ): ReadonlyArray<Expression<any>> {
        let keyProps: ReadonlyArray<metadata.EntityProp>;
        if (this._unresolvedField.prop.referenceKeyProp != null) {
            keyProps = this._unresolvedField.prop.referenceKeyProp.scalarProps!;
        } else {
            keyProps = (
                this._unresolvedField.prop.targetKeyProp 
                ?? this._unresolvedField.prop.targetEntity!.idProp
            ).scalarProps!;
        }
        const entityTable = targetTable as any as metadata.AbstractEntityTable;
        return keyProps.map(p => entityTable.__expression(p)) as any;
    }

    private get _keySpan(): number {
        return (
            this._unresolvedField.prop.targetKeyProp 
            ?? this._unresolvedField.prop.targetEntity!.idProp
        ).span;
    }

    private _orders(
        targetTable: any
    ): ReadonlyArray<ExpressionOrder> {
        const entityTable = targetTable as any as metadata.AbstractEntityTable;
        const arr: Array<ExpressionOrder> = [];
        const orders = this._unresolvedField.orders;
        if (orders != null) {
            for (const order of orders) {
                arr.push(
                    new ExpressionOrder(
                        entityTable.__expression(order.prop),
                        order.desc,
                        order.nulls
                    )
                );
            }
        };
        return arr;
    }

    async resolve(): Promise<void> {
        const unresolvedFieldIndex = this._unresolvedField.index;
        const dtoRowReader = this._sourceDtoRowReader;
        const bindingMap = this._bindingMap;
        for (const sourceRow of this._sourceRows) {
            const dependency = dtoRowReader.dependency(unresolvedFieldIndex, sourceRow);
            if (dtoRowReader.dependencyNullable(unresolvedFieldIndex, dependency)) {
                continue;
            }
            const hash = dtoRowReader.dependencyHash(unresolvedFieldIndex, dependency);
            let binding = bindingMap.get(hash);
            if (binding != null) {
                binding.sourceRows.push(sourceRow);
                continue;
            }
            binding = {
                dependency,
                sourceRows: [sourceRow],
                targetData: undefined,
                targetIdMap: undefined
            };
            bindingMap.set(hash, binding);
        }
        await this._resolve();
    }

    private async _resolve(): Promise<void> {
        const dependencies: Array<any> = [];
        for (const binding of this._bindingMap.values()) {
            dependencies.push(binding.dependency);
        }
        const recursiveContexts: Array<RecursiveContext> = [];
        if (dependencies.length <= this._batchSize || this._recursiveContext != null) {
            const recursiveContext = await this._resolveBatch(dependencies);
            if (recursiveContext != null) {
                recursiveContexts.push(recursiveContext);
            }
        } else {
            let start = 0;
            while (start < this._batchSize) {
                const end = Math.min(dependencies.length, start + this._batchSize);
                const batchDependencies = dependencies.slice(start, end);
                const recursiveContext = await this._resolveBatch(batchDependencies);
                if (recursiveContext != null) {
                    recursiveContexts.push(recursiveContext);
                }
                start += this._batchSize;
            }
        }
        const recursiveContext = RecursiveContext.merge(recursiveContexts);
        const unresolvedFieldIndex = this._unresolvedField.index;
        const sourceDtoRowReader = this._sourceDtoRowReader;
        const targetRows: Array<metadata.DtoRow> = [];
        let targetRowMap = this._byTargetKey ? await recursiveContext?.targetRowMap() : undefined;
        for (const binding of this._bindingMap.values()) {
            const targetData = binding.targetData;
            const targetIdMap = binding.targetIdMap;
            let value: any;
            if (this._isCollection) {
                if (targetData == null && targetIdMap == null) {
                    if ((this._recursiveContext?.isBound ?? false)) {
                        value = this._sourceMapper.nullAsUndefined ? undefined : null;
                    } else {
                        value = [];
                    }
                } else if(this._byTargetKey) {
                    const arr = [];
                    for (const targetId of targetIdMap!.values()) {
                        const targetRow = targetRowMap!.get(targetId);
                        if (targetRow != null) {
                            arr.push(targetRow.dto);
                            targetRows.push(targetRow);
                        }
                        value = arr;
                    }
                } else if (Array.isArray(targetData)) {
                    value = targetData.map(row => row.dto);
                    targetRows.push(...targetData);
                } else {
                    value = [(targetData as metadata.DtoRow).dto];
                    targetRows.push(targetData as metadata.DtoRow);
                }
            } else {
                if (targetData == null) {
                    value = this._sourceMapper.nullAsUndefined ? undefined : null;
                } else if (Array.isArray(targetData)) {
                    const arr = targetData as ReadonlyArray<metadata.DtoRow>;
                    throw new err.StateError(
                        `Cannot resolve the assocaition property "${
                            this._unresolvedField.prop.toString()
                        }", it is reference but there are ${
                            arr.length
                        } associated objects`
                    );
                } else {
                    value = (targetData as metadata.DtoRow).dto;
                    targetRows.push(targetData as metadata.DtoRow);
                }
            }
            for (const sourceRow of binding.sourceRows) {
                sourceDtoRowReader.resolve(
                    unresolvedFieldIndex, 
                    sourceRow, 
                    value
                );
            }
        }
        await resolveAssociations(
            this._sqlClient, 
            this._targetMapper, 
            targetRows, 
            recursiveContext?.toDeeperContext()
        );
    }

    private async _resolveBatch(
        dependencies: ReadonlyArray<any>
    ): Promise<RecursiveContext | undefined> {
        const view = new View<AnyModel, any>(this._unresolvedField.subMapper!);
        const keySpan = this._unresolvedField.dependencies!.length;
        let keyRowReader: DataRowReader;
        let recursiveContext = this._recursiveContext;
        if (recursiveContext != null) {
            keyRowReader = recursiveContext.toKeyRowReader();
        } else {
            const isRecursive = this._unresolvedField.recursiveDepth != null;
            const query = isRecursive
                ? this._createRecursiveQuery(dependencies, view)
                : this._createQuery(dependencies, view);
            const [sql, args] = buildStatement(this._sqlClient, query);
            const dataRows = await this._sqlClient.executor.executeStatement(sql, args, {
                kind: isRecursive 
                    ? (this._byTargetKey ? "LOAD_RECURSIVE_TREE_ID" : "LOAD_RECURSIVE_TREE")
                    : "LOAD_ASSOCIATION",
                prop: this._unresolvedField.prop as metadata.EntityProp
            });
            if (isRecursive && recursiveContext == null) {
                recursiveContext = new RecursiveContext(
                    dataRows, 
                    keySpan, 
                    this._byTargetKey ? this._keySpan : view.mapper.span, 
                    this._byTargetKey 
                        ? { 
                            getter: async(ids: ReadonlyArray<any>) => this._targetRowMap(ids, view), 
                            map: undefined 
                        }
                        : undefined,
                    this._unresolvedField.recursiveDepth, 
                    0
                );
            }
            keyRowReader = recursiveContext?.toKeyRowReader() ?? DataRowReader.of(dataRows);
        }
        const valueRowReader = keyRowReader.offset(keySpan);
        const sourceDtoRowReader = this._sourceDtoRowReader;
        const targetDtoRowReader = this._targetDtoRowReader;
        while (keyRowReader.next()) {
            const key = keyRowReader.get(0, keySpan);
            const binding = this._bindingMap.get(sourceDtoRowReader.dependencyHash(this._unresolvedField.index, key))
            if (binding == null) {
                continue;
            }
            const row = this._byTargetKey 
                ? valueRowReader.get(0, this._keySpan)
                : targetDtoRowReader.read(binding.sourceRows, valueRowReader);
            if (this._byTargetKey) {
                let map = binding.targetIdMap;
                if (map == null) {
                    binding.targetIdMap = map = new Map();
                }
                map.set(hashOf(row), row);
            } else if (binding.targetData == null) {
                binding.targetData = row;
            } else if (!this._isCollection) {
                // Do nothing
            } else if (!Array.isArray(binding.targetData)) {
                binding.targetData = [binding.targetData as metadata.DtoRow, row];
            } else {
                binding.targetData.push(row);
            }
        }
        return recursiveContext;
    }

    private _createQuery(
        dependencies: ReadonlyArray<any>, 
        view: View<AnyModel, any>
    ): RootQuery<any> {
        const model = this._unresolvedField.subMapper!.entity.model;
        return this._sqlClient.createQuery(model, (q, target) => {
            const dependencyArr = this._dependencyArr(target);
            q.where(expressionsToAst(dependencyArr).in(...dependencies));  
            if (this._isCollection) {
                q.orderBy(...this._orders(target));
            }
            const selections = [...dependencyArr, target.fetch(view)] as any as RootQuerySelectArrArgs;
            return q.select(...selections);
        })
    }

    private _createRecursiveQuery(
        dependencies: ReadonlyArray<any>, 
        view: View<AnyModel, any>
    ): RootQuery<any> {
        const model = this._unresolvedField.subMapper!.entity.model;
        const baseModel = dsl.cteModel(
            dsl.baseQuery(model, (q, target) => {
                const dependencyArr = this._dependencyArr(target) as any;
                q.where((expressionsToAst(dependencyArr)).in(...dependencies));
                return q.select(
                    baseQuerySelectionMapArgs(
                        dependencyArr, 
                        target, 
                        dsl.constant(0)
                    )
                );
            }).unionAllRecursively(model, {
                join: (prev, target) => { 
                    const dependencyArr = this._dependencyArr(target) as any;
                    let keyProps: ReadonlyArray<metadata.EntityProp>;
                    if (this._unresolvedField.prop.referenceKeyProp != null) {
                        keyProps = this._unresolvedField.prop.referenceKeyProp.scalarProps!;
                    } else {
                        keyProps = (
                            this._unresolvedField.prop.targetKeyProp 
                            ?? this._unresolvedField.prop.targetEntity!.idProp
                        ).scalarProps!;
                    }
                    const prevExpressions = keyProps.map(keyProp => 
                        (prev.target as any as metadata.AbstractEntityTable).__expression(keyProp)
                    );
                    return expressionsToAst(dependencyArr).eq(expressionsToAst(prevExpressions)) as Predicate;
                },
                query: (q, target) => {
                    return q.select(
                        baseQuerySelectionMapArgs(
                            this._dependencyArr(target), 
                            target, 
                            (q.prev.depth as Expression<number>).plus(dsl.constant(1))
                        )
                    );
                }
            })
        );
        return this._sqlClient.createQuery(baseModel, (q, base) => {
            if (this._unresolvedField.recursiveDepth != -1) {
                q.where(base.depth.lt(this._unresolvedField.recursiveDepth!));
            }
            if (this._isCollection) {
                const orders = this._orders(base.target);
                if (orders.length !== 0) {
                    q.orderBy(...[base.depth.asc(), ...orders]);
                }
            }
            const keyExpressions: Array<ExpressionLike> = [];
            for (let i = 0; i < this._unresolvedField.dependencies!.length; i++) {
                keyExpressions.push((base as any)[`_${i}`]);
            }
            const selections = [
                ...keyExpressions, 
                ...(this._byTargetKey ? this._keyExprArr(base.target) : [(base.target as EntityTable<AnyModel>).fetch(view)]),
                base.depth
            ] as any as RootQuerySelectArrArgs;
            return q.select(...selections);
        });
    }

    private get _byTargetKey(): boolean {
        return this._recursiveContext?.targetKeyOnly ?? (
            this._unresolvedField.recursiveDepth != null &&
            this._unresolvedField.prop.associationType === "MANY_TO_MANY"
        );
    }

    private async _targetRowMap(
        keys: ReadonlyArray<any>, 
        view: View<AnyModel, any>
    ): Promise<Map<any, metadata.DtoRow>> {
        const map = new Map<any, metadata.DtoRow>();
        if (keys.length === 0) {
            return map;
        }
        const keyMap = new Map<string, string>();
        for (const key of keys) {
            keyMap.set(hashOf(key), key);
        }
        const distinctKeys = Array.from(keyMap.values());
        const query = this._sqlClient.createQuery(this._targetMapper.entity.model, (q, target) => {
            const idExprArr = this._keyExprArr(target);
            q.where(expressionsToAst(idExprArr).in(...distinctKeys));
            const selections = [...idExprArr, target.fetch(view)] as any as AtLeastTwo<SelectionLike>;
            return q.select(...selections);
        });
        const [sql, args] = buildStatement(this._sqlClient, query);
        const dataRows = await this._sqlClient.executor.executeStatement(sql, args, {
            kind: "LOAD_RECURSIVE_TREE_NODE",
            prop: this._unresolvedField.prop as metadata.EntityProp
        });
        const keySpan = this._keySpan;
        const keyReader = DataRowReader.of(dataRows);
        const valueReader = keyReader.offset(keySpan);
        const dtoReader = this._targetDtoRowReader;
        while (keyReader.next()) {
            const key = keyReader.get(0, keySpan);
            const value = dtoReader.read(undefined, valueReader);
            map.set(hashOf(key), value);
        }
        return map;
    }
}

type Binding = {
    readonly dependency: any;
    readonly sourceRows: Array<metadata.DtoRow>;
    targetData: metadata.DtoRow | ReadonlyArray<metadata.DtoRow> | undefined;
    targetIdMap: Map<any, any> | undefined;
};

function expressionsToAst(
    expressions: ReadonlyArray<Expression<any>>
): any {
    if (expressions.length === 1) {
        return expressions[0]!;
    }
    return dsl.tuple(...(expressions as AtLeastTwo<any>));
}

function baseQuerySelectionMapArgs(
    dependencyArr: ReadonlyArray<Expression<any>>,
    target: EntityTableLike,
    depth: Expression<number>
): {
    readonly [key: string]: ExpressionLike | EntityTableLike;
    readonly target: EntityTableLike;
    readonly depth: Expression<number>;
} {
    const args: { 
        [key: string]: ExpressionLike | EntityTableLike;
        readonly target: EntityTableLike;
        readonly depth: Expression<number>;
    } = {
        target,
        depth
    };
    for (let i = 0; i < dependencyArr.length; i++) {
        args[`_${i}`] = dependencyArr[i]!;
    }
    return args;
}

function hashOf(value: any): any {
    if (!Array.isArray(value)) {
        return value;
    }
    let hash = "";
    for (const e of value) {
        if (hash.length !== 0) {
            hash += '\x1F';
        }
        hash += e;
    }
    return hash;
}

class RecursiveContext {

    constructor(
        private readonly _allDataRows: DataRows,
        private readonly _keySpan: number,
        private readonly _valueSpan: number,
        private readonly _targetRowMapData: TargetRowMapData | undefined,
        private readonly _maxDepth: number,
        private readonly _depth: number,
    ) {}

    toKeyRowReader(): DataRowReader {
        const depth = this._depth;
        const dci = this._keySpan + this._valueSpan;
        const rows = this._allDataRows.filter(row => row[dci] === depth);
        return DataRowReader.of(rows);
    }

    toDeeperContext() {
        return new RecursiveContext(
            this._allDataRows,
            this._keySpan,
            this._valueSpan,
            this._targetRowMapData,
            this._maxDepth,
            this._depth + 1
        );
    }

    get isBound(): boolean {
        return this._maxDepth != -1 && this._depth + 1 >= this._maxDepth;
    }

    async targetRowMap(): Promise<Map<string, metadata.DtoRow>> {
        let targetRowMap = this._targetRowMapData?.map;
        if (targetRowMap == null) {
            const getter = this?._targetRowMapData?.getter;
            if (getter == null) {
                throw new err.StateError(`The current recursive context is no target getter`);
            }
            const start = this._keySpan;
            const span = this._valueSpan;
            const keys = this._allDataRows.map(row => span === 1 ? row[start] : row.slice(start, start + span));
            this._targetRowMapData!.map = targetRowMap = await getter(keys);
        }
        return targetRowMap;
    }

    get targetKeyOnly(): boolean {
        return this._targetRowMapData != null;
    }

    static merge(
        contexts: ReadonlyArray<RecursiveContext>
    ): RecursiveContext | undefined {
        if (contexts.length === 0) {
            return undefined;
        }
        const firstContext = contexts[0]!;
        if (contexts.length === 1) {
            return firstContext;
        }
        const rows: Array<DataRow> = [];
        for (const context of contexts) {
            rows.push(...context._allDataRows);
        }
        return new RecursiveContext(
            rows,
            firstContext._keySpan,
            firstContext._valueSpan,
            firstContext._targetRowMapData,
            firstContext._maxDepth,
            firstContext._depth
        );
    }
};

type TargetRowMapData = {
    readonly getter: TargetRowMapGetter;
    map: Map<any, metadata.DtoRow> | undefined;
};
type TargetRowMapGetter = (keys: ReadonlyArray<any>) => Promise<Map<any, metadata.DtoRow>>;