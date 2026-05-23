import { 
    ast, 
    dsl, 
    err,
    metadata, 
    RootQuery, 
    RootQueryProjection, 
    View, 
    ExprTuple, 
    ExpressionLike, 
    ExpressionOrder, 
    AnyModel, 
    RootQuerySelectArrArgs, 
    Expression, 
    AtLeastTwo, 
    Predicate 
} from "@ts-grm/core";
import { MergedRootQueryImpl } from "./merged_query";
import { AtomRootQueryImpl } from "./atom_root_query_impl";
import { Composite } from "@/sql/fragment";
import { SqlBuilder } from "@/sql/sql_builder";
import { DataRowReader } from "./data_row_reader";
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
    await resolveAssocaitions(sqlClient, mapper, dtoRows);
    return dtos;
}

async function resolveAssocaitions(
    sqlClient: SqlClientImplementor,
    mapper: metadata.DtoMapper,
    sourceRows: ReadonlyArray<metadata.DtoRow>
): Promise<void> {
    if (sourceRows.length === 0) {
        return;
    }
    for (const unresolveField of mapper.unresolvedFields) {
        if (unresolveField.subMapper != null) {
            await new AssociationResolver(sqlClient, mapper, unresolveField, sourceRows).resolve();
        }
    }
}

class AssociationResolver {

    private readonly _targetMapper: metadata.DtoMapper;

    private readonly _sourceDtoRowReader: metadata.DtoRowReader;

    private readonly _targetDtoRowReader: metadata.DtoRowReader;

    private readonly _isCollection: boolean;

    private readonly _batchSize: number;

    private readonly _bindingMap = new Map<any, Binding>();

    constructor(
        private _sqlClient: SqlClientImplementor,
        private readonly _sourceMapper: metadata.DtoMapper,
        private readonly _unresolvedField: metadata.DtoMapperField,
        private readonly _sourceRows: ReadonlyArray<metadata.DtoRow>
    ) {
        this._targetMapper = _unresolvedField.subMapper!;
        this._sourceDtoRowReader = this._sourceMapper.dtoRowReader;
        this._targetDtoRowReader = this._targetMapper.dtoRowReader;
        const associationType = this._unresolvedField.prop.associationType;
        this._isCollection = associationType === "ONE_TO_MANY" || associationType === "MANY_TO_MANY";
        if (this._isCollection) {
            this._batchSize = _sqlClient.options.defaultListBatchSize;
        } else {
            this._batchSize = _sqlClient.options.defaultBatchSize;
        }
    }
    
