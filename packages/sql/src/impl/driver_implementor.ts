import { Driver } from "@/driver/deriver";
import { AsyncCallback } from "@/transaction/abstract_transaction_manager";

export interface DriverImplementor extends Driver {

    initialize(callback: AsyncCallback): void;
}