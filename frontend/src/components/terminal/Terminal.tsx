import {useState} from "react";
import {parser} from "../../parser/Parser.ts";

/**
 * The TerminalController component handles the display of a collapsible terminal section
 * @returns The TerminalController component
 */
function TerminalController() {
    const [isOpen, setIsOpen] = useState(false); // State to manage the open/close state of the accordion

    /**
     * Function to toggle the accordion open/close state
     */
    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div id="accordion-flush" className="bg-base-gray text-white">
            <h2 id="accordion-flush-heading-1">
                <button type="button"
                        className={`flex items-center justify-between w-full 
                        ${"py-" + (window.innerHeight > 700 ? "5" : "4")} 
                        font-medium rtl:text-right text-white 
                        ${isOpen ? "border" : "border-t"} border-tno-blue gap-3`}
                        data-accordion-target="#accordion-flush-body-1"
                        aria-expanded={isOpen ? "true" : "false"} // Update aria-expanded based on accordion state
                        onClick={toggleAccordion} // Handle click to toggle accordion
                        aria-controls="accordion-flush-body-1"
                >
                    <span className="mx-auto">Terminal</span>
                    <svg className={`w-3 h-3 transform transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180" : "rotate-0"}`} // Rotate the icon based on open/close state
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
            </h2>
            <div id="accordion-flush-body-1"
                 className={`${isOpen ? "block" : "hidden"}`} // Show/hide accordion body based on accordion state
                 aria-labelledby="accordion-flush-heading-1"
            >
                <div className="py-5 border-b border-tno-blue">
                    <pre className="whitespace-pre-wrap overflow-auto"
                         style={{maxHeight: window.innerHeight / 2, fontFamily: "Cascadia Code"}}
                    >
                        {/* Display the lines from the parser */}
                        {parser.getLines()}
                    </pre>
                </div>
            </div>
        </div>
    );
}

export default TerminalController;
