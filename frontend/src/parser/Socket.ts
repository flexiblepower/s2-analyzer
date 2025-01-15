import {parser as parserSingleton} from "./Parser";

/**
 * Websocket class to connect to the python intermediary websocket server
 */
class WebSocketClient {
    public receivedMessages: Set<string>;
    public ws: WebSocket;
    public parser = parserSingleton;

    /**
     * Constructs a new WebSocketClient instance
     * @param url The URL to connect to
     */
    constructor(url: string) {
        // Initialize WebSocket connection
        this.ws = new WebSocket(url);
        // Initialize set to store received messages
        this.receivedMessages = new Set<string>();

        // Event handlers for WebSocket connection lifecycle
        this.ws.onopen = () => {
            // Send initial message to establish connection
            this.sendMessage("Hi from frontend");
            console.log("WebSocket connection opened");
        };

        this.ws.onmessage = (event: MessageEvent) => {
            this.onReceive(event.data);
        };

        this.ws.onclose = () => {
            console.log("WebSocket connection closed");
        };

        this.ws.onerror = (event: Event) => {
            console.error("WebSocket error:", event);
        };
    }

    /**
     * Handles the received data from the WebSocket
     * @param data The data received from the WebSocket
     */
    public onReceive(data: string): void {
        // Convert data to string
        const message = data.toString();
        // Check for duplicate messages
        if (this.receivedMessages.has(message)) {
            console.log("Duplicate message received, ignoring:", message);
            return;
        }

        this.receivedMessages.add(message);

        try {
            console.log("Parsing message:" + message);
            // Add and parse message using parser
            this.parser.addLine(message);
            this.parser.parse(message);
        } catch (error) {
            console.error("Error parsing data:", error);
        }
    }

    /**
     * Sends a message through the WebSocket connection
     * @param message The message to send
     */
    public sendMessage(message: string): void {
        // Check if WebSocket connection is open before sending message
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            console.warn("WebSocket is not open. Ready state:", this.ws.readyState);
        }
    }


    public close() {
        this.ws.close()
    }
}

export default WebSocketClient;
