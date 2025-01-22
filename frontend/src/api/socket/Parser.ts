import MessageHeader from "../../models/messages/messageHeader.ts";
import Handshake from "../../models/messages/handshake.ts";
import HandshakeResponse from "../../models/messages/handshakeResponse.ts";
import InstructionStatusUpdate from "../../models/messages/instructionStatusUpdate.ts";
import PowerForecast from "../../models/messages/powerForecast.ts";
import PowerMeasurement from "../../models/messages/powerMeasurement.ts";
import ReceptionStatus from "../../models/dataStructures/receptionStatus.ts";
import ResourceManagerDetails from "../../models/messages/resourceManagerDetails.ts";
import RevokeObject from "../../models/messages/revokeObject.ts";
import SelectControlType from "../../models/messages/selectControlType.ts";
import ActuatorStatus from "../../models/messages/frbc/actuatorStatus.ts";
import FillLevelTargetProfile from "../../models/messages/frbc/fillLevelTargetProfile.ts";
import Instruction from "../../models/messages/frbc/instruction.ts";
import LeakageBehaviour from "../../models/messages/frbc/leakageBehaviour.ts";
import StorageStatus from "../../models/messages/frbc/storageStatus.ts";
import SystemDescription from "../../models/messages/frbc/systemDescription.ts";
import TimerStatus from "../../models/messages/frbc/timerStatus.ts";
import UsageForecast from "../../models/messages/frbc/usageForecast.ts";
import SessionRequest from "../../models/messages/sessionRequest.ts";
import {BackendMessage} from "../apiTypes.ts";

export class Parser {
    private messageMap: MessageHeader[] = [];
    private bufferedMessages: MessageHeader[] = [];
    private lines: string = "";
    private bufferedLines: string = "";
    private errors: string[] = [];
    private isPaused: boolean = false;

    /**
     * Returns the current lines to be displayed by the Terminal Component
     * @returns The lines
     */
    public getLines() {
        return this.lines;
    }

    /**
     * Returns the current errors array encountered during parsing
     * @returns The errors array
     */
    public getErrors() {
        return this.errors;
    }

    /**
     * Returns the current paused state
     * @returns The paused state
     */
    public getIsPaused() {
        return this.isPaused;
    }

    /**
     * Sets the paused state
     * @param b - The new paused state
     */
    public setPause(b: boolean) {
        this.isPaused = b;
    }

    /**
     * Processes the parsed message map and updates message statuses if needed
     * @returns The processed message map
     */
    public getMessages() {
        for (let i = 0; i < this.messageMap.length; i++) {
            if ("subject_message_id" in this.messageMap[i]) {
                const temp = this.messageMap[i] as ReceptionStatus;
                for (let j = 0; j < this.messageMap.length; j++) {
                    if (this.messageMap[j].message_id == temp.subject_message_id) {
                        this.messageMap[j].status = temp;
                    }
                }
            } else if ("object_id" in this.messageMap[i]) {
                const temp = this.messageMap[i] as RevokeObject;
                for (let j = 0; j < this.messageMap.length; j++) {
                    if (this.messageMap[j].message_id == temp.object_id) {
                        this.messageMap[j].status = "revoked by message_id: " + this.messageMap[i].message_id;
                    }
                }
            }
        }
        return this.messageMap.filter((m) => !("subject_message_id" in m)).reverse();
    }

    /**
     * Adds a line to the log, buffering if paused
     * @param m - The line to add
     */
    public addLine(m: string) {
        const m_temp = m.endsWith("\n") ? m : `${m}\n`;
        if (this.isPaused) {
            this.bufferedLines += m_temp;
        } else {
            if (this.bufferedLines) {
                this.lines += this.bufferedLines;
                this.bufferedLines = "";
            }
            this.lines += m_temp;
        }
    }

    /**
     * Parses message from the backend, provided as a string by the socket
     * @param messageString - The message to be parsed
     */
    public parse(messageString: string) {
        const header = this.extractHeader(messageString);
        if (!header) return;

        if (this.isPaused) {
            this.bufferedMessages.push(header);
        } else {
            this.bufferedMessages.forEach(msg => {this.messageMap.push(msg);});
            this.bufferedMessages = [];
            this.messageMap.push(header);
        }
    }

