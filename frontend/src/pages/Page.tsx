import NavBar from "../components/navbar/NavBar.tsx";
import MessageList from "../components/messages/MessageList.tsx";
import MessageHeader from "../models/messages/messageHeader.ts";
import DeviceBox from "../components/devices/DeviceBox.tsx";
//import PowerForecast from "../models/messages/powerForecast.ts";
//import { CommodityQuantity } from "../models/dataStructures/commodityQuantity.ts";
import { useState, useRef } from "react";
//import UsageForecast from "../models/messages/frbc/usageForecast.ts";
import { Filters } from "../models/dataStructures/filters.ts";
import WebSocketClient from "../parser/Socket.ts";
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
  const [selectedFilters, setSelectedFilters] = useState<Filters>({
    CEM: true,
    RM: true,
    min: null,
    max: null,
    logs: true,
    warnings: true,
  });

  //Should be changed when running in docker to ws://socket:5000
  new WebSocketClient("ws://localhost:5000");
  // A function to handle changes of filters dynamically.
  const handleFilterChange = (newFilters: Filters) => {
    setSelectedFilters(newFilters);
  };

  // Filtering the messages based on the selected filters.
  const filteredMessages = data.filter((m) => {
    return (
      ((selectedFilters.CEM && m.sender?.split(" ")[0] == "CEM") ||
        (selectedFilters.RM && m.sender?.split(" ")[0] == "RM")) &&
      (selectedFilters.min && selectedFilters.max
        ? m.time.getTime() >= selectedFilters.min &&
          m.time.getTime() <= selectedFilters.max
        : true) &&
      ((selectedFilters.logs && m.message_id !== null) ||
        (selectedFilters.warnings && m.message_id === null))
    );
  });

  return (
    <div className="min-h-screen bg-white">
      <NavBar
        messages={setData}
        filters={selectedFilters}
        onFilterChange={handleFilterChange}
      />
      <div className={"flex items-center justify-center"}>
        <DeviceBox title={"CEM"} thickness={3} width={5} height={maxHeight} />
        <div
          style={{ maxHeight: maxHeight, overflow: "auto" }}
          className={"no-scrollbar"}
        >
          <MessageList<MessageHeader> messages={filteredMessages}></MessageList>
        </div>
        <DeviceBox title={"RM"} thickness={3} width={5} height={maxHeight} />
      </div>
    </div>
  );
}

export default Page;