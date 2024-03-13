import OperationModeElement from "./operationModeElement"

export default interface OperationMode{
    id: string
    diagnostic_label: string
    elements: OperationModeElement[]
    abnormal_condition_only: boolean
}