    /**
     * Creates an object of type MessageHeader from the received message
     * @param messageStr - The message to extract the header from, passed as a JSON string
     * @returns The extracted header or null if extraction failed
     */
    private extractHeader(messageStr: string): MessageHeader | null {
        try {
            const parsedBackendMessage: BackendMessage = JSON.parse(messageStr);

            // Validate that required fields exist in the parsed object
            if (!parsedBackendMessage.cem_id || !parsedBackendMessage.rm_id ||
                !parsedBackendMessage.origin || !parsedBackendMessage.msg)
            {
                this.errors.push(`Invalid message structure: ${messageStr}`);
                return null;
            }

            const header: MessageHeader | null = this.castToMessageType(JSON.stringify(parsedBackendMessage.msg));

            // Determine sender and receiver based on origin
            const sender: string = parsedBackendMessage.origin;
            const receiver: string = sender === "RM" ? "CEM" : "RM";

            if (header) {
                header.time = parsedBackendMessage.timestamp ? new Date(parsedBackendMessage.timestamp) : new Date();
                header.sender = sender;
                header.receiver = receiver;

                // Set the status, including any validation error message if present
                header.status = parsedBackendMessage.s2_validation_error
                    ? `validation not successful: ${parsedBackendMessage.s2_validation_error.msg}`
                    : "valid";
            }

            return header;
        } catch (error) {
            // If JSON parsing fails, log the error and return null
            this.errors.push(`Error parsing JSON: "${error}"\nLine: "${messageStr}"`);
            return null;
        }
    }

    /**
     * Casts a JSON message string to a specific message type based on the message_type field
     * @param messageStr The JSON string representing the message
     * @returns The parsed message object of the corresponding message type, or null if no matching type is found
     */
    private castToMessageType(messageStr: string) {
        // Parse the JSON message string
        const message = JSON.parse(messageStr);
        // Cast it according to message type
        switch (message.message_type) {
            case "Handshake":
                return message as Handshake;
            case "HandshakeResponse":
                return message as HandshakeResponse;
            case "InstructionStatusUpdate":
                return message as InstructionStatusUpdate;
            case "PowerForecast":
                return message as PowerForecast;
            case "PowerMeasurement":
                return message as PowerMeasurement;
            case "ReceptionStatus":
                return message as ReceptionStatus;
            case "ResourceManagerDetails":
                return message as ResourceManagerDetails;
            case "RevokeObject":
                return message as RevokeObject;
            case "SelectControlType":
                return message as SelectControlType;
            case "SessionRequest":
                return message as SessionRequest;
            case "FRBC.ActuatorStatus":
                return message as ActuatorStatus;
            case "FRBC.FillLevelTargetProfile":
                return message as FillLevelTargetProfile;
            case "FRBC.Instruction":
                return message as Instruction;
            case "FRBC.LeakageBehaviour":
                return message as LeakageBehaviour;
            case "FRBC.StorageStatus":
                return message as StorageStatus;
            case "FRBC.SystemDescription":
                return message as SystemDescription;
            case "FRBC.TimerStatus":
                return message as TimerStatus;
            case "FRBC.UsageForecast":
                return message as UsageForecast;
            case null:
                return message as MessageHeader;
            default:
                // If no matching type is found, log an error and return null
                this.errors.push("Did not find a matching message type interface for " + message.message_type.toString() + ".");
                return null;
        }
    }

    /**
     * Parses log files selected by the user.
     * @returns The processed messages
     */
    public async parseLogFile() {
        const fileHandles = await window.showOpenFilePicker({multiple: true});
        this.messageMap = [];
        this.errors = [];
        for (const fileHandle of fileHandles) {
            const file = await fileHandle.getFile();
            this.lines = await file.text();
            this.lines = this.lines.replace("Issue:\n", "Issue: ");
            this.parse(this.lines);
        }
        return this.getMessages();
    }
}

// Create a singleton instance of the Parser class
const parser = new Parser();

// Export the singleton instance
export {parser};
