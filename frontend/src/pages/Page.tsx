import NavBar from "../components/navbar/NavBar.tsx";
import MessageList from "../components/messages/MessageList.tsx";
import MessageHeader from "../models/messageHeader.ts";
import DeviceBox from "../components/devices/DeviceBox.tsx";
import PowerForecast from "../models/powerForecast.ts";
import {CommodityQuantity} from "../models/dataStructures/commodityQuantity.ts";
import {useState, useRef} from "react";
import UsageForecast from "../models/frbc/usageForecast.ts";

const data4: PowerForecast = {
  time: new Date(),
  status: "forwarded",
  sender: "RM",
  receiver: "CEM",
  message_type: "PowerForecast",
  message_id: "edfafsafs3",
  start_time: new Date(),
  elements: [
      {duration: 100, power_values: [
          {value_upper_limit: 100,
      value_upper_95PPR: 90,
      value_upper_68PPR: 80,
      value_expected: 70,
      value_lower_68PPR: 60,
      value_lower_95PPR: 50,
      value_lower_limit: 60,
      commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L1},
              {value_upper_limit: 110,
      value_upper_95PPR: 100,
      value_upper_68PPR: 90,
      value_expected: 80,
      value_lower_68PPR: 70,
      value_lower_95PPR: 60,
      value_lower_limit: 50,
      commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L2},
              {value_upper_limit: 120,
      value_upper_95PPR: 110,
      value_upper_68PPR: 100,
      value_expected: 90,
      value_lower_68PPR: 80,
      value_lower_95PPR: 70,
      value_lower_limit: 60,
      commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L3}]},
      {duration: 100, power_values: [
          {value_upper_limit: 100,
                  value_upper_95PPR: 90,
                  value_upper_68PPR: 80,
                  value_expected: 70,
                  value_lower_68PPR: 60,
                  value_lower_95PPR: 50,
                  value_lower_limit: 60,
                  commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L1},
              {value_upper_limit: 110,
                  value_upper_95PPR: 100,
                  value_upper_68PPR: 90,
                  value_expected: 50,
                  value_lower_68PPR: 70,
                  value_lower_95PPR: 60,
                  value_lower_limit: 50,
                  commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L2},
              {value_upper_limit: 120,
                  value_upper_95PPR: 110,
                  value_upper_68PPR: 100,
                  value_expected: 100,
                  value_lower_68PPR: 80,
                  value_lower_95PPR: 70,
                  value_lower_limit: 60,
                  commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L3}
          ]}, {duration: 100, power_values:[
      {value_upper_limit: 100,
          value_upper_95PPR: 90,
          value_upper_68PPR: 80,
          value_expected: 70,
          value_lower_68PPR: 60,
          value_lower_95PPR: 50,
          value_lower_limit: 60,
          commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L1},
      {value_upper_limit: 110,
          value_upper_95PPR: 100,
          value_upper_68PPR: 90,
          value_expected: 80,
          value_lower_68PPR: 70,
          value_lower_95PPR: 60,
          value_lower_limit: 50,
          commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L2},
      {value_upper_limit: 120,
          value_upper_95PPR: 110,
          value_upper_68PPR: 100,
          value_expected: 110,
          value_lower_68PPR: 80,
          value_lower_95PPR: 70,
          value_lower_limit: 60,
          commodity_quantity: CommodityQuantity.ELECTRIC_POWER_L3}
      ]}]
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
        {duration: 100,
            usage_rate_upper_limit: 120,
            usage_rate_upper_95PPR: 110,
            usage_rate_upper_68PPR: 100,
            usage_rate_expected: 110,
            usage_rate_lower_68PPR: 80,
            usage_rate_lower_95PPR: 70,
            usage_rate_lower_limit: 60},
        {duration: 100,
            usage_rate_upper_limit: 120,
            usage_rate_upper_95PPR: 110,
            usage_rate_upper_68PPR: 100,
            usage_rate_expected: 50,
            usage_rate_lower_68PPR: 80,
            usage_rate_lower_95PPR: 70,
            usage_rate_lower_limit: 60},
        {duration: 100,
            usage_rate_upper_limit: 120,
            usage_rate_upper_95PPR: 110,
            usage_rate_upper_68PPR: 100,
            usage_rate_expected: 60,
            usage_rate_lower_68PPR: 80,
            usage_rate_lower_95PPR: 70,
            usage_rate_lower_limit: 60},
        {duration: 100,
            usage_rate_upper_limit: 120,
            usage_rate_upper_95PPR: 110,
            usage_rate_upper_68PPR: 100,
            usage_rate_expected: 110,
            usage_rate_lower_68PPR: 80,
            usage_rate_lower_95PPR: 70,
            usage_rate_lower_limit: 60}
    ]
}

/**
 * The component for rendering the Single Page Application
 * @returns the Single Page Application
 */
function Page() {
    const maxHeight = (useRef(window.innerHeight).current)*0.75;
    const [data, setData] = useState([] as MessageHeader[]);
    const [selectedFilter, setSelectedFilter] = useState(()=>{return (m: MessageHeader) => true});
    return (
        <div className="min-h-screen bg-white">
            <NavBar filter={setSelectedFilter} messages={setData}/>
            <div className={"flex items-center justify-center"}>
                <DeviceBox title={"CEM"} thickness={3} width={5} height={maxHeight}/>
                <div style={{maxHeight: maxHeight, overflow: 'auto'}} className={"no-scrollbar"}>
                    <MessageList<MessageHeader> messages={data.filter(selectedFilter)}></MessageList>
                </div>
                <DeviceBox title={"RM"} thickness={3} width={5} height={maxHeight}/>
            </div>
        </div>
  );
}

export default Page;
