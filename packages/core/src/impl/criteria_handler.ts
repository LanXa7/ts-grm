import { Criteria, dsl, Predicate } from "@/dsl";
import { Entity } from "./entity";
import { EntityProp } from "./entity_prop";
import { AnyModel } from "@/schema/model";
import { AbstractEntityTable } from "./entity_table";
import { __CriteriaInstanceOfBinding } from "@/index_internal";
import { suppressUnused } from "@/utils";

export interface CriteriaHandler<TModel extends AnyModel> {

    toPredicate(
        table: AbstractEntityTable,
        criteria: Criteria<TModel>
    ): Predicate | undefined;
}

export function criteriaHandlerOf<
    TModel extends AnyModel
>(
    model: TModel
): CriteriaHandler<TModel> {
    const entity = Entity.of(model);
    return criteriaHandler(entity, false);
}

const criteriaHandlerMap = new Map<string, CriteriaHandler<any>>();

function criteriaHandler(
    source: Entity | EntityProp,
    or: boolean
): CriteriaHandler<any> {
    const key = source instanceof Entity 
        ? `${source.name}:${or}` 
        : `${source.toString()}:${or}`;
    let handler = criteriaHandlerMap.get(key);
    if (handler == null) {
        handler = new CriteriaHandlerImpl(source, or);
        criteriaHandlerMap.set(key, handler);
    }
    return handler;
}

type PredicateCombiner = (
    ...predicates: ReadonlyArray<Predicate | undefined>
) => Predicate | undefined;

class CriteriaHandlerImpl implements CriteriaHandler<AnyModel> { 

    private readonly _predicateCombiner: PredicateCombiner;

    constructor(
        private readonly _source: Entity | EntityProp,
        or: boolean
    ) {
        this._predicateCombiner = or ? dsl.or : dsl.and;
    }

    toPredicate(
        table: AbstractEntityTable,
        criteria: Criteria<AnyModel>
    ): Predicate | undefined {
        let predicate: Predicate | undefined = undefined;
        for (const key in criteria) {
            const data = criteria[key] as any;
            switch (key) {
                case "$and":
                    predicate = this._predicateCombiner(
                        predicate, 
                        this._as(false)._subPredicate(table, data)
                    );
                    break;
                case "$or":
                    predicate = this._predicateCombiner(
                        predicate, 
                        this._as(true)._subPredicate(table, data)
                    );    
                    break;
                case "$not":
                    predicate = this._predicateCombiner(
                        predicate, 
                        dsl.not(this._as(false)._subPredicate(table, data))
                    );
                    break;
                case "$instanceOf":
                    const binding = data as __CriteriaInstanceOfBinding<any, any>;
                    predicate = this._predicateCombiner(
                        predicate, 
                        criteriaHandler(Entity.of(binding.__derivedModel), false).toPredicate(
                            table.as(binding.__derivedModel), 
                            data
                        )
                    );
                    break;
            }
        }
        return predicate;
    }

    private _subPredicate(
        table: AbstractEntityTable,
        data: any
    ): Predicate | undefined {
        if (Array.isArray(data)) {
            let predicate: Predicate | undefined = undefined;
            for (const criteria of data) {
                predicate = this._predicateCombiner(predicate, this.toPredicate(table, criteria));
            }
            return predicate;
        }
        return this.toPredicate(table, data as Criteria<AnyModel>);
    }

    private _as(or: boolean): CriteriaHandlerImpl {
        return criteriaHandler(this._source, or) as CriteriaHandlerImpl;
    }
}

class MemberHandler {

    constructor(
        protected readonly predicateCombinder: PredicateCombiner
    ) {}
}

class EmbeddedMemberHandler extends MemberHandler {

    constructor(
        predicateCombinder: PredicateCombiner

    ) {
        super(predicateCombinder);
    }
}

class ScalarMemberHandler extends MemberHandler {

    constructor(
        predicateCombinder: PredicateCombiner,
        protected readonly name: string
    ) {
        super(predicateCombinder);
    }

    toPredicate(
        prevPredicate: Predicate | undefined,
        ast: any,
        value: any
    ): Predicate | undefined {
        if (typeof value === "object") {
            const arr = prevPredicate != null 
                ? [prevPredicate]
                : [];
            this.addPridicates(arr, ast, value);
            return this.predicateCombinder(...arr);
        }
        return ast[this.name].eq(value);
    }

    protected addPridicates(
        predicates: Array<Predicate>,
        ast: any,
        value: any
    ) {
        if (hasOwn(value, "$eq")) {
            predicates.push(ast[this.name].eq(value.$eq));
        }
        if (hasOwn(value, "$ne")) {
            predicates.push(ast[this.name].ne(value.$ne));
        }
        if (hasOwn(value, "$in")) {
            predicates.push(ast[this.name].in(value.$in));
        }
        if (hasOwn(value, "$nin")) {
            predicates.push(ast[this.name].nin(value.$nin));
        }

        if (hasOwn(value, "$eqIf")) {
            predicates.push(ast[this.name].eqIf(value.$eqIf));
        }
        if (hasOwn(value, "$neIf")) {
            predicates.push(ast[this.name].neIf(value.$neIf));
        }
        if (hasOwn(value, "$inIf")) {
            predicates.push(ast[this.name].inIf(value.$inIf));
        }
        if (hasOwn(value, "$ninIf")) {
            predicates.push(ast[this.name].ninIf(value.$ninIf));
        }
    }
}

