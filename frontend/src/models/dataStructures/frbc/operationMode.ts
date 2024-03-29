import OperationModeElement from "./operationModeElement"

export default interface OperationMode{
    id: string
    diagnostic_label: string | null
    elements: OperationModeElement[]
    abnormal_condition_only: boolean
}