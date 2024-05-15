import { useState } from "react";
import NavBar from "../components/navbar/NavBar.tsx";
import MessageHeader from "../models/messages/messageHeader.ts";
import { Filters } from "../models/dataStructures/filters.ts";
import Sidebar from "../components/sidebar/Sidebar.tsx";
import TerminalController from "../components/terminal/Terminal.tsx";
import useFilters from "../hooks/useFilters.tsx";
import useSearch from "../hooks/useSearch.tsx";
import WebSocketClient from "../parser/Socket.ts";
import MainComponent from "../components/mainComponents/MainComponent.tsx";

/**
 * The component for rendering the Single Page Application
 * @returns the Single Page Application
 */
function Page() {
  const [data, setData] = useState([] as MessageHeader[]);
  const [isSideBarVisible, setIsSideBarVisible] = useState(false);
  const [alignment, setAlignment] = useState("justify-center");
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
  const [searchedMessage, setSearchedMessage] = useState("");


  new WebSocketClient("ws://localhost:5000")

  const handleFilterChange = (newFilters: Filters) => {
    setSelectedFilters(newFilters);
  };

  const handleSearch = (search: string) => {
    setSearchedMessage(search);
  };

  const filteredMessages = useFilters(data, selectedFilters);
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
          <Sidebar />
        </div>
      )}
      <div
        className={`col-start-1 col-end-13 row-start-1 row-end-12 flex items-center ${alignment}`}
      >
        <MainComponent<MessageHeader> searchedMessages={searchedMessages} />
      </div>
      <div className="col-start-1 col-end-13 row-start-12 row-end-13 z-40">
        <TerminalController />
      </div>
    </div>
  );
}

export default Page;
