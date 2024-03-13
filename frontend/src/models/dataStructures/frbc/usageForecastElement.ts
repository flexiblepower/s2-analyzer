export default interface UsageForecastElement{
    duration: number
    usage_rate_upper_limit: number
    usage_rate_upper_85PRP: number
    usage_rate_upper_68PRP: number
    usage_rate_expected: number
    usage_rate_lower_68PRP: number
    usage_rate_lower_95PRP: number
    usage_rate_lower_limit: number
}