import {useState, useEffect, useRef} from "react";

interface ErrorSidebarProps {
    errors: string[];
}

const [minWidth, maxWidth, defaultWidth] = [
    200,
    window.innerWidth / 2,
    window.innerWidth / 4,
];

function ErrorSidebar({ errors }: ErrorSidebarProps) {
    const [width, setWidth] = useState(defaultWidth);
    const isResizing = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing.current) {
                const newWidth = e.clientX;
                setWidth((newWidth >= minWidth && newWidth <= maxWidth) ? newWidth : width);
            }
        };

        const stopResizing = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", stopResizing);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [width]);

    const startResizing = () => {
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
    };

    return (
        <div className="flex absolute overflow-auto transition-colors">
            <div style={{ width: `${width}px`, height: '86vh' }} className="border-tno-blue border-r bg-base-gray">
                <h1 className="text-lg text-white">All errors:</h1>
                {errors.length ? (
                    errors.map((s, index) => (
                        <pre key={index}
                             className="text-white overflow-auto bg-base-gray"
                             style={{ maxWidth: width, overflowX: "hidden" }}
                        >
                            {s}
                        </pre>
                    ))
                ) : (
                    <pre className="text-white">None.</pre>
                )}
            </div>
            <div className="w-2 cursor-col-resize" onMouseDown={startResizing}/>
        </div>
    );
}

export default ErrorSidebar;
