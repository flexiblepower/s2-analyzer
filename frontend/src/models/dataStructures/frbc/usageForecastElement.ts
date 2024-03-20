export default interface UsageForecastElement{
    duration: number
    usage_rate_upper_limit: number | null
    usage_rate_upper_95PPR: number | null
    usage_rate_upper_68PPR: number | null
    usage_rate_expected: number
    usage_rate_lower_68PPR: number | null
    usage_rate_lower_95PPR: number | null
    usage_rate_lower_limit: number | null
}