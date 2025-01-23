import React, { useContext, useState } from 'react';
import { FilterQuery } from '../api/apiTypes.ts';
import BackendContext from "../BackendContext.tsx";
import { api } from "../api/api.ts";
import { parser } from "../api/socket/Parser.ts";
import MessageHeader from "../models/messages/messageHeader.ts";
import MessageTable from "../components/messages/MessageTable.tsx";

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

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const fetchHistoricalData = async () => {
        try {
            const result = await api.getHistoryFilter(backendUrl, filters);

            if (!result) {
                console.error("No data returned from the API.");
                return;
            }

            const headers = result.map((messageStr: string) => {
                return parser.extractHeader(messageStr); // Extracts the MessageHeader, or null if invalid
            }).filter((header): header is MessageHeader => header !== null); // Filter out null headers

            setData(headers); // Store only valid headers
        } catch (err) {
            console.error(err);
        }
    };

    // List of input fields and their placeholders
    const filterFields = [
        { name: 'cem_id', placeholder: 'CEM ID', type: 'text' },
        { name: 'rm_id', placeholder: 'RM ID', type: 'text' },
        { name: 'origin', placeholder: 'Origin', type: 'text' },
        { name: 's2_msg_type', placeholder: 'Message Type', type: 'text' },
        { name: 'start_date', placeholder: 'Start Date', type: 'date' },
        { name: 'end_date', placeholder: 'End Date', type: 'date' }
    ];

    return (
        <div className="w-full h-screen m-auto bg-base-backgroung grid grid-cols-12 grid-rows-12">
            <div className="col-start-1 col-end-13 row-start-1 row-end-2 text-center text-white py-4">
                Historical Data
            </div>
            <div className="col-start-1 col-end-13 row-start-2 row-end-5 flex gap-4">
                {/* Filter Inputs */}
                <div className="flex-1 grid lg:grid-cols-2 gap-3">
                    {filterFields.map(({name, placeholder, type}) => (
                        <input key={name}
                               type={type}
                               name={name}
                               value={filters[name as keyof FilterQuery]}
                               onChange={handleFilterChange}
                               placeholder={placeholder}
                               className="w-full max-w-md p-2 rounded-lg"
                        />
                    ))}
                    <button className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            onClick={fetchHistoricalData}
                    >
                        Fetch
                    </button>
                </div>

                {/* Results Display */}
                <div>
                    <MessageTable messages={data || []}/>
                </div>
            </div>
        </div>
    );
};

export default HistoricalDataPage;
