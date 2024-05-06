import { useState, useRef } from "react";
import NavBar from "../components/navbar/NavBar.tsx";
import MessageList from "../components/messages/MessageList.tsx";
import MessageHeader from "../models/messages/messageHeader.ts";
import DeviceBox from "../components/devices/DeviceBox.tsx";
//import PowerForecast from "../models/messages/powerForecast.ts";
//import { CommodityQuantity } from "../models/dataStructures/commodityQuantity.ts";
//import UsageForecast from "../models/messages/frbc/usageForecast.ts";
import { Filters } from "../models/dataStructures/filters.ts";
import Sidebar from "../components/sideComponent/sideComponent.tsx";
import TerminalController from "../components/terminal/Terminal.tsx";
import useFilters from "../hooks/useFilters.tsx";
import useSearch from "../hooks/useSearch.tsx";

/**
const data4: PowerForecast = {
  time: new Date(),
  status: "forwarded",
  sender: "RM",
  receiver: "CEM",
  message_type: "PowerForecast",
  message_id: "edfafsafs3",
  start_time: new Date(),
  elements: [
    {
      duration: 100,
      power_values: [
        {
          value_upper_limit: 100,
          value_upper_95PPR: 90,
          value_upper_68PPR: 80,
          value_expected: 70,
          value_lower_68PPR: 60,
          value_lower_95PPR: 50,
          value_lower_limit: 60,
          commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L1,
        },
        {
          value_upper_limit: 110,
          value_upper_95PPR: 100,
          value_upper_68PPR: 90,
          value_expected: 80,
          value_lower_68PPR: 70,
          value_lower_95PPR: 60,
          value_lower_limit: 50,
          commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L2,
        },
        {
          value_upper_limit: 120,
          value_upper_95PPR: 110,
          value_upper_68PPR: 100,
          value_expected: 90,
          value_lower_68PPR: 80,
          value_lower_95PPR: 70,
          value_lower_limit: 60,
          commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L3,
        },
      ],
    },
    {
      duration: 100,
      power_values: [
        {
          value_upper_limit: 100,
          value_upper_95PPR: 90,
          value_upper_68PPR: 80,
          value_expected: 70,
          value_lower_68PPR: 60,
          value_lower_95PPR: 50,
          value_lower_limit: 60,
          commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L1,
        },
        {
          value_upper_limit: 110,
          value_upper_95PPR: 100,
          value_upper_68PPR: 90,
          value_expected: 50,
          value_lower_68PPR: 70,
          value_lower_95PPR: 60,
          value_lower_limit: 50,
          commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L2,
        },
        {
          value_upper_limit: 120,
          value_upper_95PPR: 110,
          value_upper_68PPR: 100,
          value_expected: 100,
          value_lower_68PPR: 80,
          value_lower_95PPR: 70,
          value_lower_limit: 60,
          commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L3,
        },
      ],
    },
    {
      duration: 100,
      power_values: [
        {
          value_upper_limit: 100,
          value_upper_95PPR: 90,
          value_upper_68PPR: 80,
          value_expected: 70,
          value_lower_68PPR: 60,
          value_lower_95PPR: 50,
          value_lower_limit: 60,
          commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L1,
        },
        {
          value_upper_limit: 110,
          value_upper_95PPR: 100,
          value_upper_68PPR: 90,
          value_expected: 80,
          value_lower_68PPR: 70,
          value_lower_95PPR: 60,
          value_lower_limit: 50,
          commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L2,
        },
        {
          value_upper_limit: 120,
          value_upper_95PPR: 110,
          value_upper_68PPR: 100,
          value_expected: 110,
          value_lower_68PPR: 80,
          value_lower_95PPR: 70,
          value_lower_limit: 60,
          commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L3,
        },
      ],
    },
  ],
};

const data5: UsageForecast = {
  time: new Date(),
  status: "forwarded",
  sender: "RM",
  receiver: "CEM",
  message_type: "UsageForecast",
  message_id: "edfafsafs4",
  start_time: new Date(),
  elements: [
    {
      duration: 100,
      usage_rate_upper_limit: 120,
      usage_rate_upper_95PPR: 110,
      usage_rate_upper_68PPR: 100,
      usage_rate_expected: 110,
      usage_rate_lower_68PPR: 80,
      usage_rate_lower_95PPR: 70,
      usage_rate_lower_limit: 60,
    },
    {
      duration: 100,
      usage_rate_upper_limit: 120,
      usage_rate_upper_95PPR: 110,
      usage_rate_upper_68PPR: 100,
      usage_rate_expected: 50,
      usage_rate_lower_68PPR: 80,
      usage_rate_lower_95PPR: 70,
      usage_rate_lower_limit: 60,
    },
    {
      duration: 100,
      usage_rate_upper_limit: 120,
      usage_rate_upper_95PPR: 110,
      usage_rate_upper_68PPR: 100,
      usage_rate_expected: 60,
      usage_rate_lower_68PPR: 80,
      usage_rate_lower_95PPR: 70,
      usage_rate_lower_limit: 60,
    },
    {
      duration: 100,
      usage_rate_upper_limit: 120,
      usage_rate_upper_95PPR: 110,
      usage_rate_upper_68PPR: 100,
      usage_rate_expected: 110,
      usage_rate_lower_68PPR: 80,
      usage_rate_lower_95PPR: 70,
      usage_rate_lower_limit: 60,
    },
  ],
};
*/

/**
 * The component for rendering the Single Page Application
 * @returns the Single Page Application
 */
function Page() {
  const maxHeight = useRef(window.innerHeight).current * 0.75;
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

  console.log(filteredMessages);

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
