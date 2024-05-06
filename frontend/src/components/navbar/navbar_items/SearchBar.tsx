import { Combobox } from "@headlessui/react";

/**
 * An interface for props of SearchBar component.
 */
interface SearchBarProps {
  searchId: string;
  onSearchChange: (searchId: string) => void;
}

/**
 * The component for SearchBar. SearchBar enables searching for messages based on their id.
 * @returns The SearchBar component.
 */
function SearchBar({ searchId, onSearchChange }: SearchBarProps) {
  return (
    <Combobox value={searchId} defaultValue={""}>
      <Combobox.Input
        className="p-2 w-auto border border-gray rounded-lg"
        placeholder="Search Messages by ID"
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </Combobox>
  );
}

export default SearchBar;
