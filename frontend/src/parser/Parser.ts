import MessageHeader from "../models/messageHeader";

export class Parser {
    private messageList: MessageHeader[] = [];

    //Allows you to select one or more files from the file system
    async getLogFile() {
        const fileHandles = await window.showOpenFilePicker({ multiple: true });
        for (const fileHandle of fileHandles) {
            const file = await fileHandle.getFile();
            const contents = await file.text();
            this.parse(contents);
        }  
    }

    getMessageList(): MessageHeader[] {
        return this.messageList;
    }
    
    parse(contents: string) {
        const lines = contents.split('\n');
        lines.forEach(line => {
            const header = this.extractHeader(line);
            if (header) {
                this.messageList.push(header);
                console.log(header);
            }
        });
    }

    private extractHeader(line: string): MessageHeader | null {
        const dateTimeMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
        const jsonMessageMatch = line.match(/Message: (\{.*\})/s); // 's' flag for capturing multiline JSON
    
        if (dateTimeMatch && jsonMessageMatch) {
            const time = new Date(dateTimeMatch[1]);
            let messageStr = jsonMessageMatch[1];
            messageStr = messageStr.replace(/'/g, '"');
            messageStr = messageStr.replace(/\b(True|False)\b/g, match => match.toLowerCase());
    
            try {
                const message = JSON.parse(messageStr);
    
                const header: MessageHeader = {
                    time,
                    status: null, // Status can be assigned as needed
                    sender: this.extractField(line, 'Sender'),
                    receiver: this.extractField(line, 'Receiver'),
                    message_type: message.message_type,
                    message_id: message.message_id
                };
                return header;
            } catch (error) {
                console.error("Error parsing message JSON", error, "Line:", line);
            }
        }
        return null;
    }
    
    private extractField(line: string, fieldName: string): string | null {
        const regex = new RegExp(`${fieldName}: ([^\\]]+)`);
        const match = line.match(regex);
        return match ? match[1].trim() : null;
    }    
}

// Create a singleton instance
const parser = new Parser();

// Export the instance
export { parser };
