import { CommodityQuantity } from "./commodityQuantity.ts";

export default interface PowerValue {
  commodity_quantity: CommodityQuantity;
  value: number;
}
