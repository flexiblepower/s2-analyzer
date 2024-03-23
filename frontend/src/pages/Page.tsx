import NavBar from "../components/NavBar/NavBar.tsx";
import Handshake from "../models/handshake.ts";
import { EnergyManagementRole } from "../models/dataStructures/energyManagementRole.ts";
import MessageList from "../components/Messages/MessageList.tsx";
import HandshakeResponse from "../models/handshakeResponse.ts";
import MessageHeader from "../models/messageHeader.ts";
import DeviceBox from "../components/devices/DeviceBox.tsx";

const data1: Handshake = {
  time: new Date(),
  status: "forwarded",
  sender: "RM",
  receiver: "CEM",
  message_type: "Handshake",
  message_id: "edfafsafs3",
  role: EnergyManagementRole.CEM,
  supported_protocol_versions: null,
};

const data2: HandshakeResponse = {
  time: new Date(),
  status: "buffered",
  sender: "CEM",
  receiver: "RM",
  message_type: "HandshakeResponse",
  message_id: "edfafsafs3",
  selected_protocol_version: "e",
};

const data3: MessageHeader = {
  time: new Date(),
  status: null,
  sender: "RM",
  receiver: null,
  message_type: "Connection Lost",
  message_id: null,
};

const data = [data2, data3, data1, data2, data3, data1, data2, data3, data1, data2, data3, data1, data2, data3, data1];
const maxHeight: number = 750

const selectedFilter:(m:MessageHeader)=>boolean =
    ((m)=>(
    (m.sender=="RM"||m.sender=="CEM") &&
    (m.time.getTime()>0 && m.time.getTime()<1000000000000000) &&
    (m.message_id!=null||m.message_id==null)))

/**
 * The component for rendering the Single Page Application
 * @returns the Single Page Application
 */
function Page() {

  return (
    <div className="min-h-screen bg-white">
      <NavBar/>
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
