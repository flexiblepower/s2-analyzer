export default interface PowerForecastValue{
    value_upper_limit: number
    value_upper_95PRP: number
    value_upper_68PRP: number
    value_expected: number
    value_lower_68PRP: number
    value_lower_95PRP: number
    value_lower_limit: number
    commodity_quantity: CommodityQuantity
}