    private _dependencyAst(
        targetTable: any
    ): ast.AbstractExpr<any> | ExprTuple<ExpressionLike[]> {
        const entityTable = targetTable as any as metadata.AbstractEntityTable;
        if (this._unresolvedField.prop.referenceKeyProp != null) {
            const keyProps = this._unresolvedField.prop.targetKeyProp!.scalarProps!;
            if (keyProps.length === 1) {
                return entityTable.__expression(keyProps[0]!) as ast.AbstractExpr<any>;
            }
            const keyExpressions = keyProps.map(p => entityTable.__expression(p)) as any;
            return dsl.tuple(...keyExpressions);
        }
        return targetTable.__inverseAssociatedKey(
            this._sourceMapper.entity.model, 
            this._unresolvedField.prop.name
        );
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

    private _keyExpressions(targetTable: any): ReadonlyArray<Expression<any>> {
        if (this._unresolvedField.prop.referenceKeyProp != null) {
            return this
                ._unresolvedField
                .prop
                .targetKeyProp!
                .scalarProps!
                .map(keyProp => 
                    (targetTable as any as metadata.AbstractEntityTable)
                    .__expression(keyProp)
                );
        }
        return (targetTable as metadata.AbstractEntityTable)
            .__inverseAssociatedKeyArr(
                this._sourceMapper.entity.model, 
                this._unresolvedField.prop.name
            );
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
                targetData: undefined
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
        if (dependencies.length <= this._batchSize) {
            await this._resolveBatch(dependencies);
        } else {
            let start = 0;
            while (start < this._batchSize) {
                const end = Math.min(dependencies.length, start + this._batchSize);
                const batchDependencies = dependencies.slice(start, end);
                await this._resolveBatch(batchDependencies);
                start += this._batchSize;
            }
        }
        const unresolvedFieldIndex = this._unresolvedField.index;
        const sourceDtoRowReader = this._sourceDtoRowReader;
        const targetRows: Array<metadata.DtoRow> = [];
        for (const binding of this._bindingMap.values()) {
            const targetData = binding.targetData;
            let value: any;
            if (this._isCollection) {
                if (targetData == null) {
                    value = [];
                } else if (Array.isArray(targetData)) {
                    value = targetData.map(row => row.dto);
                } else {
                    value = [(targetData as metadata.DtoRow).dto];
                }
            } else {
                if (targetData == null) {
                    continue;
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
                }
            }
            for (const sourceRow of binding.sourceRows) {
                sourceDtoRowReader.resolve(
                    unresolvedFieldIndex, 
                    sourceRow, 
                    value
                );
            }
            if (Array.isArray(targetData)) {
                const arr = targetData as ReadonlyArray<metadata.DtoRow>;
                targetRows.push(...arr);
            } else if (targetData != null) {
                const row = targetData as metadata.DtoRow;
                targetRows.push(row);
            }
        }
        await resolveAssocaitions(this._sqlClient, this._targetMapper, targetRows);
    }

    private async _resolveBatch(
        dependencies: ReadonlyArray<any>
    ) {
        const view = new View<AnyModel, any>(this._unresolvedField.subMapper!);
        const query = this._unresolvedField.recursiveDepth != null
            ? this._createRecursiveQuery(dependencies, view)
            : this._createQuery(dependencies, view);
        const [sql, args] = buildStatement(this._sqlClient, query);
        const dataRows = await this._sqlClient.executor.executeStatement(sql, args, {
            kind: "LOAD_ASSOCIATION",
            prop: this._unresolvedField.prop as metadata.EntityProp
        });
        const keyRowReader = DataRowReader.of(dataRows);
        const keySpan = this._unresolvedField.dependencies!.length;
        const valueRowReader = keyRowReader.offset(keySpan);
        const sourceDtoRowReader = this._sourceDtoRowReader;
        const targetDtoRowReader = this._targetDtoRowReader;
        while (keyRowReader.next()) {
            const key = keyRowReader.get(0, keySpan);
            const binding = this._bindingMap.get(sourceDtoRowReader.dependencyHash(this._unresolvedField.index, key))!
            const row = targetDtoRowReader.read(binding.sourceRows, valueRowReader);
            if (binding.targetData == null) {
                binding.targetData = row;
            } else if (!Array.isArray(binding.targetData)) {
                binding.targetData = [binding.targetData as metadata.DtoRow, row];
            } else {
                binding.targetData.push(row);
            }
        }
    }

    private _createQuery(
        dependencies: ReadonlyArray<any>, 
        view: View<AnyModel, any>
    ): RootQuery<any> {
        const model = this._unresolvedField.subMapper!.entity.model;
        return this._sqlClient.createQuery(model, (q, target) => {
            const dependencyAst = this._dependencyAst(target) as any;
            q.where(dependencyAst.in(...dependencies));
            const keyExpressions = this._keyExpressions(target);
            if (this._isCollection) {
                q.orderBy(...this._orders(target));
            }
            const selections = [...keyExpressions, target.fetch(view)] as any as RootQuerySelectArrArgs;
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
                const dependencyAst = this._dependencyAst(target) as any;
                q.where(dependencyAst.in(...dependencies));
                return q.select({
                    target,
                    depth: dsl.constant(0)
                });
            }).unionAllRecursively(model, {
                join: (prev, target) => { 
                    const dependencyAst = this._dependencyAst(target);
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
                    return dependencyAst.eq(expressionsToAst(prevExpressions)) as Predicate;
                },
                query: (q, target) => {
                    return q.select({
                        target,
                        depth: q.prev.depth.plus(dsl.constant(1))
                    });
                }
            })
        );
        return this._sqlClient.createQuery(baseModel, (q, base) => {
            const keyExpressions = this._keyExpressions(base.target);
            const selections = [
                ...keyExpressions, 
                base.target.fetch(view),
                base.depth
            ] as any as RootQuerySelectArrArgs;
            return q.select(...selections);
        });
    }
}

type Binding = {
    readonly dependency: any;
    readonly sourceRows: Array<metadata.DtoRow>;
    targetData: metadata.DtoRow | ReadonlyArray<metadata.DtoRow> | undefined;
};

function expressionsToAst(
    expressions: ReadonlyArray<Expression<any>>
): any {
    if (expressions.length === 1) {
        return expressions[0]!;
    }
    return dsl.tuple(...(expressions as AtLeastTwo<any>));
}