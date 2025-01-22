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
        const {
            Handshake,
            HandshakeResponse,
            InstructionStatusUpdate,
            PowerForecast,
            PowerMeasurement,
            ResourceManagerDetails,
            RevokeObject,
            SelectControlType,
            SessionRequest,
            ConnectionLost,
            ActuatorStatus,
            FillLevelTargetProfile,
            Instruction,
            LeakageBehavior,
            StorageStatus,
            SystemDescription,
            TimerStatus,
            UsageForecast,
        } = filters;

        return (
            (Handshake && m.message_type === "Handshake") ||
            (HandshakeResponse && m.message_type === "HandshakeResponse") ||
            (InstructionStatusUpdate && m.message_type === "InstructionStatusUpdate") ||
            (PowerForecast && m.message_type === "PowerForecast") ||
            (PowerMeasurement && m.message_type === "PowerMeasurement") ||
            (ResourceManagerDetails && m.message_type === "ResourceManagerDetails") ||
            (RevokeObject && m.message_type === "RevokeObject") ||
            (SelectControlType && m.message_type === "SelectControlType") ||
            (SessionRequest && m.message_type === "SessionRequest") ||
            (ConnectionLost && m.message_type === "Connection Lost") ||
            (ActuatorStatus && m.message_type === "FRBC.ActuatorStatus") ||
            (FillLevelTargetProfile && m.message_type === "FRBC.FillLevelTargetProfile") ||
            (Instruction && m.message_type === "FRBC.Instruction") ||
            (LeakageBehavior && m.message_type === "FRBC.LeakageBehavior") ||
            (StorageStatus && m.message_type === "FRBC.StorageStatus") ||
            (SystemDescription && m.message_type === "FRBC.SystemDescription") ||
            (TimerStatus && m.message_type === "FRBC.TimerStatus") ||
            (UsageForecast && m.message_type === "FRBC.UsageForecast")
        );
    }

    return filters;
}

export default useFilters;
