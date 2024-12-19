import {useEffect, useState} from "react";
import NavBar from "../components/navbar/NavBar.tsx";
import MessageHeader from "../models/messages/messageHeader.ts";
import {Filters} from "../models/dataStructures/filters.ts";
import Sidebar from "../components/navbar/navbar_items/Sidebar.tsx";
import TerminalController from "../components/terminal/Terminal.tsx";
import useFilters from "../hooks/useFilters.tsx";
import useSearch from "../hooks/useSearch.tsx";
import WebSocketClient from "../parser/Socket.ts";
import MessageWidget from "../components/messages/MessageWidget.tsx";

/**
 * The component for rendering the Single Page Application
 * @returns The Single Page Application
 */
function Page() {
    // State for storing message data
    const [data, setData] = useState([] as MessageHeader[]);
    // State for sidebar visibility
    const [isSideBarVisible, setIsSideBarVisible] = useState(false);
    // State for alignment of message widget
    const [alignment, setAlignment] = useState("justify-center");
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

    // State for searched message id
    const [searchedMessage, setSearchedMessage] = useState("");
    // Initialize WebSocket client

    useEffect(() => {
        console.log("Creating WS")
        const websocket = new WebSocketClient("ws://localhost:5000");

        // Cleanup function to close the WebSocket when the component unmounts
        return () => {
            console.log("Cleaning up WebSocketClient");
            websocket.close();
        };
    }, []); // Empty dependency array ensures this runs only once

    // Handle filter change
    const handleFilterChange = (newFilters: Filters) => {
        setSelectedFilters(newFilters);
    };

    // Handle search input
    const handleSearch = (search: string) => {
        setSearchedMessage(search);
    };

    // Get filtered messages based on selected filters
    const filteredMessages = useFilters(data, selectedFilters);
    // Get searched messages based on search input
    const searchedMessages = useSearch(filteredMessages, searchedMessage);

    return (
        <div className="w-full h-screen m-auto bg-base-backgroung grid grid-cols-12 grid-rows-12">
            <div className="col-start-1 col-end-13 row-start-0 row-end-1 z-40">
                <NavBar
                    messages={setData}
                    filters={selectedFilters}
                    onFilterChange={handleFilterChange}
                    search={searchedMessage}
                    onSearchChange={handleSearch}
                    onAlignmentChange={setAlignment}
                    toggleSideBar={isSideBarVisible}
                    onToggleSideBar={setIsSideBarVisible}
                />
            </div>
            {isSideBarVisible && (
                <div className={"col-start-1 col-end-5 row-start-1 row-end-12 z-10"}>
                    <Sidebar/>
                </div>
            )}
            <div className={`col-start-1 col-end-13 row-start-1 row-end-12 flex items-center ${alignment}`}>
                <MessageWidget<MessageHeader> searchedMessages={searchedMessages}/>
            </div>
            <div className="col-start-1 col-end-13 row-start-12 row-end-13 z-40">
                <TerminalController/>
            </div>
        </div>
    );
}

export default Page;
