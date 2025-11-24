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
    const [form_data, set_form_data] = useState<CreateS2Connection>(() => {
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

    const [message, set_message] = useState<string | null>(null);
    const [is_loading, set_is_loading] = useState(false); // New loading state

    useEffect(() => {
        // Save to local storage whenever formData changes
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(form_data));
    }, [form_data]);

    const handle_change = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        set_form_data({ ...form_data, [name]: value });
    };

    const handle_submit = async (e: React.FormEvent) => {
        e.preventDefault();
        set_message(null); // Clear previous message
        set_is_loading(true); // Start loading

        try {
            const response = await fetch(`http://${HOST}/backend/connections/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form_data),
            });

            if (!response.ok) {
                const errorData = await response.json(); // Try to parse the error response
                if (errorData && errorData.detail) {
                    set_message(errorData.detail); // Display the error message from the backend
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return;
            }

            const result = await response.json();
            console.log("Connection created:", result);
            set_message("Connection created successfully!"); // Set success message

            props.set_show_create_form(false);
        } catch (error: any) {
            set_message(error.message || "An unexpected error occurred");
        } finally {
            set_is_loading(false); // Stop loading
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
                        <form onSubmit={handle_submit} className="flex flex-col gap-4">
                            {message && (
                                <div
                                    className={`text-sm text-center italic ${message.startsWith("Connection created")
                                        ? "text-green-500"
                                        : "text-red-500"
                                        }`}
                                >
                                    {message}
                                </div>
                            )}

                            <TextInput label="RM ID" name="rm_id" id="rm_id" onChange={handle_change} value={form_data.rm_id} ></TextInput>
                            <TextInput label="CEM ID" name="cem_id" id="cem_id" onChange={handle_change} value={form_data.cem_id} ></TextInput>
                            <TextInput label="CEM URI" name="cem_uri" id="cem_uri" onChange={handle_change} value={form_data.cem_uri} ></TextInput>
                            <TextInput label="RM URI" name="rm_uri" id="rm_uri" onChange={handle_change} value={form_data.rm_uri} ></TextInput>

                            <div className="flex flex-row gap-4 justify-center">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-2 px-4 focus:outline-none focus:shadow-outline disabled:opacity-50"
                                    disabled={is_loading}
                                >
                                    {is_loading ? (
                                        <LoadingSpinner></LoadingSpinner>
                                    ) : (
                                        "Create Connection"
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="border border-rose-500 text-rose-600 bg-transparent hover:bg-rose-50 transition-colors font-bold py-2 px-4 focus:outline-none focus:shadow-outline disabled:opacity-50"
                                    disabled={is_loading}
                                    onClick={() => props.set_show_create_form(false)}
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