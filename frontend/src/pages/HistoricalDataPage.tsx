import React, { useContext, useState } from 'react';
import { BackendMessage, FilterQuery } from '../api/apiTypes.ts';
import BackendContext from "../BackendContext.tsx";
import { api } from "../api/api.ts";
import { parser } from "../api/socket/parser.ts";
import MessageHeader from "../models/messages/messageHeader.ts";
import MessageTable from "../components/messages/MessageTable.tsx";

/**
 * HistoricalDataPage is a React component that allows users to filter and view historical data messages.
 * The page includes input fields for various filters (CEM ID, RM ID, Origin, Message Type, Start Date, and End Date),
 * and fetches the filtered data from the backend using the provided filter values.
 * If no data matches the filter, an error message is displayed. The component also handles the input field
 * changes, switches input types for date fields on focus, and displays the filtered historical data in a table.
 *
 * @returns The rendered component for displaying historical data with filters and results.
 */
const HistoricalDataPage = () => {
    const backendUrl = useContext(BackendContext);
    const [filters, setFilters] = useState<FilterQuery>({
        cem_id: '',
        rm_id: '',
        origin: '',
        s2_msg_type: '',
        start_date: '',
        end_date: '',
    });
    const [data, setData] = useState<MessageHeader[] | undefined>(undefined);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // State for controlling input type of date fields
    const [startDateType, setStartDateType] = useState<'text' | 'date'>('text');
    const [endDateType, setEndDateType] = useState<'text' | 'date'>('text');

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const fetchHistoricalData = async () => {
        if (Object.values(filters).every((filter) => filter === '')) {
            setErrorMessage('Please fill in at least one filter before fetching data.');
            return;
        }

        const filteredParams = Object.fromEntries(
            Object.entries(filters).filter(([, value]) => value !== '')
        );

        const result = await api.getHistoryFilter(backendUrl, filteredParams);

        if (result) {
            if (result.length === 0) {
                setErrorMessage("No matching data was found for the provided filters.");
                setData([]);
                return;
            }
        } else {
            setErrorMessage("Request or server error. Please check your filters or try again later.");
            setData([]);
            return;
        }

        const headers = result
            .map((message: BackendMessage) => {
                return parser.extractHeaderDatabaseMessage(message);
            })
            .filter((header): header is MessageHeader =>
                    header !== null && header.message_type !== "ReceptionStatus"
            );

        setData(headers);
        setErrorMessage(null); // Clear any error message when data is fetched successfully
    };

    // List of input fields and their placeholders
    const filterFields = [
        { name: 'cem_id', placeholder: 'CEM ID', type: 'text' },
        { name: 'rm_id', placeholder: 'RM ID', type: 'text' },
        { name: 'origin', placeholder: 'Origin', type: 'text' },
        { name: 's2_msg_type', placeholder: 'Message Type', type: 'text' },
        { name: 'start_date', placeholder: 'Start Date', type: startDateType },
        { name: 'end_date', placeholder: 'End Date', type: endDateType },
    ];

    return (
        <div className="w-full h-screen m-auto bg-base-backgroung grid grid-cols-12 grid-rows-12">
            {/* Header */}
            <div className="col-start-1 col-end-13 row-start-1 row-end-2 text-center text-white py-4">
                Historical Data Page
            </div>
            <div className="col-start-1 col-end-13 flex gap-4 p-4">
                {/* Filter Inputs */}
                <div className="flex-1 grid lg:grid-cols-2 gap-3">
                    {filterFields.map(({ name, placeholder, type }) => (
                        <input key={name}
                               type={type}
                               name={name}
                               value={filters[name as keyof FilterQuery]}
                               onChange={handleFilterChange}
                               placeholder={placeholder}
                               onFocus={() => {
                                   // Switch to 'date' type when focused
                                   if (name === 'start_date') setStartDateType('date');
                                   if (name === 'end_date') setEndDateType('date');
                               }}
                               onBlur={() => {
                                   // Switch back to 'text' type when focus is lost
                                   if (name === 'start_date') setStartDateType('text');
                                   if (name === 'end_date') setEndDateType('text');
                               }}
                               className="w-full max-w-md p-2 rounded-lg"
                        />
                    ))}
                    <button className="h-10 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            onClick={fetchHistoricalData}
                    >
                        Fetch
                    </button>
                    {errorMessage && (
                        <div className="text-red-500 mt-2">
                            {errorMessage}
                        </div>
                    )}
                </div>

                {/* Results Display */}
                <div>
                    <MessageTable messages={data || []} />
                </div>
            </div>
        </div>
    );
};

export default HistoricalDataPage;
