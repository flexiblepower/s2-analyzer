import Timer from "../timer"
import Transition from "../transition"
import OperationMode from "./operationMode"

export default interface ActuatorDescription{
    id: string
    diagostic_label: string
    supported_commodities: Commodity[]
    operation_modes: OperationMode[]
    transitions: Transition[]
    timers: Timer[]
}