import {useState, useEffect} from 'react';
import ActionBar from "../components/actionbar/ActionBar.tsx";
import MessageHeader from "../models/messages/messageHeader";
import { Filters } from "../models/dataStructures/filters";
import ErrorSidebar from "../components/actionbar/actionbar_items/ErrorSidebar.tsx";
import useFilters from "../hooks/useFilters";
import useSearch from "../hooks/useSearch";
import WebSocketClient from "../api/socket/socket.ts";
import MessageWidget from "../components/messages/MessageWidget.tsx";
import MessageTable from "../components/messages/MessageTable.tsx";
import TerminalController from "../components/terminal/Terminal.tsx";

const RealtimeDataPage = () => {
    const [messages, setMessages] = useState<MessageHeader[]>([]); // State for storing message data
    const [alignment, setAlignment] = useState("justify-center"); // State for alignment of message widget
    const [searchedMessage, setSearchedMessage] = useState(""); // State for searched message id
    const [isWidgetView, setIsWidgetView] = useState(false); // State for widget view mode
    const [isSideBarVisible, setIsSideBarVisible] = useState(false); // State for error sidebar visibility
    const [parser, setParser] = useState<WebSocketClient["parser"] | null>(null);

    // State for selected filters
    const [selectedFilters, setSelectedFilters] = useState<Filters>({
        CEM: true,
        RM: true,
        Logs: true,
        Warnings: true,
        Handshake: true,
        HandshakeResponse: true,
        InstructionStatusUpdate: true,
        PowerForecast: true,
        PowerMeasurement: true,
        ResourceManagerDetails: true,
        RevokeObject: true,
        SelectControlType: true,
        SessionRequest: true,
        ConnectionLost: true,
        ActuatorStatus: true,
        FillLevelTargetProfile: true,
        Instruction: true,
        LeakageBehavior: true,
        StorageStatus: true,
        SystemDescription: true,
        TimerStatus: true,
        UsageForecast: true,
    });

    // Initialize WebSocket client
    useEffect(() => {
        console.log("Creating WS");
        const websocket: WebSocketClient = new WebSocketClient("ws://localhost:8001/backend/debugger/");

        setParser(websocket.parser); // Store parser from the WebSocketClient

        // Cleanup logic when component unmounts
        return () => {
            console.log("Cleaning up WebSocketClient");
            websocket.close();
        };
    }, []); // Empty dependency array ensures this runs only once

    // Fetch messages periodically
    useEffect(() => {
        if (!parser) return; // Ensure parser is available before running

        const fetchMessages = async () => {
            try {
                const newMessages = await parser.getMessages();
                setMessages(newMessages);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        const interval = setInterval(fetchMessages, 1000);
        return () => clearInterval(interval);
    }, [parser]);

    // Handle filter change
    const handleFilterChange = (newFilters: Filters) => {
        setSelectedFilters(newFilters);
    };

    // Handle search input
    const handleSearch = (search: string) => {
        setSearchedMessage(search);
    };

    const pauseMessages = () => parser?.setPause(!parser?.getIsPaused());

    const filteredMessages = useFilters(messages, selectedFilters);         // Get filtered messages based on selected filters
    const searchedMessages = useSearch(filteredMessages, searchedMessage); // Get searched messages based on search input

    return (
        <div className="w-full h-screen m-auto bg-base-backgroung grid grid-cols-12 grid-rows-12">
            <ActionBar filters={selectedFilters}
                       onFilterChange={handleFilterChange}
                       search={searchedMessage}
                       onSearchChange={handleSearch}
                       onAlignmentChange={setAlignment}
                       toggleSideBar={() => setIsSideBarVisible(!isSideBarVisible)}
                       toggleView={() => setIsWidgetView(!isWidgetView)}
                       pauseMessages={pauseMessages}
                       isPaused={parser?.getIsPaused() || false}
            />
            {isSideBarVisible && (
                <div className={"col-start-1 col-end-5 row-start-1 row-end-12 z-10"}>
                    <ErrorSidebar errors={parser?.getErrors() || []}/>
                </div>
            )}
            <div className="col-start-1 col-end-13 row-start-1 row-end-2 text-center text-white py-4">
                Real-Time Data Page
            </div>
            <div className={`col-start-1 col-end-13 row-start-1 row-end-12 flex items-center ${alignment}`}>
                {isWidgetView ? (
                    <MessageWidget<MessageHeader> messages={searchedMessages} />
                ) : (
                    <MessageTable messages={searchedMessages} />
                )}
            </div>
            <div className="col-start-1 col-end-13 row-start-12 row-end-13 z-40">
                <TerminalController parserLines={parser?.getLines() || ""} />
            </div>
        </div>
    );
};

export default RealtimeDataPage;