class CmpMemberHandler extends ScalarMemberHandler {

    constructor(
        predicateCombinder: PredicateCombiner,
        name: string
    ) {
        super(predicateCombinder, name);
    }

    protected override addPridicates(
        predicates: Array<Predicate>,
        ast: any,
        value: any
    ) {
        super.addPridicates(predicates, ast, value);

        if (hasOwn(value, "$lt")) {
            predicates.push(ast[this.name].lt(value.$lt));
        }
        if (hasOwn(value, "$lte")) {
            predicates.push(ast[this.name].lte(value.$lte));
        }
        if (hasOwn(value, "$gt")) {
            predicates.push(ast[this.name].gt(value.$gt));
        }
        if (hasOwn(value, "$gte")) {
            predicates.push(ast[this.name].gte(value.$gte));
        }
        if (hasOwn(value, "$between")) {
            predicates.push(ast[this.name].between(value.$between[0], value.$between[1]));
        }

        if (hasOwn(value, "$ltIf")) {
            predicates.push(ast[this.name].ltIf(value.$ltIf));
        }
        if (hasOwn(value, "$lteIf")) {
            predicates.push(ast[this.name].lteIf(value.$lteIf));
        }
        if (hasOwn(value, "$gtIf")) {
            predicates.push(ast[this.name].gtIf(value.$gtIf));
        }
        if (hasOwn(value, "$gteIf")) {
            predicates.push(ast[this.name].gteIf(value.$gteIf));
        }
        if (hasOwn(value, "$betweenIf")) {
            predicates.push(ast[this.name].betweenIf(value.$betweenIf[0], value.$betweenIf[1]));
        }
    }
}

class StrMemberHandelr extends CmpMemberHandler {

    constructor(
        predicateCombinder: PredicateCombiner,
        name: string
    ) {
        super(predicateCombinder, name);
    }

    protected override addPridicates(
        predicates: Array<Predicate>,
        ast: any,
        value: any
    ) {
        super.addPridicates(predicates, ast, value);
        
        if (hasOwn(value, "$startsWith")) {
            predicates.push(ast[this.name].like(value.$startsWith, "STARTS_WITH"));
        }
        if (hasOwn(value, "$endsWith")) {
            predicates.push(ast[this.name].like(value.$endsWith, "ENDS_WITH"));
        }
        if (hasOwn(value, "$contains")) {
            predicates.push(ast[this.name].like(value.$contains));
        }
        if (hasOwn(value, "$regex")) {
            predicates.push(ast[this.name].regexp(value.$regex));
        }

        if (hasOwn(value, "$istartsWith")) {
            predicates.push(ast[this.name].ilike(value.$istartsWith, "STARTS_WITH"));
        }
        if (hasOwn(value, "$iendsWith")) {
            predicates.push(ast[this.name].ilike(value.$iendsWith, "ENDS_WITH"));
        }
        if (hasOwn(value, "$icontains")) {
            predicates.push(ast[this.name].ilike(value.$icontains));
        }
        if (hasOwn(value, "$iregex")) {
            predicates.push(ast[this.name].iregexp(value.$iregex));
        }

        if (hasOwn(value, "$startsWithIf")) {
            predicates.push(ast[this.name].likeIf(value.$startsWithIf, "STARTS_WITH"));
        }
        if (hasOwn(value, "$endsWithIf")) {
            predicates.push(ast[this.name].likeIf(value.$endsWithIf, "ENDS_WITH"));
        }
        if (hasOwn(value, "$containsIf")) {
            predicates.push(ast[this.name].likeIf(value.$containsIf));
        }
        if (hasOwn(value, "$regexIf")) {
            predicates.push(ast[this.name].regexpIf(value.$regexIf));
        }

        if (hasOwn(value, "$istartsWithIf")) {
            predicates.push(ast[this.name].ilikeIf(value.$istartsWithIf, "STARTS_WITH"));
        }
        if (hasOwn(value, "$iendsWithIf")) {
            predicates.push(ast[this.name].ilikeIf(value.$iendsWithIf, "ENDS_WITH"));
        }
        if (hasOwn(value, "$icontainsIf")) {
            predicates.push(ast[this.name].ilikeIf(value.$icontainsIf));
        }
        if (hasOwn(value, "$iregexIf")) {
            predicates.push(ast[this.name].iregexpIf(value.$iregexIf));
        }
    }
}

suppressUnused(EmbeddedMemberHandler);
suppressUnused(StrMemberHandelr);

function hasOwn(o: object, k: string): boolean {
    return Object.prototype.hasOwnProperty.call(o, k);
}