import {CommodityQuantity} from "./commodityQuantity.ts";

export default interface PowerForecastValue{
    value_upper_limit: number | null
    value_upper_95PPR: number | null
    value_upper_68PPR: number | null
    value_expected: number
    value_lower_68PPR: number | null
    value_lower_95PPR: number | null
    value_lower_limit: number | null
    commodity_quantity: CommodityQuantity
}