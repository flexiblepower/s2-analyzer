import NumberRange from "../numberRange"

export default interface StorageDescription{
    diagnostic_label: string | null
    fill_level_label: string | null
    provides_leakage_behaviour: boolean
    provides_fill_level_target_profile: boolean
    provides_usage_forecast: boolean
    fill_level_range: NumberRange
}