import PowerForecastValue from "./powerForecastValue.ts";

export default interface PowerForecastElement {
  duration: number;
  power_values: PowerForecastValue[];
}
