import Timer from "../timer"
import Transition from "../transition"
import OperationMode from "./operationMode"
import {Commodity} from "../commodity.ts"

export default interface ActuatorDescription{
    id: string
    diagnostic_label: string | null
    supported_commodities: Commodity[]
    operation_modes: OperationMode[]
    transitions: Transition[]
    timers: Timer[]
}