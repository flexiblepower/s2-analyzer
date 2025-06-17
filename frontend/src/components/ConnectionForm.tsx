import { useState, useEffect } from "react";
import { CoolFrame } from "./CoolFrame";
import LoadingSpinner from "./LoadingSpinner";
import TextInput from "./TextInput";

type CreateS2Connection = {
    rm_id: string;
    cem_id: string;
    cem_uri: string;
    rm_uri: string;
};

const HOST = "localhost:8001";
const LOCAL_STORAGE_KEY = "createConnectionFormData";

export function CreateConnectionForm(props: {
    set_show_create_form: (show_create_form: boolean) => void;
}) {
    const [formData, setFormData] = useState<CreateS2Connection>(() => {
        // Initialize from local storage
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        return storedData
            ? (JSON.parse(storedData) as CreateS2Connection)
            : {
                rm_id: "",
                cem_id: "",
                cem_uri: "",
                rm_uri: "",
            };
    });

    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false); // New loading state

    useEffect(() => {
        // Save to local storage whenever formData changes
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
    }, [formData]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null); // Clear previous message
        setIsLoading(true); // Start loading

        try {
            const response = await fetch(`http://${HOST}/backend/connections/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json(); // Try to parse the error response
                if (errorData && errorData.detail) {
                    setMessage(errorData.detail); // Display the error message from the backend
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return;
            }

            const result = await response.json();
            console.log("Connection created:", result);
            setMessage("Connection created successfully!"); // Set success message

            // props.set_show_create_form(false);
        } catch (error: any) {
            setMessage(error.message || "An unexpected error occurred");
        } finally {
            setIsLoading(false); // Stop loading
        }
    };

    return (
        <div className="mt-5">
            <div
                className={`font-bold text-4xl transition-colors text-blue-600 mb-4`}
            >
                Create Outgoing Session
            </div>
            <div>
                <CoolFrame offset={2} color="blue">
                    <div className="px-8 py-4">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {message && (
                                <div
                                    className={`text-sm italic ${message.startsWith("Connection created")
                                        ? "text-green-500"
                                        : "text-red-500"
                                        }`}
                                >
                                    {message}
                                </div>
                            )}

                            <TextInput label="RM ID:" name="rm_id" id="rm_id" onChange={handleChange} value={formData.rm_id} ></TextInput>
                            <TextInput label="CEM ID:" name="cem_id" id="cem_id" onChange={handleChange} value={formData.cem_id} ></TextInput>
                            <TextInput label="CEM URI:" name="cem_uri" id="cem_uri" onChange={handleChange} value={formData.cem_uri} ></TextInput>
                            <TextInput label="RM URI:" name="rm_uri" id="rm_uri" onChange={handleChange} value={formData.rm_uri} ></TextInput>

                            <div>
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <LoadingSpinner></LoadingSpinner>
                                    ) : (
                                        "Create Connection"
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="bg-rose-400 hover:bg-rose-500 text-white font-bold py-2 px-4 ms-2 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    Close
                                </button>
                            </div>
                        </form>
                    </div>
                </CoolFrame>
            </div>
        </div>
    );
}