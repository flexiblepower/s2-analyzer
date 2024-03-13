export default interface Transition{
    id: string
    from: string
    to: string
    start_timers: string[]
    blocking_timers: string[]
    transition_costs: number
    transition_duration: number
    abnormal_condition_only: boolean
}