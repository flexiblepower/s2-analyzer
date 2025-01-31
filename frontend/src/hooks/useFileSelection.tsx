import React, { useState } from 'react';

/**
 * The useFileSelection hook manages file selection and JSON parsing logic.
 * It provides state for the selected file and parsed message, along with a function to handle file changes.
 * It handles errors during JSON parsing and sets an appropriate error message.
 *
 * @returns An object containing:
 *   - `file`: The selected file, or null if no file is selected.
 *   - `message`: The parsed JSON message, or an error message if parsing fails.
 *   - `handleFileChange`: A function to handle file selection and parsing.
 */
const useFileSelection = () => {
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState<object | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);

            try {
                const text = await selectedFile.text();
                const json = JSON.parse(text);
                setMessage(json);
            } catch (error) {
                console.error("Error parsing JSON file:", error);
                setMessage({ error: "Error parsing JSON file." });
            }
        }
    };

    return {file, message, handleFileChange};
};

export default useFileSelection;
