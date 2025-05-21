import { useState, useEffect } from "react";
import { CoolFrame } from "./CoolFrame";

type CreateS2Connection = {
    rm_id: string;
    cem_id: string;
    cem_uri: string;
    rm_uri: string;
};

const HOST = "localhost:8001";
const LOCAL_STORAGE_KEY = "createConnectionFormData";

export function CreateConnectionForm() {
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

        } catch (error: any) {
            setMessage(error.message || "An unexpected error occurred");
        }
    };

    return (
        <div className="mt-5">
            <div className={`font-bold text-4xl transition-colors text-blue-600 mb-4`}>
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
                            <div>
                                <label
                                    htmlFor="rm_id"
                                    className="block text-gray-700 text-sm font-bold mb-2"
                                >
                                    RM ID:
                                </label>
                                <input
                                    type="text"
                                    id="rm_id"
                                    name="rm_id"
                                    value={formData.rm_id}
                                    onChange={handleChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="cem_id"
                                    className="block text-gray-700 text-sm font-bold mb-2"
                                >
                                    CEM ID:
                                </label>
                                <input
                                    type="text"
                                    id="cem_id"
                                    name="cem_id"
                                    value={formData.cem_id}
                                    onChange={handleChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="cem_uri"
                                    className="block text-gray-700 text-sm font-bold mb-2"
                                >
                                    CEM URI:
                                </label>
                                <input
                                    type="text"
                                    id="cem_uri"
                                    name="cem_uri"
                                    value={formData.cem_uri}
                                    onChange={handleChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="rm_uri"
                                    className="block text-gray-700 text-sm font-bold mb-2"
                                >
                                    RM URI:
                                </label>
                                <input
                                    type="text"
                                    id="rm_uri"
                                    name="rm_uri"
                                    value={formData.rm_uri}
                                    onChange={handleChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Create Connection
                                </button>
                            </div>
                        </form>
                    </div>
                </CoolFrame>
            </div>
        </div>
    );
}