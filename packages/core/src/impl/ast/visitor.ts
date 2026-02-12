import { CoalesceExprContract } from "./coalesce_expr";
import type { DtDiffExpr, DtMinusExpr, DtPlusExpr } from "./dt_expr";
import type { BinaryNumExpr, UnaryMinusExpr } from "./num_expr";
import type { CmpPred, CompoundPred, InCollectionPred, LikePred, NullityPred } from "./pred";
import type { PropExprContract } from "./prop_expr";
import type { ConcatExpr, LeftExpr, LengthExpr, LowerExpr, PadExpr, PositionExpr, ReplaceExpr, ReverseExpr, RightExpr, SubstringExpr, TrimExpr, UpperExpr } from "./string_expr";

export interface Visitor {

    visitCmpPred(pred: CmpPred): void;

    visitLikePred(pred: LikePred): void;

    visitNullityPred(pred: NullityPred): void;

    visitInCollectionPred(pred: InCollectionPred<any>): void;

    visitCompoundPred(pred: CompoundPred): void;

    visitTablePropExpr(expr: PropExprContract): void;

    visitCoalesceExpr(expr: CoalesceExprContract): void;

    visitLowerExpr(expr: LowerExpr): void;

    visitUpperExpr(expr: UpperExpr): void;

    visitReverseExpr(expr: ReverseExpr): void;

    visitTrimExpr(expr: TrimExpr): void;

    visitLengthExpr(expr: LengthExpr): void;

    visitReplaceExpr(expr: ReplaceExpr): void;

    visitPadExpr(expr: PadExpr): void;

    visitLeftExpr(expr: LeftExpr): void;

    visitRightExpr(expr: RightExpr): void;

    visitPositionExpr(expr: PositionExpr): void;

    visitSubstringExpr(expr: SubstringExpr): void;

    visitConcatExpr(expr: ConcatExpr): void;

    visitUnaryMinusExpr(expr: UnaryMinusExpr<any>): void;

    visitBinaryNumExpr(expr: BinaryNumExpr<any>): void;

    visitDtPlusExpr(expr: DtPlusExpr): void;

    visitDtMinusExpr(expr: DtMinusExpr): void;

    visitDtDiffExpr(expr: DtDiffExpr): void;

    visitLiteral(value: any): void;
}