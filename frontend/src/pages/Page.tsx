import NavBar from "../components/navbar/NavBar.tsx";
import MessageList from "../components/messages/MessageList.tsx";
import MessageHeader from "../models/messages/messageHeader.ts";
import DeviceBox from "../components/devices/DeviceBox.tsx";
//import PowerForecast from "../models/messages/powerForecast.ts";
//import { CommodityQuantity } from "../models/dataStructures/commodityQuantity.ts";
import { useState, useRef} from "react";
//import UsageForecast from "../models/messages/frbc/usageForecast.ts";
import { Filters } from "../models/filters.ts";

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

  const handleFilterChange = (newFilters: Filters) => {
    setSelectedFilters(newFilters);
  };

  const filteredMessages = data.filter((m) => {
    return (
      ((selectedFilters.CEM && m.sender?.includes("cem")) ||
        (selectedFilters.RM && m.sender?.substring(0, 2) === "RM")) &&
      (selectedFilters.min && selectedFilters.max
        ? m.time.getTime() >= selectedFilters.min &&
          m.time.getTime() <= selectedFilters.max
        : true) &&
      ((selectedFilters.logs && m.message_id !== null) ||
        (selectedFilters.warnings && m.message_id === null))
    );
  });

  console.log(filteredMessages);
  console.log(data);

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
