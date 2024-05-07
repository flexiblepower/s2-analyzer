import { useState, useRef } from "react";
import NavBar from "../components/navbar/NavBar.tsx";
import MessageList from "../components/messages/MessageList.tsx";
import MessageHeader from "../models/messages/messageHeader.ts";
import DeviceBox from "../components/devices/DeviceBox.tsx";
import { Filters } from "../models/dataStructures/filters.ts";
import Sidebar from "../components/sideComponent/sideComponent.tsx";
import TerminalController from "../components/terminal/Terminal.tsx";
import useFilters from "../hooks/useFilters.tsx";
import useSearch from "../hooks/useSearch.tsx";

/**
 * The component for rendering the Single Page Application
 * @returns the Single Page Application
 */
function Page() {
  const maxHeight = useRef(window.innerHeight).current * 0.79;
  const [data, setData] = useState([] as MessageHeader[]);
  const [isSideBarVisible, setIsSideBarVisible] = useState(false);
  const [alignment, setAlignment] = useState("justify-center");
  const [selectedFilters, setSelectedFilters] = useState<Filters>({
    CEM: true,
    RM: true,
    min: null,
    max: null,
    logs: true,
    warnings: true,
  });
  const [searchedMessage, setSearchedMessage] = useState("");

  const handleFilterChange = (newFilters: Filters) => {
    setSelectedFilters(newFilters);
  };

  const handleSearch = (search:string) => {
    setSearchedMessage(search);
  }

  const filteredMessages = useFilters(data, selectedFilters);
  const searchedMessages = useSearch(filteredMessages, searchedMessage);

  return (
    <div className="w-full h-screen bg-white grid grid-cols[max-content_auto] grid-rows-[5fr_1fr]">
      <div className="col-span-2">
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
        <div className={"col-span-1"}>
          <Sidebar />
        </div>
      )}
      <div className={`col-span-2 flex items-center ${alignment}`}>
        <DeviceBox title={"CEM"} thickness={3} width={5} height={maxHeight} />
        <div
            style={{ maxHeight: maxHeight, overflow: "auto" }}
        >
          <MessageList<MessageHeader> messages={searchedMessages}></MessageList>
        </div>
        <DeviceBox title={"RM"} thickness={3} width={5} height={maxHeight} />
      </div>
      <div className="col-span-2">
        <TerminalController />
      </div>
    </div>
  );
}

export default Page;
