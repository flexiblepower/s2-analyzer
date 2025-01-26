import React, { useState } from 'react';

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
