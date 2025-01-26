import {Combobox} from "@headlessui/react";

/**
 * An interface for props of SearchBar component
 */
interface SearchBarProps {
    searchId: string;
    onSearchChange: (searchId: string) => void;
}

/**
 * The component for SearchBar - enables searching for messages based on their id
 * @param searchId The message ID to search for
 * @param onSearchChange The function to keep track of changing the search ID
 * @returns The SearchBar component
 */
function SearchBar({searchId, onSearchChange}: Readonly<SearchBarProps>) {
    // Determines the visibility of the delete icon in the search bar
    const deleteTextIcon = searchId !== "" ? "block" : "hidden";

    // Deletes the text in the search bar
    const handleDeleteSearchText = () => {
        onSearchChange("");
    };
    return (
        <div className="flex items-center bg-white rounded-lg">
            <Combobox value={searchId} defaultValue={""}>
                <svg xmlns="http://www.w3.org/2000/svg"
                     fill="none"
                     viewBox="0 0 24 24"
                     strokeWidth="1.5"
                     stroke="currentColor"
                     className="w-6 h-6 mx-2"
                >
                    <path strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                </svg>
                <Combobox.Input className="py-2 w-auto border border-white rounded-lg"
                                placeholder="Search Messages by ID"
                                onChange={(event) => onSearchChange(event.target.value)}
                />
                {deleteTextIcon === "block" && (
                    <svg xmlns="http://www.w3.org/2000/svg"
                         fill="none"
                         viewBox="0 0 24 24"
                         strokeWidth="1.5"
                         stroke="red"
                         className="w-6 h-6"
                         onClick={handleDeleteSearchText}
                    >
                        <path strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                    </svg>
                )}
            </Combobox>
        </div>
    );
}

export default SearchBar;
