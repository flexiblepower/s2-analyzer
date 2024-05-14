import cemBox from '../../assets/cemBox.png';
import rmBox from '../../assets/rmBox.png';
import MessageList from '../messages/MessageList';
import MessageHeader from '../../models/messages/messageHeader';
import DeviceBox from '../devices/DeviceBox';

interface props<T extends MessageHeader> {
  searchedMessages: T[];
}

function MyComponent<T extends MessageHeader>(props: props<T>) {
  return (
    <div className="max-w-xl h-5/6 rounded-xl shadow-[0_1px_30px_1px_rgba(0,0,0,0.3)] grid grid-cols-12 grid-rows-12">
      <DeviceBox title={"CEM"} c_start={2} c_end={4} r_start={11} l_start={3}/>
      <DeviceBox title={"RM"} c_start={10} c_end={12} r_start={11} l_start={11}/>

      <div className='col-start-3 col-end-11 row-start-2 row-end-11' style={{overflow: "auto" }}>
        <MessageList<MessageHeader> messages={props.searchedMessages}></MessageList>
      </div>

    </div>
  );
};

export default MyComponent;