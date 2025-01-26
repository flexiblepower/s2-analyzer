import {useEffect, useState} from "react";
import MessageHeader from "../models/messages/messageHeader";
import {Filters} from "../models/dataStructures/filters";

/**
 * Custom hook that filters the messages based on the selected filters
 * @param data - The array of MessageHeaders objects to be filtered
 * @param selectedFilters - The Filters object containing the selected filters ny the user
 * @returns The filtered array of MessageHeader objects
 */
function useFilters(data: MessageHeader[], selectedFilters: Filters) {
    const [filters, setFilters] = useState<MessageHeader[]>([]);

    useEffect(() => {
        const filtered = data.filter((m) => {
            const sender = m.sender?.split(" ")[0];

            const isSenderMatched = matchSender(sender, selectedFilters);
            const isMessageMatched = matchMessage(m, selectedFilters);
            const isTypeMatched = matchMessageType(m, selectedFilters);

            return isSenderMatched && isMessageMatched && isTypeMatched;
        });

        setFilters(filtered);
    }, [data, selectedFilters]);

    // Determine which filter for the message sender is applied
    function matchSender(sender: string | undefined, filters: Filters): boolean {
        const {CEM, RM} = filters;
        return (CEM && sender === "CEM") || (RM && sender === "RM");
    }

    // Determine whether logs or warnings or both are selected
    function matchMessage(m: MessageHeader, filters: Filters): boolean {
        const {Logs, Warnings} = filters;
        return ((Logs && m.message_id !== null) || (Warnings && m.message_id === null));
    }

    // Determine which filter for the message type is applied
    function matchMessageType(m: MessageHeader, filters: Filters): boolean {
        const messageTypes: { [key: string]: boolean } = {
            "Handshake": filters.Handshake,
            "HandshakeResponse": filters.HandshakeResponse,
            "InstructionStatusUpdate": filters.InstructionStatusUpdate,
            "PowerForecast": filters.PowerForecast,
            "PowerMeasurement": filters.PowerMeasurement,
            "ResourceManagerDetails": filters.ResourceManagerDetails,
            "RevokeObject": filters.RevokeObject,
            "SelectControlType": filters.SelectControlType,
            "SessionRequest": filters.SessionRequest,
            "Connection Lost": filters.ConnectionLost,
            "FRBC.ActuatorStatus": filters.ActuatorStatus,
            "FRBC.FillLevelTargetProfile": filters.FillLevelTargetProfile,
            "FRBC.Instruction": filters.Instruction,
            "FRBC.LeakageBehavior": filters.LeakageBehavior,
            "FRBC.StorageStatus": filters.StorageStatus,
            "FRBC.SystemDescription": filters.SystemDescription,
            "FRBC.TimerStatus": filters.TimerStatus,
            "FRBC.UsageForecast": filters.UsageForecast,
        };

        return messageTypes[m.message_type] || false;
    }

    return filters;
}

export default useFilters;
