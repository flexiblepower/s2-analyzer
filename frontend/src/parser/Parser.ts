import MessageHeader from "../models/messageHeader";
import Handshake from "../models/handshake.ts";
import HandshakeResponse from "../models/handshakeResponse.ts";
import InstructionStatusUpdate from "../models/instructionStatusUpdate.ts";
import PowerForecast from "../models/powerForecast.ts";
import PowerMeasurement from "../models/powerMeasurement.ts";
import ReceptionStatus from "../models/receptionStatus.ts";
import ResourceManagerDetails from "../models/resourceManagerDetails.ts";
import RevokeObject from "../models/revokeObject.ts";
import SelectControlType from "../models/selectControlType.ts";
import ActuatorStatus from "../models/frbc/actuatorStatus.ts";
import FillLevelTargetProfile from "../models/frbc/fillLevelTargetProfile.ts";
import Instruction from "../models/frbc/instruction.ts";
import LeakageBehaviour from "../models/frbc/leakageBehaviour.ts";
import StorageStatus from "../models/frbc/storageStatus.ts";
import SystemDescription from "../models/frbc/systemDescription.ts";
import TimerStatus from "../models/frbc/timerStatus.ts";
import UsageForecast from "../models/frbc/usageForecast.ts";

export class Parser {
    private messageMap: MessageHeader[] = []
    private lines: string = ""

    getLines() {
        return this.lines
    }

    getMessages() {
        for (let i=0; i<this.messageMap.length; i++) {
            if ("subject_message_id" in this.messageMap[i]) {
                const temp = this.messageMap[i] as ReceptionStatus
                for (let j=0; j<this.messageMap.length; j++) {
                    if (this.messageMap[j].message_id==temp.subject_message_id) {
                        this.messageMap[j].status = temp
                    }
                }
            } else if ("object_id" in this.messageMap[i]) {
                for (let j=0; j<this.messageMap.length; j++) {
                    if (this.messageMap[j].message_id==this.messageMap[i].object_id) {
                        this.messageMap[j].status = "revoked by message_id: "+this.messageMap[i].message_id
                    }
                }
            }
        }
        return this.messageMap.filter((m)=> !("subject_message_id" in m)).reverse()
    }

    //Allows you to select one or more files from the file system
    async parseLogFile() {
        const fileHandles = await window.showOpenFilePicker({ multiple: false });
        for (const fileHandle of fileHandles) {
            const file = await fileHandle.getFile();
            this.lines = await file.text();
            this.lines = this.lines.replace("Issue:\n", "Issue: ")
            this.parse(this.lines);
        }
        return this.getMessages();
    }

    private parse(contents: string) {
        const lines = contents.split('\n');
        lines.forEach(line => {
            const header = this.extractHeader(line);
            if (header) {
                for (let i=0; i<this.messageMap.length; i++) {
                    if (this.messageMap[i].message_id && this.messageMap[i].message_id==header.message_id) {
                        if (this.messageMap[i].status.toString().includes("invalid")) return
                        this.messageMap[i] = header
                        return
                    }
                }
                this.messageMap.push(header);
            }
        });
    }

    private extractHeader(line: string): MessageHeader | null {
        const dateTimeMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
        // Extracting JSON message after ensuring it's properly formatted
        const jsonMessageMatch = line.match(/Message: (\{.*\})/s); // 's' flag for capturing multiline JSON

        if (this.extractField(line, "Message") == "forwarded") {
            return null
        }

        // Check if it is a message
        if (dateTimeMatch && jsonMessageMatch) {
            let messageStr = jsonMessageMatch[1];
            // Convert single quotes to double quotes for valid parsing formatting
            messageStr = messageStr.replace(/'/g, '"');
            // Convert the boolean literals to lowercase for parsing compat.
            messageStr = messageStr.replace(/\b(True|False)\b/g, match => match.toLowerCase());

            try {
                const header: MessageHeader = this.castToMessageType(messageStr)

                let status = this.extractField(line, "Message")
                if (status && status=="validation not successful") {
                    status = "invalid " + this.extractField(line, "Issue:")
                }
                const sender = this.extractField(line, "Sender:")
                const receiver = this.extractField(line, "Receiver:")

                header.time = new Date(dateTimeMatch[1]);
                header.status = status ? status : ""
                header.sender = sender
                header.receiver = receiver

                return header;
            } catch (error) {
                console.error("Error parsing message JSON", error, "Line:", line);
            }
        } else if (dateTimeMatch) { // Check if it is a connection log
            const match = line.match(/Connection from '(.*?)' to S2-analyzer has closed./);
            if (match) {
                return {
                    time: new Date(dateTimeMatch[1]),
                    status: "",
                    sender: match[1],
                    receiver: null,
                    message_type: "Connection Lost",
                    message_id: null
                } as MessageHeader
            }
        }
        return null;
    }

    private extractField(line: string, fieldName: string): string | null {
        const regex = new RegExp(`${fieldName} ([^\\]]+)`);
        const match = line.match(regex);
        return match ? match[1].trim() : null;
    }

    private castToMessageType(messageStr: string) {
        const message = JSON.parse(messageStr);
        switch(message.message_type) {
            case "Handshake": return message as Handshake;
            case "HandshakeResponse": return message as HandshakeResponse;
            case "InstructionStatusUpdate": return message as InstructionStatusUpdate;
            case "PowerForecast": return message as PowerForecast;
            case "PowerMeasurement": return message as PowerMeasurement;
            case "ReceptionStatus": return message as ReceptionStatus;
            case "ResourceManagerDetails": return message as ResourceManagerDetails;
            case "RevokeObject": return message as RevokeObject;
            case "SelectControlType": return message as SelectControlType;
            case "SessionRequest": return message as SelectControlType;
            case "FRBC.ActuatorStatus": return message as ActuatorStatus;
            case "FRBC.FillLevelTargetProfile": return message as FillLevelTargetProfile;
            case "FRBC.Instruction": return message as Instruction;
            case "FRBC.LeakageBehaviour": return message as LeakageBehaviour;
            case "FRBC.StorageStatus": return message as StorageStatus;
            case "FRBC.SystemDescription": return message as SystemDescription;
            case "FRBC.TimerStatus": return message as TimerStatus;
            case "FRBC.UsageForecast": return message as UsageForecast;
            case null: return message as MessageHeader;
            default: throw new Error("Did not found matching message type interface for " +message.message_type.toString()+".");
        }
    }
}

// Create a singleton instance
const parser = new Parser();

// Export the instance
export { parser };