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
      const { CEM, RM, min, max, logs, warnings } = selectedFilters;

      const isSenderMatched =
        (CEM && sender === "CEM") || (RM && sender === "RM");
      const isTimeMatched =
        min && max ? m.time.getTime() >= min && m.time.getTime() <= max : true;
      const isMessageMatched =
        (logs && m.message_id !== null) || (warnings && m.message_id === null);

      return isSenderMatched && isTimeMatched && isMessageMatched;
    });

    setFilters(filtered);
  }, [data, selectedFilters]);

  return filters;
}

export default useFilters;
