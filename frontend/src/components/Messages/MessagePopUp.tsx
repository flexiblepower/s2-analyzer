import MessageHeader from "../../models/messageHeader.ts";

interface props<T extends MessageHeader> {
  trigger: boolean;
  setTrigger: (arg: boolean) => void;
  message: T;
}

/**
 * The component for rendering a single MessagePopUp
 * @returns the MessagePopUp
 */
function MessagePopUp<T extends MessageHeader>(props: props<T>) {
  const keys = Object.keys(props.message) as (keyof T)[];

  return (
    <>
      <div
        onClick={() => props.setTrigger(false)}
        className={`
                 fixed inset-0 flex justify-center items-center transition-colors
                 ${props.trigger ? "visible bg-black/20" : "invisible"}
                 `}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`bg-white rounded-xl shadow p-6 transition-all
                     ${
                       props.trigger
                         ? "scale-100 opacity-100"
                         : "scale-50 opacity-0"
                     }
                     `}
        >
          <h2 className="text-lg font-black text-gray-800 justify-center items-center flex">
            {props.message.message_type}
          </h2>
          <button
            className="absolute top-2 right-2 p-1 rounded-lg text-gray-400 bg-white hover:bg-gray-50 hover:text-gray-600"
            onClick={() => props.setTrigger(false)}
          >
            X
          </button>
          <div className="props-list">
            <table className="shadow-2xl font-[Calibri] border-2 border-blue-900">
              <thead className="text-white border-2 border-blue-900">
                <tr className="text-center">
                  <th className="py-3 bg-blue-600">Property</th>
                  <th className="py-3 bg-blue-600">Value</th>
                </tr>
              </thead>
              <tbody className={"text-black"}>
                {keys.map((key, index) => (
                  <tr
                    key={index}
                    className={`${
                      index % 2 == 0 ? "bg-blue-500" : "bg-blue-300"
                    }`}
                  >
                    <th className="border-2 border-blue-900">
                      {key.toString()}
                    </th>
                    <th className={"border-2 border-blue-900"}>
                      {props.message[key]?.toString()}
                    </th>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default MessagePopUp;
