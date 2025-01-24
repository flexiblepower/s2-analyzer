import React, { useState, useContext } from 'react';
import BackendContext from "../BackendContext";
import { api } from "../api/api.ts";

const MessageValidationPage = () => {
    const backendUrl = useContext(BackendContext);
    const [message, setMessage] = useState<object | null>(null);
    const [validationResult, setValidationResult] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);

            const text = await file.text();
            try {
                const json = JSON.parse(text);
                setMessage(json);
                setValidationResult(null); // Reset validation result when new file is loaded
            } catch (error) {
                console.error("Error parsing JSON file:", error);
                setMessage({ error: "Error parsing JSON file." });
                setValidationResult(null);
            }
        }
    };

    const handleValidation = async () => {
        if (message && !('error' in message)) {
            try {
                const result = await api.validateMessage(backendUrl, message);
                setValidationResult(result || 'Validation failed.');
            } catch (error) {
                console.error("Error validating message:", error);
                setValidationResult('Validation error.');
            }
        } else if (message && 'error' in message) {
            setValidationResult("Cannot validate: the message contains parsing errors.");
        } else {
            setValidationResult("No file selected.");
        }
    };

    return (
        <div className="w-full h-screen m-auto bg-base-gray">
            {/* Header */}
            <div className="col-start-1 col-end-13 row-start-1 row-end-2 text-center text-white py-4">
                Message Validation Page
            </div>

            {/* Action Bar */}
            <div className="flex justify-center py-4">
                <input type="file" id="fileInput" accept="application/json" className="hidden" onChange={handleFileChange}/>
                <button className="py-2 px-6 mx-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => document.getElementById('fileInput')?.click()}
                >
                    Load Message
                </button>
                <button className="py-2 px-6 mx-2 bg-green-500 text-white rounded hover:bg-green-600"
                        onClick={handleValidation}
                        disabled={!message && !selectedFile}
                >
                    Validate Message
                </button>
            </div>

            {/* Main Content */}
            <div className="flex justify-center p-4">
                <div className="flex flex-col bg-white shadow-lg rounded p-4 w-full max-w-[600px] h-80 overflow-auto mr-4">
                    <h3 className="text-lg font-semibold">Read Message:</h3>
                    <pre className="text-gray-800">
                        {message ? JSON.stringify(message, null, 2) : "No message loaded (json required)."}
                    </pre>
                </div>
                <div className="flex flex-col bg-white shadow-lg rounded p-4 w-full max-w-[600px] h-80 overflow-auto">
                    <h3 className="text-lg font-semibold">Validation Result:</h3>
                    <pre className="text-gray-800">
                        {validationResult ? validationResult : "No validation performed."}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default MessageValidationPage;
