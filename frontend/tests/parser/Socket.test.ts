import WebSocketClient from "../../src/api/socket/Socket";

/**
 * Mocking WebSocket for using in unit tests
 */
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;

  public readyState: number = MockWebSocket.OPEN;
  public onopen: Function;
  public onmessage: Function;
  public onclose: Function;
  public onerror: Function;
  public send: Function = jest.fn();

  constructor(public url: string) {
    this.onopen = () => {};
    this.onmessage = () => {};
    this.onclose = () => {};
    this.onerror = () => {};
  }
}

/**
 * Unit testing for WebSocketClient class
 */
describe("WebSocketClient", () => {
  let client: WebSocketClient;
  const url = "ws://localhost:5000";

  // Mocking WebSocket and creating a new instance of WebSocketClient
  beforeEach(() => {
    global.WebSocket = MockWebSocket as any;
    client = new WebSocketClient(url);
  });

  // Clearing all mocks
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Unit testing for constructor
  describe("constructor", () => {
    // Unit test code: UT-69
    test("UT-69: should create a new instance of WebSocket and related properties", () => {
      expect(client).toBeInstanceOf(WebSocketClient);

      expect(client.ws).toBeDefined();
      expect(client.ws).toBeInstanceOf(MockWebSocket);

      expect(client.receivedMessages).toBeDefined();
      expect(client.receivedMessages).toBeInstanceOf(Set);

      expect(client.ws.url).toBe(url);
    });

    // Unit test code: UT-70
    test("UT-70: should define and set functions in constructor", () => {
      expect(client.ws.onopen).toBeDefined();
      expect(client.ws.onmessage).toBeDefined();
      expect(client.ws.onclose).toBeDefined();
      expect(client.ws.onerror).toBeDefined();
    });

    // Unit test code: UT-71
    test("UT-71: if onopen() function is called, should send `Hi from frontend` message and log a message", () => {
      const messageSent = jest.spyOn(client, "sendMessage");
      const logMessage = jest.spyOn(console, "log");

      expect(client.ws.onopen).toBeDefined();

      client.ws.onopen?.(new Event("OPEN"));

      expect(messageSent).toHaveBeenCalledTimes(1);
      expect(messageSent).toHaveBeenCalledWith("Hi from frontend");

      expect(logMessage).toHaveBeenCalledTimes(1);
      expect(logMessage).toHaveBeenCalledWith("WebSocket connection opened");
    });

    // Unit test code: UT-72
    test("UT-72: if onmessage() function is called, should send a log message and call onReceive()", () => {
      const logMessage = jest.spyOn(console, "log");
      const functionCalled = jest.spyOn(client, "onReceive");
      const dataReceived = `2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "Handshake", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}`;

      expect(client.ws.onmessage).toBeDefined();

      client.ws.onmessage?.({ data: dataReceived } as MessageEvent);

      expect(logMessage).toHaveBeenCalledTimes(2); // One for onmessage and one for onReceive
      expect(logMessage).toHaveBeenCalledWith("Receiving message");
      expect(logMessage).toHaveBeenCalledWith(
        "Parsing message:" + dataReceived
      );

      expect(functionCalled).toHaveBeenCalledTimes(1);
      expect(functionCalled).toHaveBeenCalledWith(dataReceived);
    });

    // Unit test code: UT-73
    test("UT-73: if onclose() function is called, should send a log message", () => {
      const logMessage = jest.spyOn(console, "log");

      expect(client.ws.onclose).toBeDefined();

      client.ws.onclose?.(new Event("CLOSED") as CloseEvent);

      expect(logMessage).toHaveBeenCalledTimes(1);
      expect(logMessage).toHaveBeenCalledWith("WebSocket connection closed");
    });

    // Unit test code: UT-74
    test("UT-74: if onerror() function is called, should send an error message", () => {
      const errorMessage = jest.spyOn(console, "error");
      const errorEvent = new Event("Error happened");

      expect(client.ws.onerror).toBeDefined();

      client.ws.onerror?.(errorEvent);

      expect(errorMessage).toHaveBeenCalledTimes(1);
      expect(errorMessage).toHaveBeenCalledWith("WebSocket error:", errorEvent);
    });
  });

  // Unit testing for onReceive() function
  describe("onReceive()", () => {
    // Clearing the receivedMessages set after each test
    afterEach(() => {
      client.receivedMessages.clear();
    });

    // Unit test code: UT-75
    test("UT-75: should ignore duplicated messages and return null and a log message", () => {
      // Two identical messages
      const message1 = `2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "Handshake", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}`;
      const message2 = `2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "Handshake", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}`;

      const logMessage = jest.spyOn(console, "log");

      client.onReceive(message1);
      expect(client.receivedMessages.size).toBe(1);
      expect(client.receivedMessages).toContainEqual(message1);

      client.onReceive(message2);
      expect(client.receivedMessages.size).toBe(1);

      expect(logMessage).toHaveBeenCalledTimes(2); // One for message1 with parsing and one for message2 with duplicate message
      expect(logMessage).toHaveBeenCalledWith("Parsing message:" + message1);
      expect(logMessage).toHaveBeenCalledWith(
        "Duplicate message received, ignoring:",
        message2
      );
    });

    // Unit test code: UT-76
    test("UT-76: should parse the message and add it to receivedMessages", () => {
      const message1 = `2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "Handshake", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}`;
      const logMessage = jest.spyOn(console, "log");

      client.onReceive(message1);
      expect(client.receivedMessages.size).toBe(1);
      expect(client.receivedMessages).toContainEqual(message1);

      expect(logMessage).toHaveBeenCalledTimes(1);
      expect(logMessage).toHaveBeenCalledWith("Parsing message:" + message1);
    });
  });

  // Unit testing for sendMessage() function
  describe("sendMessage()", () => {
    // Unit test code: UT-77
    test("UT-77: if WebSocket's readyState is OPEN, should send the message", () => {
      const message1 = "Hi from frontend";

      expect(client.ws.readyState).toBe(MockWebSocket.OPEN);
      expect(client.sendMessage).toBeDefined();

      client.sendMessage(message1);
      expect(client.ws.send).toHaveBeenCalledTimes(1);
    });

    // Unit test code: UT-78
    test("UT-78: if WebSocket's readyState is CLOSED, should log a warning message", () => {
      const message1 = "Hi from frontend";
      const warningMessage = jest.spyOn(console, "warn");

      // Changing the readyState to CLOSED
      expect(client.ws.readyState).toBe(MockWebSocket.OPEN);
      Object.defineProperty(client.ws, "readyState", {
        value: MockWebSocket.CLOSED,
      });
      expect(client.ws.readyState).toBe(MockWebSocket.CLOSED);

      client.sendMessage(message1);
      expect(warningMessage).toHaveBeenCalledTimes(1);
      expect(warningMessage).toHaveBeenCalledWith(
        "WebSocket is not open. Ready state:",
        MockWebSocket.CLOSED
      );
    });
  });
});
