import { useState, useContext } from 'react';
import BackendContext from "../BackendContext";
import { api } from "../api/api.ts";
import useFileSelection from "../hooks/useFileSelection"; // Import the custom hook

const MessageInjectionPage = () => {
    const backendUrl = useContext(BackendContext);
    const { message, handleFileChange } = useFileSelection();
    const [originId, setOriginId] = useState<string>('');
    const [destId, setDestId] = useState<string>('');
    const [injectionResult, setInjectionResult] = useState<string | null>(null);

    const handleInjectMessage = async () => {
        if (message && !('error' in message) && originId && destId) {
            const result = await api.injectMessage(backendUrl, originId, destId, message);
            if (result === null) {
                setInjectionResult("Message successfully injected!");
            } else {
                setInjectionResult("Injection failed due to a server error! Make sure the IDs and loaded message are valid.");
            }
        } else {
            setInjectionResult("Please ensure all fields are filled, including the message (with no parsing errors).");
        }
    };

    return (
        <div className="w-full h-screen m-auto bg-base-gray">
            {/* Header */}
            <div className="text-center text-white py-4">
                Message Injection Page
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center py-4">
                <input type="file"
                       id="fileInputInject"
                       accept="application/json"
                       className="hidden"
                       onChange={handleFileChange}
                />
                <button className="py-2 px-6 mx-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => document.getElementById('fileInputInject')?.click()}
                >
                    Load Message
                </button>
                <button className="py-2 px-6 mx-2 bg-green-500 text-white rounded hover:bg-green-600"
                        onClick={handleInjectMessage}
                >
                    Inject Message
                </button>
            </div>

            <div className="text-center text-white">
                {injectionResult && (<p>{injectionResult}</p>)}
            </div>

            {/* Loaded Message Box & Input Boxes */}
            <div className="flex justify-center p-4">
                <div className="bg-white shadow-lg rounded p-4 w-full max-w-[600px] h-80 overflow-auto">
                    <h3 className="text-lg font-semibold">Read Message:</h3>
                    <pre className="text-gray-800">
                        {message ? JSON.stringify(message, null, 2) : "No message loaded (json required)."}
                    </pre>
                </div>
                <div className="flex flex-col space-y-4">
                    <div className="p-2">
                        <input type="text"
                               placeholder="Origin ID"
                               className="p-2 rounded w-full"
                               value={originId}
                               onChange={(e) => setOriginId(e.target.value)}
                        />
                    </div>
                    <div className="p-2">
                        <input type="text"
                               placeholder="Destination ID"
                               className="p-2 rounded w-full"
                               value={destId}
                               onChange={(e) => setDestId(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageInjectionPage;
