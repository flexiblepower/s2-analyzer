import { useState } from "react";
import { parser } from "../../parser/Parser.ts";

function TerminalController() {
  const [isOpen, setIsOpen] = useState(false);

  // Function to toggle the accordion open/close state
  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div id="accordion-flush" className="bg-stephanie-color text-white">
      <h2 id="accordion-flush-heading-1">
        <button
          type="button"
          className="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-white border-b border-gray-200 dark:border-gray-700 dark:text-gray-400 gap-3"
          data-accordion-target="#accordion-flush-body-1"
          aria-expanded={isOpen ? "true" : "false"} // Update aria-expanded based on accordion state
          onClick={toggleAccordion} // Handle click to toggle accordion
          aria-controls="accordion-flush-body-1"
        >
          <span className="mx-auto">Terminal</span>
          <svg
            data-accordion-icon
            className={`w-3 h-3 rotate-${isOpen ? "180" : "0"} shrink-0`} // Rotate the arrow icon based on accordion state
            aria-hidden="true"
            fill="none"
            viewBox="0 0 10 6"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5 5 1 1 5"
            />
          </svg>
        </button>
      </h2>
      <div
        id="accordion-flush-body-1"
        className={`${isOpen ? "block" : "hidden"}`} // Show/hide accordion body based on accordion state
        aria-labelledby="accordion-flush-heading-1"
      >
        <div className="py-5 border-b border-gray-200 dark:border-gray-700">
          <pre className="whitespace-pre-wrap overflow-auto" style={{ maxHeight: window.innerHeight / 2, fontFamily: 'Cascadia Code' }}>
            {parser.getLines()}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default TerminalController;
