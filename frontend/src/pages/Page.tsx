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
import MessageTable from "../components/messages/MessageTable.tsx";
import useToggle from "../hooks/useToggle.tsx";

/**
 * The component for rendering the Single Page Application
 * @returns The Single Page Application
 */
function Page() {
    const [data, setData] = useState<MessageHeader[]>([]); // State for storing message data
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

    const filteredMessages = useFilters(data, selectedFilters);            // Get filtered messages based on selected filters
    const searchedMessages = useSearch(filteredMessages, searchedMessage); // Get searched messages based on search input

    return (
        <div className="w-full h-screen m-auto bg-base-backgroung grid grid-cols-12 grid-rows-12">
            <div className="col-start-1 col-end-13 row-start-0 row-end-1 z-40">
                <NavBar messages={setData}
                        filters={selectedFilters}
                        onFilterChange={handleFilterChange}
                        search={searchedMessage}
                        onSearchChange={handleSearch}
                        onAlignmentChange={setAlignment}
                        toggleSideBar={toggleSideBar}
                        toggleView={toggleWidgetView}
                />
            </div>
            {isSideBarVisible && (
                <div className={"col-start-1 col-end-5 row-start-1 row-end-12 z-10"}>
                    <Sidebar/>
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
                <TerminalController/>
            </div>
        </div>
    );
}

export default Page;
