import MessageHeader from "../../../models/messages/messageHeader.ts";
import PowerForecastGraph from "./PowerForecastGraph.tsx";
import PowerForecastElement from "../../../models/dataStructures/powerForecastElement.ts";
import UsageForecastGraph from "./UsageForecastGraph.tsx";
import UsageForecastElement from "../../../models/dataStructures/frbc/usageForecastElement.ts";

interface props<T extends MessageHeader> {
    message: T;
}

/**
 * The component for customizing the rendering of specific type of messages
 * Note: Specifically for "Date" variables, always cast them as such before utilizing them
 * @returns the special rendering of a message
 */
function SpecialMessage<T extends MessageHeader>(props: props<T>) {

    const handleSpecialMessage = () => {
        if (props.message.message_type == "PowerForecast" && "elements" in props.message && "start_time" in props.message) {
            return <PowerForecastGraph data={props.message.elements as PowerForecastElement[]} start={new Date(props.message.start_time as string)}/>
        } else if (props.message.message_type == "FRBC.UsageForecast" && "elements" in props.message && "start_time" in props.message) {
            return <UsageForecastGraph data={props.message.elements as UsageForecastElement[]} start={new Date(props.message.start_time as string)}/>
        }
    }

    return (
            <div>
                {handleSpecialMessage()}
            </div>
    );
}

export default SpecialMessage;