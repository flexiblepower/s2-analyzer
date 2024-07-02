import MessageHeader from "../models/messages/messageHeader";
import Handshake from "../models/messages/handshake.ts";
import HandshakeResponse from "../models/messages/handshakeResponse.ts";
import InstructionStatusUpdate from "../models/messages/instructionStatusUpdate.ts";
import PowerForecast from "../models/messages/powerForecast.ts";
import PowerMeasurement from "../models/messages/powerMeasurement.ts";
import ReceptionStatus from "../models/dataStructures/receptionStatus.ts";
import ResourceManagerDetails from "../models/messages/resourceManagerDetails.ts";
import RevokeObject from "../models/messages/revokeObject.ts";
import SelectControlType from "../models/messages/selectControlType.ts";
import ActuatorStatus from "../models/messages/frbc/actuatorStatus.ts";
import FillLevelTargetProfile from "../models/messages/frbc/fillLevelTargetProfile.ts";
import Instruction from "../models/messages/frbc/instruction.ts";
import LeakageBehaviour from "../models/messages/frbc/leakageBehaviour.ts";
import StorageStatus from "../models/messages/frbc/storageStatus.ts";
import SystemDescription from "../models/messages/frbc/systemDescription.ts";
import TimerStatus from "../models/messages/frbc/timerStatus.ts";
import UsageForecast from "../models/messages/frbc/usageForecast.ts";
import SessionRequest from "../models/messages/sessionRequest.ts";

export class Parser {
  public messageMap: MessageHeader[] = [];
  public lines: string = "";
  public errors: string[] = [];
  public isPaused: boolean = false;
  public bufferedMessages: MessageHeader[] = [];
  public bufferedLines: string = "";

  /**
   * Adds a line to the log, buffering if paused
   * @param m - The line to add
   */
  addLine(m: string) {
    const m_temp = m.charAt(m.length - 1) == "\n" ? m : m.concat("\n");
    if (this.isPaused) {
      this.bufferedLines = this.bufferedLines.concat(m_temp);
    } else {
      if (this.bufferedLines.length > 0) {
        this.lines = this.lines.concat(this.bufferedLines);
        this.bufferedLines = "";
      }
      this.lines = this.lines.concat(m_temp);
    }
  }

  /**
   * Returns the current lines
   * @returns The lines
   */
  getLines() {
    return this.lines;
  }

  /**
   * Returns the current errors array ecountered during parsing
   * @returns The errors array
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Returns the current paused state
   * @returns The paused state
   */
  getIsPaused() {
    return this.isPaused;
  }

  /**
   * Sets the paused state
   * @param b - The new paused state
   */
  setPause(b: boolean) {
    this.isPaused = b;
  }

