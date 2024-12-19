import {useEffect, useState} from "react";
import MessageHeader from "../models/messages/messageHeader";

/**
 * A custom hook that searches messages based on their id
 * @returns The array of messages that match the seach criteria
 */
function useSearch(data: MessageHeader[], search: string) {
    const [searchedMessage, setSearchedMessage] = useState<MessageHeader[]>([]);

    useEffect(() => {
        if (search === "") {
            // If search is empty, return all data
            setSearchedMessage(data);
        } else {
            // Filter the data to find messages that match the search id
            const foundedMessage = data.filter((m) => m.message_id === search);
            if (foundedMessage.length > 0) {
                // If messages are found, update the state with the found messages
                setSearchedMessage(foundedMessage);
            } else {
                // If no messages are found, return all data
                setSearchedMessage(data);
            }
        }
    }, [data, search]); // Re-run the effect whe data or search changes

    return searchedMessage;
}

export default useSearch;
