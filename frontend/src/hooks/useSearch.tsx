import { useEffect, useState } from "react";
import MessageHeader from "../models/messages/messageHeader";

/**
 * A custom hook that searches messages based on their id.
 * @returns The searched message.
 */
function useSearch(data: MessageHeader[], search: string) {
  const [searchedMessage, setSearchedMessage] = useState<MessageHeader[]>([]);

  useEffect(() => {
    if (search === "") {
      setSearchedMessage(data);
    } else {
      const foundedMessage = data.filter((m) => m.message_id === search);
      if (foundedMessage.length > 0) {
        setSearchedMessage(foundedMessage);
      } else {
        setSearchedMessage(data);
      }
    }
  }, [data, search]);

  return searchedMessage;
}
export default useSearch;
