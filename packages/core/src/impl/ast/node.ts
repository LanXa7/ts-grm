import { Visitor } from "./visitor";

export interface Node {

    accept(visitor: Visitor): void;
}