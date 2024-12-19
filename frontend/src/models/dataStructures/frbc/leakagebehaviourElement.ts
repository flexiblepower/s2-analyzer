import NumberRange from "../numberRange";

export default interface LeakageBehaviourElement {
    fill_level_range: NumberRange;
    leakage_rate: number;
}
