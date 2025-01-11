import React, { useState, useEffect, useRef } from "react";
import s2AnalyzerLogo from "../../assets/s2AnalyzerLogo.png";
import MessageHeader from "../../models/messages/messageHeader.ts";
import { Filters } from "../../models/dataStructures/filters.ts";
import { parser } from "../../parser/Parser.ts";
import FilterMenu from "./navbar_items/FilterMenu.tsx";
import SearchBar from "./navbar_items/SearchBar.tsx";
import useCloseFilterMenu from "../../hooks/useCloseFilterMenu.tsx";

interface NavBarProps {
    messages: React.Dispatch<React.SetStateAction<MessageHeader[]>>;
    filters: Filters;
    onFilterChange: (filters: Filters) => void;
    search: string;
    onSearchChange: (search: string) => void;
    onAlignmentChange: React.Dispatch<React.SetStateAction<string>>;
    toggleSideBar: boolean;
    onToggleSideBar: React.Dispatch<React.SetStateAction<boolean>>;
    toggleView: () => void;
}

const NavigationBar = ({messages, filters, onFilterChange, search, onSearchChange, onAlignmentChange, toggleSideBar, onToggleSideBar, toggleView}: NavBarProps) => {
    const [isVisibleFilterMenu, setIsVisibleFilterMenu] = useState(false);
    const [index, setIndex] = useState(2);
    const [showAllOptions, setShowAllOptions] = useState(false);
    const [showSpecialKeys, setShowSpecialKeys] = useState(false);
    const alignments = ["justify-self-auto", "justify-center", "justify-end"];
    const filterMenuRef = useRef(null);

    const toggleFilterMenu = () => setIsVisibleFilterMenu(!isVisibleFilterMenu);
    const getFiles = async () => messages(await parser.parseLogFile());
    const pauseMessages = () => parser.setPause(!parser.getIsPaused());
    const changeAlignment = () => {
        setIndex((index + 1) % 3);
        onAlignmentChange(alignments[index]);
    };
    const fetchMessages = async () => {
        try {
            const newMessages = await parser.getMessages();
            messages(newMessages);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };
    const handleClosingFilterMenu = () => setIsVisibleFilterMenu(false);
    useCloseFilterMenu(filterMenuRef, handleClosingFilterMenu);

    useEffect(() => {
        const interval = setInterval(fetchMessages, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <nav className="bg-base-gray w-full z-20 top-0 start-0 border-b border-tno-blue">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <a href="https://s2standard.org/"
                   className="flex items-center space-x-3 rtl:space-x-reverse"
                   target="_blank"
                   rel="noopener noreferrer"
                >
                    <img src={s2AnalyzerLogo} className="h-10" alt="TNO Logo" />
                </a>
                <button type="button"
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-tno-blue"
                        onClick={() => setShowAllOptions(!showAllOptions)}
                >
                    <span className="sr-only">Open main menu</span>
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                        <path stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M1 1h15M1 7h15M1 13h15"/>
                    </svg>
                </button>
                <div className={`${showAllOptions ? "flex" : "hidden"} items-center justify-start w-full md:flex md:w-auto md:order-1 mt-2 md:mt-0`}>
                    <ul className="flex flex-col md:flex-row md:space-x-8 md:border-0">
                        {[
                            { onClick: () => onToggleSideBar(!toggleSideBar), label: "Ξ" },
                            { onClick: toggleView, label: "Toggle View" },
                            { onClick: pauseMessages, label: parser.getIsPaused() ? "Continue Real-Time" : "Pause Real-Time" },
                            { onClick: getFiles, label: "Load File" },
                            { onClick: toggleFilterMenu, label: "Filters", isFilter: true },
                            { onClick: changeAlignment, label: "Change Alignment" },
                            { onClick: () => setShowSpecialKeys((prev) => !prev), label: "Special Keys", isSpecialKey: true },
                        ].map((button, index) => (
                            <li key={index}>
                                <button
                                    className="block py-1 px-2 md:py-2 md:px-3 text-white rounded md:hover:text-tno-blue md:p-0"
                                    onClick={button.onClick}
                                >
                                    {button.label}
                                </button>
                                {button.isFilter && (
                                    <div className="clickable-heading md:absolute">
                                        <FilterMenu filters={filters} onFilterChange={onFilterChange} isVisible={isVisibleFilterMenu} />
                                    </div>
                                )}
                                {button.isSpecialKey && (
                                    <div className="relative">
                                        {showSpecialKeys && (
                                            <div className="absolute mt-2 w-60 origin-top-right rounded-md bg-base-gray shadow-lg ring-1 ring-black/5">
                                                <ul className="text-white">
                                                    <li className="py-1 px-2">
                                                        <strong>X:</strong> Close all message popups
                                                    </li>
                                                    <li className="py-1 px-2">
                                                        <strong>C:</strong> Toggle draggable mode
                                                    </li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                        <li>
                            <SearchBar searchId={search} onSearchChange={onSearchChange} />
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;
