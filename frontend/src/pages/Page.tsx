import {useState, useEffect} from 'react';
import NavBar from "../components/navbar/NavBar";
import MessageHeader from "../models/messages/messageHeader";
import { Filters } from "../models/dataStructures/filters";
import Sidebar from "../components/navbar/navbar_items/Sidebar";
import TerminalController from "../components/terminal/Terminal";
import useFilters from "../hooks/useFilters";
import useSearch from "../hooks/useSearch";
import WebSocketClient from "../parser/Socket";
import MessageWidget from "../components/messages/MessageWidget";
import MessageTable from "../components/messages/MessageTable";
import useToggle from "../hooks/useToggle";
import {parser} from "../parser/Parser.ts";

const Page = () => {
    const [messages, setMessages] = useState<MessageHeader[]>([]); // State for storing message data
    const [alignment, setAlignment] = useState("justify-center"); // State for alignment of message widget
    const [searchedMessage, setSearchedMessage] = useState(""); // State for searched message id
    const [isWidgetView, toggleWidgetView] = useToggle(false); // Using useToggle for widget view toggle
    const [isSideBarVisible, toggleSideBar] = useToggle(false); // Using useToggle for sidebar visibility

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
        const websocket = new WebSocketClient("ws://localhost:8001/backend/debugger/");

        // Cleanup function to close the WebSocket when the component unmounts
        return () => {
            console.log("Cleaning up WebSocketClient");
            websocket.close();
        };
    }, []); // Empty dependency array ensures this runs only once

    // Fetch messages periodically
    useEffect(() => {
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
    }, [messages]);

    // Handle filter change
    const handleFilterChange = (newFilters: Filters) => {
        setSelectedFilters(newFilters);
    };

    // Handle search input
    const handleSearch = (search: string) => {
        setSearchedMessage(search);
    };

    // Get files and pause messages logic
    const getFiles = async () => setMessages(await parser.parseLogFile());
    const pauseMessages = () => parser.setPause(!parser.getIsPaused());

    const filteredMessages = useFilters(messages, selectedFilters);         // Get filtered messages based on selected filters
    const searchedMessages = useSearch(filteredMessages, searchedMessage); // Get searched messages based on search input

    return (
        <div className="w-full h-screen m-auto bg-base-backgroung grid grid-cols-12 grid-rows-12">
            <div className="col-start-1 col-end-13 row-start-0 row-end-1 z-40">
                <NavBar filters={selectedFilters}
                        onFilterChange={handleFilterChange}
                        search={searchedMessage}
                        onSearchChange={handleSearch}
                        onAlignmentChange={setAlignment}
                        toggleSideBar={toggleSideBar}
                        toggleView={toggleWidgetView}
                        getFiles={getFiles}
                        pauseMessages={pauseMessages}
                        isPaused={parser.getIsPaused()}
                />
            </div>
            {isSideBarVisible && (
                <div className={"col-start-1 col-end-5 row-start-1 row-end-12 z-10"}>
                    <Sidebar errors={parser.getErrors()}/>
                </div>
            )}
            <div className={`col-start-1 col-end-13 row-start-1 row-end-12 flex items-center ${alignment}`}>
                {isWidgetView ? (
                    <MessageWidget<MessageHeader> searchedMessages={searchedMessages}/>
                ) : (
                    <MessageTable messages={searchedMessages}/>
                )}
            </div>
            <div className="col-start-1 col-end-13 row-start-12 row-end-13 z-40">
                <TerminalController parserLines={parser.getLines()}/>
            </div>
        </div>
    );

};

export default Page;
