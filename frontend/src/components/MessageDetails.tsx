import { Message } from "../types/Message";
import { CoolFrame } from "./CoolFrame";

function MessageValidationError(props: { error: string | null, highlight: string }) {
    return props.error === null ? <span className={`font-bold ${props.highlight}`}>passed</span> : <span className={`font-bold text-red-600`}>failed</span>;
}

export default function MessageDetails(props: { message: Message | null }) {
    let highlight = {
        RM: "text-blue-600",
        CEM: "text-teal-600",
    }[props.message?.origin ?? "RM"];
    let border = {
        RM: "border-blue-600",
        CEM: "border-teal-600",
    }[props.message?.origin ?? "RM"];

    let validationPassed = props.message?.s2_validation_error === null;

    return <div className={`w-[40rem] max-w-[40rem] h-fit transition-opacity mt-5 ${props.message ? "opacity-100" : "opacity-0"}`}>
        <div className={`font-bold text-4xl transition-colors ${highlight} mb-4`}>Message Details</div>

        <CoolFrame offset={2} color={props.message?.origin === "CEM" ? "teal" : "blue"}>
            <div className="text-lg">
                <div className={`px-8 py-4 flex flex-col gap-2 border-b ${border}`}>
                    <div>Sent by: <span className={`font-bold ${highlight}`}>{props.message?.origin}</span></div>
                    <div>Timestamp: {props.message?.timestamp} </div>
                    <div>Reception status: {props.message?.reception_status === "OK" ? <span className={`font-bold ${highlight}`}>OK</span> : props.message?.reception_status === null ? <span className="text-gray-400">not yet received</span> : <span className="font-bold text-red-600">{props.message?.reception_status}</span>}</div>
                </div>
                <div className={`px-8 py-4 border-b ${border}`}>
                    This message {validationPassed ? <span className={`font-bold ${highlight}`}>passed</span> : <span className={`font-bold text-red-600`}>failed</span>} validation
                    {/* {validationPassed ? "." : `: ${props.message?.s2_validation_error?.msg ?? "Unknown error"}`} */}
                    {validationPassed ? "." : ":"}
                    {validationPassed ? "" :
                        <span className={`font-bold text-red-600`}>{props.message?.s2_validation_error?.msg}</span>
                    }
                    <br />
                    {JSON.stringify(props.message?.s2_validation_error, null, 2)}
                    {/* {props.message?.s2_validation_error !== null ? <div className="text-base">Reason: {props.message?.s2_validation_error.msg}</div> : <></>} */}
                </div>
                <div className="px-8 py-4">
                    <div className={`font-bold ${highlight} text-2xl mb-2`}>Message contents</div>
                    <div className="font-mono whitespace-pre-wrap text-base">
                        {JSON.stringify(props.message?.msg, null, 2)}
                    </div>
                </div>
            </div>
        </CoolFrame>
    </div>
}