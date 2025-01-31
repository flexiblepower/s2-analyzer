import { useState, useContext } from 'react';
import BackendContext from "../BackendContext";
import { api } from "../api/api.ts";
import useFileSelection from "../hooks/useFileSelection.tsx";

/**
 * MessageValidationPage is a React component that enables users to load a message, validate its format, and view the result.
 * The page includes a file input for loading a JSON message and a button to trigger message validation.
 * The validation result, indicating whether the message is valid or not, is displayed to the user.
 * If the message contains parsing errors, the validation process cannot be performed.
 *
 * @returns The rendered component for message validation with feedback on message status.
 */
const MessageValidationPage = () => {
    const backendUrl = useContext(BackendContext);
    const { message, handleFileChange } = useFileSelection();
    const [validationResult, setValidationResult] = useState<string | null>(null);

    const handleValidation = async () => {
        if (message && !('error' in message)) {
            const result = await api.validateMessage(backendUrl, message);
            setValidationResult(result ?? "Validation failed.");
        } else if (message && 'error' in message) {
            setValidationResult("Cannot validate. The message contains parsing errors.");
        } else {
            setValidationResult(null);
        }
    };

    return (
        <div className="w-full h-screen m-auto bg-base-gray">
            {/* Header */}
            <div className="text-center text-white py-4">
                Message Validation Page
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center py-4">
                <input type="file"
                       id="fileInputValidate"
                       accept="application/json"
                       className="hidden"
                       onChange={handleFileChange}/>
                <button className="py-2 px-6 mx-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => document.getElementById('fileInputValidate')?.click()}
                >
                    Load Message
                </button>
                <button className="py-2 px-6 mx-2 bg-green-500 text-white rounded hover:bg-green-600"
                        onClick={handleValidation}
                >
                    Validate Message
                </button>
            </div>

            {/* Main Content Boxes */}
            <div className="flex justify-center p-4">
                <div className="flex flex-col bg-white shadow-lg rounded p-4 w-full max-w-[600px] h-[30rem] overflow-auto mr-4">
                    <h3 className="text-lg font-semibold">Read Message:</h3>
                    <pre className="text-gray-800">
                        {message ? JSON.stringify(message, null, 2) : "No message loaded (json required)."}
                    </pre>
                </div>
                <div className="flex flex-col bg-white shadow-lg rounded p-4 w-full max-w-[600px] h-[30rem] overflow-auto">
                    <h3 className="text-lg font-semibold">Validation Result:</h3>
                    <pre className="text-gray-800">
                        {validationResult ? JSON.stringify(validationResult, null, 2) : "No validation performed."}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default MessageValidationPage;
