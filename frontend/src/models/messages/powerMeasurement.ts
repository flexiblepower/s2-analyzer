import PowerValue from "../dataStructures/powerValue";
import MessageHeader from "./messageHeader";

export default interface PowerMeasurement extends MessageHeader {
    measurement_timestamp: Date;
    values: PowerValue[];
}
