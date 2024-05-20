import { useEffect, useState } from "react";
import MessageHeader from "../models/messages/messageHeader";
import { Filters } from "../models/dataStructures/filters";

/**
 * This is a custom hook that filters the messages based on the selected filters.
 * @param data the current MessageHeaders data.
 * @param selectedFilters selected filters by user.
 * @returns the filtered messages.
 */
function useFilters(data: MessageHeader[], selectedFilters: Filters) {
  const [filters, setFilters] = useState<MessageHeader[]>([]);

  useEffect(() => {
    const filtered = data.filter((m) => {
      const sender = m.sender?.split(" ")[0];
      const {
        CEM,
        RM,
        Logs,
        Warnings,
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
      } = selectedFilters;

      // A constant to determine which filter for the message sender is applied.
      const isSenderMatched =
        (CEM && sender === "CEM") || (RM && sender === "RM");

      // A constant to determine whether logs or warnings or both are selected.
      const isMessageMatched =
        (Logs && m.message_id !== null) || (Warnings && m.message_id === null);

      // A constant to determine which filter for the message type is applied.
      const isTypeMatched =
        (Handshake && m.message_type === "Handshake") ||
        (HandshakeResponse && m.message_type === "HandshakeResponse") ||
        (InstructionStatusUpdate &&
          m.message_type === "InstructionStatusUpdate") ||
        (PowerForecast && m.message_type === "PowerForecast") ||
        (PowerMeasurement && m.message_type === "PowerMeasurement") ||
        (ResourceManagerDetails &&
          m.message_type === "ResourceManagerDetails") ||
        (RevokeObject && m.message_type === "RevokeObject") ||
        (SelectControlType && m.message_type === "SelectControlType") ||
        (SessionRequest && m.message_type === "SessionRequest") ||
        (ConnectionLost && m.message_type === "Connection Lost") ||
        (ActuatorStatus && m.message_type === "FRBC.ActuatorStatus") ||
        (FillLevelTargetProfile &&
          m.message_type === "FRBC.FillLevelTargetProfile") ||
        (Instruction && m.message_type === "FRBC.Instruction") ||
        (LeakageBehavior && m.message_type === "FRBC.LeakageBehavior") ||
        (StorageStatus && m.message_type === "FRBC.StorageStatus") ||
        (SystemDescription && m.message_type === "FRBC.SystemDescription") ||
        (TimerStatus && m.message_type === "FRBC.TimerStatus") ||
        (UsageForecast && m.message_type === "FRBC.UsageForecast");

      return isSenderMatched && isMessageMatched && isTypeMatched;
    });

    setFilters(filtered);
  }, [data, selectedFilters]);

  return filters;
}

export default useFilters;
