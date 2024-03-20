import {CommodityQuantity} from "./commodityQuantity.ts";

export default interface PowerRange{
    start_of_range: number
    end_of_range: number
    commodity_quantity: CommodityQuantity
}
