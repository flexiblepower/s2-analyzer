export default interface Transition {
    id: string;
    from: string;
    to: string;
    start_timers: string[];
    blocking_timers: string[];
    transition_costs: number | null;
    transition_duration: number | null;
    abnormal_condition_only: boolean;
}
