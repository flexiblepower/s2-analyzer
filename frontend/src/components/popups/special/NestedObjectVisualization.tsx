import {useState} from "react";
import { v4 as uuidv4 } from "uuid";

interface Props {
    obj: object;
}

const NestedObjectVisualization = ({obj}: Readonly<Props>) => {
    const [collapsed] = useState(new Map<string, boolean>());

    // Renders a single property
    const renderProperty = (property: string, value: string | object) => {
        if (typeof value === "object" && value !== null) {
            return (
                <tr className="bg-metallic-gray">
                    <td className="border-2 border-tno-blue"
                        onClick={(e) => {
                            e.stopPropagation();
                            collapsed.set(
                                property,
                                collapsed.has(property) ? !collapsed.get(property) : false
                            );
                        }}
                    >
                        {property}
                    </td>
                    <td>
                        {collapsed.get(property) ? (
                            <NestedObjectVisualization obj={value}/>
                        ) : (
                            <span>Click to expand</span>
                        )}
                    </td>
                </tr>
            );
        } else if (Array.isArray(value)) {
            return (
                <tr className="bg-metallic-gray">
                    <td className="border-2 border-tno-blue"
                        onClick={(e) => {
                            e.stopPropagation();
                            collapsed.set(
                                property,
                                collapsed.has(property) ? !collapsed.get(property) : false
                            );
                        }}
                    >
                        {property}
                    </td>
                    <td>
                        {collapsed.get(property) ? (
                            value?.map((item) => (
                                <NestedObjectVisualization key={uuidv4()} obj={item}/>
                            ))
                        ) : (
                            <span>Click to expand</span>
                        )}
                    </td>
                </tr>
            );
        } else {
            return (
                <tr>
                    <td className="border-2 border-tno-blue">{property}</td>
                    <td className="border-2 border-tno-blue">{value}</td>
                </tr>
            );
        }
    };

    return (
        <table className="rounded-lg font-[Calibri] border-2 border-separate border-tno-blue">
            <tbody className={"text-white"}>
            {Object.entries(obj).map(([property, value]) => renderProperty(property, value))}
            </tbody>
        </table>
    );
};

export default NestedObjectVisualization;