  /**
   * Processes the parsed message map and updates message statuses if needed
   * @returns The processed message map
   */
  getMessages() {
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
            this.messageMap[j].status =
              "revoked by message_id: " + this.messageMap[i].message_id;
          }
        }
      }
    }
    return this.messageMap
      .filter((m) => !("subject_message_id" in m))
      .reverse();
  }

  /**
   * Parses log files selected by the user
   * @returns The processed messages
   */
  async parseLogFile() {
    const fileHandles = await window.showOpenFilePicker({ multiple: true });
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

  /**
   * Parses the provided content string and extracts headers
   * @param contents - The content to parse
   */
  public parse(contents: string) {
    const lines = contents.split("\n");
    lines.forEach((line, i) => {
      const header = this.extractHeader(line, i);
      if (header) {
        if (this.isPaused) {
          this.bufferedMessages.push(header);
        } else if (!this.removeDuplicates(header)) {
          if (this.bufferedMessages.length > 0) this.emptyBufferedMessages();
          this.messageMap.push(header);
        }
      }
    });
  }

  /**
   * Adds buffered messages to the message map if they are not duplicates
   */
  public emptyBufferedMessages() {
    for (let i = 0; i < this.bufferedMessages.length; i++) {
      if (!this.removeDuplicates(this.bufferedMessages[i])) {
        this.messageMap.push(this.bufferedMessages[i]);
      }
    }
    this.bufferedMessages = [];
  }

  /**
   * Removes duplicates from the message map based on message id
   * @param header - The header to check for duplicates
   * @returns True if a duplicate was found and removed, false otherwise
   */
  public removeDuplicates(header: MessageHeader) {
    for (let i = 0; i < this.messageMap.length; i++) {
      if (
        this.messageMap[i].message_id &&
        this.messageMap[i].message_id == header.message_id
      ) {
        if (this.messageMap[i].status.toString().includes("invalid"))
          return true;
        this.messageMap[i] = header;
        return true;
      }
    }
    return false;
  }

  /**
   * Extracts the header from a log line
   * @param line - The line to extract the header from
   * @param i - The line index
   * @returns The extracted header or null if extraction failed
   */
  public extractHeader(line: string, i: number): MessageHeader | null {
    const dateTimeMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    // Extracting JSON message after ensuring it's properly formatted
    const jsonMessageMatch = line.match(/Message: (\{.*\})/s); // 's' flag for capturing multiline JSON
    if (this.extractField(line, "Message") == "forwarded") {
      return null;
    }

    // Check if it is a message
    if (dateTimeMatch && jsonMessageMatch) {
      let messageStr = jsonMessageMatch[1];
      // Convert single quotes to double quotes for valid parsing formatting
      messageStr = messageStr.replace(/'/g, '"');
      // Convert the boolean literals to lowercase for parsing compat.
      messageStr = messageStr.replace(/\b(True|False)\b/g, (match) =>
        match.toLowerCase()
      );

      try {
        const header: MessageHeader | null = this.castToMessageType(
          messageStr,
          i
        );
        if (header == null) return null;

        let status = this.extractField(line, "Message");
        if (status && status == "validation not successful") {
          status = "invalid " + this.extractField(line, "Issue:");
        }
        const sender = this.extractField(line, "Sender:");
        const receiver = this.extractField(line, "Receiver:");

        header.time = new Date(dateTimeMatch[1]);
        header.status = status ? status : "";
        header.sender = sender;
        header.receiver = receiver;

        return header;
      } catch (error) {
        this.errors.push(
          i +
            '. Error parsing message JSON: "' +
            error +
            '"\n at line: "' +
            line +
            '"'
        );
      }
    } else if (dateTimeMatch) {
      // Check if it is a connection log
      return this.parseBackendLog(line, dateTimeMatch[1]);
    }
    this.errors.push(
      i + '. Line did not contribute to any object: "' + line + '"'
    );
    return null;
  }

  /**
   * Parses backend log lines
   * @param line - The line to parse
   * @param time - The time extracted from the line
   * @returns The parsed MessageHeader or null
   */
  public parseBackendLog(line: string, time: string) {
    const match = line.match(
      /Connection from '(.*?)' to S2-analyzer has closed./
    );
    if (match) {
      return {
        time: new Date(time),
        status: "",
        sender:
          (match[1].toUpperCase().includes("CEM") ? "CEM " : "RM ") + match[1],
        receiver: null,
        message_type: "Connection Lost",
        message_id: null,
      } as MessageHeader;
    }
    return null;
  }

  /**
   * Extracts a specific field from a line
   * @param line The line to extract from
   * @param fieldName The name of the field to extract
   * @returns The extracted field value if found, otherwise null
   */
  public extractField(line: string, fieldName: string): string | null {
    const regex = new RegExp(`${fieldName} ([^\\]]+)`);
    const match = line.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Casts a JSON message string to a specific message type based on the message_type field
   * @param messageStr The JSON string representing the message
   * @param i The index of the message
   * @returns The parsed message object of the corresponding message type, or null if no matching type is found
   */
  public castToMessageType(messageStr: string, i: number) {
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
        this.errors.push(
          i +
            ". Did not find a matching message type interface for " +
            message.message_type.toString() +
            "."
        );
        return null;
    }
  }
}

// Create a singleton instance of the Parser class
const parser = new Parser();

// Export the singleton instance
export { parser };
