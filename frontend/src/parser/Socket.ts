import { parser } from './Parser';  // Importing the parse function from Parser.ts

/**
 * Websocket class to connect to the python intermediary websocket server.
 */
class WebSocketClient {
    private receivedMessages: Set<string>;
    private ws: WebSocket;
    constructor(url: string) {
        this.ws = new WebSocket(url);
        this.receivedMessages = new Set<string>();
        this.ws.onopen = () => {
            console.log('WebSocket connection opened');
        };

        this.ws.onmessage = (event: MessageEvent) => {
            console.log('Recieving message');
            this.onReceive(event.data);
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        this.ws.onerror = (event: Event) => {
            console.error('WebSocket error:', event);
        };
    }

    /**
     * Hacky workaround to get a timestamp so messages can be parsed, 
     * since the backend doesn't send them by default. TO BE DONE!
     */
    private getCurrentTimestamp(): string {
        const now = new Date();
        return now.toISOString().replace('T', ' ').substring(0, 19); // Format: YYYY-MM-DD HH:MM:SS
    }

    /*
    * Function to handle the received data from the websocket
    */
    private onReceive(data: any): void {
        const message = data.toString();
        if (this.receivedMessages.has(message)) {
            // For some reason in testing, the same message is received twice.... 
            // We will have to check this in detail. TO BE DONE!
            console.log('Duplicate message received, ignoring:', message);
            return;
        }
        this.receivedMessages.add(message);
        const timestamp = this.getCurrentTimestamp();
        const timestampedMessage = `${timestamp} ${message}`;
        try {
            console.log("Parsing message");
            parser.addLine(timestampedMessage);
            parser.parse(timestampedMessage);
        } catch (error) {
            console.error('Error parsing data:', error);
        }
    }

    public sendMessage(message: string): void {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            console.warn('WebSocket is not open. Ready state:', this.ws.readyState);
        }
    }
}

export default WebSocketClient;
