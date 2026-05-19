import { ast, dsl, metadata, RootQuery, RootQueryProjection, View, ExprTuple, ExpressionLike, ExpressionOrder, AnyModel, RootQuerySelectArrArgs } from "@ts-grm/core";
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
        : (query as MergedRootQueryImpl<TProjection>).sqlClient;
    const [sql, args] = buildStatement(sqlClient, query);
    const transactionManager = sqlClient.driver.transactionManager;
    return transactionManager.executeReadonly(async () => {
        const dataRows = await sqlClient.executor.executeStatement(sql, args);
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
        const associationType = unresolveField.prop.associationType;
        switch (associationType) {
            case "ONE_TO_ONE":
            case "MANY_TO_ONE":
                await new ReferenceResolver(sqlClient, mapper, unresolveField, sourceRows).resolve();
        }
    }
}

abstract class AssociationResolver {

    protected readonly targetMapper: metadata.DtoMapper;

    protected readonly sourceDtoRowReader: metadata.DtoRowReader;

    protected readonly targetDtoRowReader: metadata.DtoRowReader;

    constructor(
        protected sqlClient: SqlClientImplementor,
        protected readonly sourceMapper: metadata.DtoMapper,
        protected readonly unresolvedField: metadata.DtoMapperField,
        protected readonly sourceRows: ReadonlyArray<metadata.DtoRow>
    ) {
        this.targetMapper = unresolvedField.subMapper!;
        this.sourceDtoRowReader = this.sourceMapper.dtoRowReader;
        this.targetDtoRowReader = this.targetMapper.dtoRowReader;
    }
    
    protected dependencyAst(
        table: any
    ): ast.AbstractExpr<any> | ExprTuple<ExpressionLike[]> {
        const entityTable = table as any as metadata.AbstractEntityTable;
        const keyProps = this.unresolvedField.prop.targetKeyProp!.scalarProps!;
        if (keyProps.length === 1) {
            return entityTable.__expression(keyProps[0]!) as ast.AbstractExpr<any>;
        }
        const keyExpressions = keyProps.map(p => entityTable.__expression(p)) as any;
        return dsl.tuple(...keyExpressions);
    }

    protected orders(
        table: any
    ): ReadonlyArray<ExpressionOrder> {
        const entityTable = table as any as metadata.AbstractEntityTable;
        const arr: Array<ExpressionOrder> = [];
        const orders = this.unresolvedField.orders;
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
}

class ReferenceResolver extends AssociationResolver {

    private readonly _batchSize: number;

    private readonly _bindingMap = new Map<any, ReferenceBinding>();

    constructor(
        sqlClient: SqlClientImplementor,
        mapper: metadata.DtoMapper, 
        unresolvedField: metadata.DtoMapperField,
        sourceRows: ReadonlyArray<metadata.DtoRow>
    ) {
        super(sqlClient, mapper, unresolvedField, sourceRows);
        this._batchSize = sqlClient.options.defaultBatchSize;
    }

    async resolve(): Promise<void> {
        const unresolvedFieldIndex = this.unresolvedField.index;
        const dtoRowReader = this.sourceDtoRowReader;
        const bindingMap = this._bindingMap;
        for (const sourceRow of this.sourceRows) {
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
                sourceRows: [sourceRow],
                targetRow: undefined
            };
            bindingMap.set(hash, binding);
        }
        await this._resolve();
    }

    private async _resolve(): Promise<void> {
        const dependencies = Array.from(this._bindingMap.keys());
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
        const unresolvedFieldIndex = this.unresolvedField.index;
        const sourceDtoRowReader = this.sourceDtoRowReader;
        const targetRows: Array<metadata.DtoRow> = [];
        for (const binding of this._bindingMap.values()) {
            for (const sourceRow of binding.sourceRows) {
                sourceDtoRowReader.resolve(
                    unresolvedFieldIndex, 
                    sourceRow, 
                    binding.targetRow?.dto
                );
            }
            targetRows.push(binding.targetRow!);
        }
        await resolveAssocaitions(this.sqlClient, this.targetMapper, targetRows);
    }

    private async _resolveBatch(
        dependencies: ReadonlyArray<any>
    ) {
        const model = this.unresolvedField.subMapper!.entity.model;
        const view = new View<AnyModel, any>(this.unresolvedField.subMapper!);
        const query = this.sqlClient.createQuery(model, (q, target) => {
            const dependencyAst = this.dependencyAst(target) as any;
            q.where(dependencyAst.in(...dependencies));
            const keyExpressions = 
                this
                .unresolvedField
                .prop
                .targetKeyProp!
                .scalarProps!
                .map(keyProp => 
                    (target as any as metadata.AbstractEntityTable)
                    .__expression(keyProp)
                );
            const selections = [...keyExpressions, target.fetch(view)] as any as RootQuerySelectArrArgs;
            return q.select(...selections);
        });
        const [sql, args] = buildStatement(this.sqlClient, query);
        const dataRows = await this.sqlClient.executor.executeStatement(sql, args);
        const keyRowReader = DataRowReader.of(dataRows);
        const keySpan = this.unresolvedField.dependencies!.length;
        const valueRowReader = keyRowReader.offset(keySpan);
        const sourceDtoRowReader = this.sourceDtoRowReader;
        const targetDtoRowReader = this.targetDtoRowReader;
        while (keyRowReader.next()) {
            const key = keyRowReader.get(0, keySpan);
            const binding = this._bindingMap.get(sourceDtoRowReader.dependencyHash(this.unresolvedField.index, key))!
            const row = targetDtoRowReader.read(binding.sourceRows, valueRowReader);
            binding.targetRow = row;
        }
    }
}

type ReferenceBinding = {
    sourceRows: Array<metadata.DtoRow>;
    targetRow: metadata.DtoRow | undefined;
};