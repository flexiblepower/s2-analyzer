import {useState} from "react";
import {Filters} from "../../../models/dataStructures/filters";

/**
 * An interface for props of FilterMenu component.
 */
interface FilterMenuProps {
    filters: Filters;
    onFilterChange: (filters: Filters) => void;
    isVisible: boolean;
}

/**
 * The component for FilterMenu - enables filtering messages based on specific filters
 * @param filters The filters to apply
 * @param onFilterChange The function to keep track of change in filters
 * @param isVisible The visibility of the FilterMenu component
 * @returns The FilterMenu component
 */
function FilterMenu({filters, onFilterChange, isVisible}: FilterMenuProps) {
    const [isVisibleTypeFilters, setIsVisibleTypeFilters] = useState(false);
    const [isVisibleFRBCFilters, setIsVisibleFRBCFilters] = useState(false);

    // Handles the change in the checkbox (selecting or deselecting filters)
    const handleCheckboxChange = (option: keyof Filters) => {
        const newFilters = {
            ...filters,
            [option]: !filters[option],
        };
        onFilterChange(newFilters);
    };

    // Handles the visibility of the Type Filters menu
    const handleTypeFilterVisibility = () => {
        setIsVisibleTypeFilters(!isVisibleTypeFilters);
    };

    // Handles the visibility of the FRBC Filters menu
    const handleFRBCFilterVisibility = () => {
        setIsVisibleFRBCFilters(!isVisibleFRBCFilters);
    };

    return (
        <div className={`text-left ${isVisible ? "block" : "hidden"}`}>
            <div className="absolute mt-2 w-60 origin-top-right rounded-md bg-base-gray shadow-lg ring-1 ring-black/5">
                <div className="py-4 px-4">
                    {Object.entries(filters)
                        .slice(0, 4)
                        .map(([key, value]) => (
                            <div className="flex items-center" key={key}>
                                <input type="checkbox"
                                       id={key}
                                       checked={value}
                                       onChange={() => handleCheckboxChange(key as keyof Filters)}
                                       className="mr-2 size-4 accent-white"
                                />
                                <label htmlFor={key} className="text-lg text-white">
                                    {key}
                                </label>
                            </div>
                        ))}
                    {/* The Type Filter Menu */}
                    <div className="flex items-center justify-between mb-1">
                        <button
                            className="flex items-center ml-6 w-auto text-lg text-white"
                            onClick={handleTypeFilterVisibility}
                        >
                            Type Filters
                            <svg className={`w-3 h-3 transform transition-transform duration-300 ease-in-out
                            ${isVisibleTypeFilters ? "rotate-180" : "rotate-90"} ml-7`}
                                 aria-hidden="true"
                                 fill="none"
                                 viewBox="0 0 10 6"
                            >
                                <path stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M9 5 5 1 1 5"
                                />
                            </svg>
                        </button>
                    </div>
                    <div className={`text-left ml-6 text-lg ${isVisibleTypeFilters ? "block" : "hidden"}`}>
                        {Object.entries(filters)
                            .slice(4, 15)
                            .map(([key, value]) => (
                                <div className="flex items-center" key={key}>
                                    <input type="checkbox"
                                           id={key}
                                           checked={value}
                                           onChange={() => handleCheckboxChange(key as keyof Filters)}
                                           className="mr-2 size-4 accent-white"
                                    />
                                    <label htmlFor={key} className="text-white text-sm">
                                        {key}
                                    </label>
                                </div>
                            ))}
                    </div>
                    {/* The FRBC Filter Menu */}
                    <div className="flex items-center justify-between mb-1">
                        <button className="flex items-center ml-6 w-auto text-lg text-white"
                                onClick={handleFRBCFilterVisibility}
                        >
                            FRBC Filters
                            <svg className={`w-3 h-3 transform transition-transform duration-300 ease-in-out
                            ${isVisibleFRBCFilters ? "rotate-180" : "rotate-90"} ml-6`}
                                 aria-hidden="true"
                                 fill="none"
                                 viewBox="0 0 10 6"
                            >
                                <path stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M9 5 5 1 1 5"
                                />
                            </svg>
                        </button>
                    </div>
                    <div className={`text-left ml-6 text-lg ${isVisibleFRBCFilters ? "block" : "hidden"}`}>
                        {Object.entries(filters)
                            .slice(15)
                            .map(([key, value]) => (
                                <div className="flex items-center" key={key}>
                                    <input type="checkbox"
                                           id={key}
                                           checked={value}
                                           onChange={() => handleCheckboxChange(key as keyof Filters)}
                                           className="mr-2 size-4 accent-white"
                                    />
                                    <label htmlFor={key} className="text-white text-sm">
                                        {key}
                                    </label>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FilterMenu;
