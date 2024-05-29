import NumberRange from "../numberRange";
import PowerRange from "../powerRange";

export default interface OperationModeElement {
  fill_level_range: NumberRange;
  fill_rate: NumberRange;
  power_ranges: PowerRange[];
  running_costs: NumberRange | null;
}
