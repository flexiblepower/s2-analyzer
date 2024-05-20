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
            this.sendMessage('Hi from frontend'); // Needed for socket to know frontend messages can be sent.
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

    /*
    * Function to handle the received data from the websocket
    */
    private onReceive(data: any): void {
        const message = data.toString();
        if (this.receivedMessages.has(message)) {
            console.log('Duplicate message received, ignoring:', message);
            return;
        }
        this.receivedMessages.add(message);
        try {
            console.log("Parsing message:" + message);
            parser.addLine(message);
            parser.parse(message);
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
