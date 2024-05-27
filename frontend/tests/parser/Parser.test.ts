import { Parser } from "../../src/parser/Parser";

/**
 * Unit tests for the Parser.
 */
describe("Parser", () => {
    let parser : Parser;

    // Creating a new parser for each test
    beforeEach(() => {
        parser = new Parser();
    });

    // Unit testing for the addLine() function
    describe("addLine", () => {

       // Unit test code: UT-01 
       test("UT-01: should append a newline character if missing to the end of the string", () => {
            const line = "Testing line without newline";
            parser.addLine(line);
            expect(parser.getLines().endsWith("\n")).toBe(true);
       })

       // Unit test code: UT-02
       test("UT-02: should not append a newline character if there is newline character already", () => {
            const line = "Testing line with newline\n";
            parser.addLine(line);
            expect(parser.getLines().endsWith("\n")).toBe(true);
       })

       // Unit test code: UT-03
       test("UT-03: should append the line to the bufferedLines when paused", () => {
            parser.setPause(true);
            expect(parser.getLines()).toBe("");
            parser.addLine("Line1");
            expect(parser.bufferedLines).toBe("Line1");
            parser.addLine("Line2");
            expect(parser.bufferedLines).toBe("Line1Line2");
            expect(parser.getLines()).toBe("");
       });

       // Unit test code: UT-04
       test("UT-04: should append the line to the lines when not paused and length of bufferedLines are bigger than 0", () => {
            parser.setPause(true);
            parser.addLine("Line1");
            parser.setPause(false);
            parser.addLine("Line2");
            expect(parser.getLines()).toBe("Line1Line2\n");
            parser.addLine("Line3");
            expect(parser.getLines()).toBe("Line1Line2\nLine3\n");
            expect(parser.bufferedLines).toBe("");
       });

       // Unit test code: UT-05
       test("UT-05: should append the line to the lines when not paused and length of bufferedLines are less or equal than 0", () => {
            parser.setPause(false);
            parser.addLine("Line1");
            expect(parser.getLines()).toBe("Line1\n");
            parser.addLine("Line2");
            expect(parser.getLines()).toBe("Line1\nLine2\n");
       });
    });

    // Unit testing for getLines() function
    describe("getLines", () => {

        // Unit test code: UT-06
        test("UT-06: should return empty string", () => {
            expect(parser.getLines()).toBe("");
        });

        // Unit test code: UT-07
        test("UT-07: should return the lines that added", () => {
            parser.addLine("Line1");
            expect(parser.getLines()).toBe("Line1\n");
            parser.addLine("Line2");
            expect(parser.getLines()).toBe("Line1\nLine2\n");
        });
    });

    // Unit testing for getErrors() function
    describe("getErrors", () => {

        // Unit test code: UT-08
        test("UT-08: should not return any errors", () => {
            expect(parser.getErrors()).toBeNull;
        });

        // Unit test code: UT-09
        test("UT-09: should return some errors", () => {
            parser.errors.push("Error1");
            expect(parser.getErrors()).toEqual(["Error1"]);
            parser.errors.push("Error2");
            expect(parser.getErrors()).toEqual(["Error1", "Error2"]);
        });
    });

    // Unit testing for getIsPaused() function
    describe("getIsPaused", () => {

        // Unit test code: UT-10
        test("UT-10: should return false (not paused)", () => {
            expect(parser.getIsPaused()).toBe(false);
        });

        // Unit test code: UT-11
        test("UT-11: should return true (paused)", () => {
            expect(parser.getIsPaused()).toBe(false);
            parser.setPause(true);
            expect(parser.getIsPaused()).toBe(true);
        });
    });

    // Unit testing for setPause() function
    describe("setPause", () => {

        // Unit test code: UT-12
        test("UT-12: should set the isPaused value to false", ()=> {
            const booleanValue = false;
            parser.setPause(booleanValue);
            expect(parser.getIsPaused()).toBe(false);
        });

        // Unit test code: UT-13
        test("UT-13: should set the isPaused value to true", () => {
            const booleanValue = true;
            parser.setPause(booleanValue);
            expect(parser.getIsPaused()).toBe(true);
        });

        // Unit test code: UT-14
        test("UT-14: should be able to change the value of isPaused always",() => {
            const booleanValue1 = true;
            parser.setPause(booleanValue1);
            expect(parser.getIsPaused()).toBe(true);
            const booleanValue2 = false;
            parser.setPause(booleanValue2);
            expect(parser.getIsPaused()).toBe(false);
            const booleanValue3 = true;
            parser.setPause(booleanValue3);
            expect(parser.getIsPaused()).toBe(true);
        });

    });

    // Unit testing for getMessages() function
    describe("getMessages", () => {

        // Creating messageMap for following tests
        beforeEach(() => {
            parser.messageMap = [];
        });
        
        // Unit test code: UT-15
        test("UT-15: should return an empty array", () => {
            expect(parser.getMessages()).toBeNull;
        });

        // Unit test code: UT-16
        test("UT-16: should identify subject_message_id and does not put it in messageMap", () => {
            const message1 =
                {
                    time: new Date(),
                    status: "subject_message_id",
                    sender: "CM",
                    receiver: "REM",
                    message_type: "Handshake",
                    message_id: "message_id",
                    subject_message_id: "message_id101"
                };
            
            parser.messageMap.push(message1);
            expect(parser.getMessages()).not.toContainEqual(message1);
        });

        // Unit test code: UT-17
        test("UT-17: should be able to change the status of the message if the message has subject_message_id", () => {
            const message1 = {
                time: new Date(),
                status: "subject_message_id",
                sender: "CM",
                receiver: "REM",
                message_type: "ReceptionStatus",
                message_id: "message_id",
                subject_message_id: "message_id101123Ab_C!456"
            };

            const message2 ={
                time: new Date(),
                status: "different_status",
                sender: "REM",
                receiver: "CM",
                message_type: "Handshake",
                message_id: "message_id101123Ab_C!456",
            };

            parser.messageMap.push(message1);

            // Checking the message1 is not in the messageMap
            expect(parser.getMessages()).not.toContainEqual(message1);

            parser.messageMap.push(message2);

            // Checking the message2 is in the messageMap
            expect(parser.getMessages()).toContainEqual(message2);

            // Checking the change of status of the message2
            expect(parser.getMessages()).toContainEqual(parser.messageMap.find((message) => message.status === message1 && message.message_id === message2.message_id));
        });

        // Unit test code: UT-18
        test("UT-18: should identify object_id and put it in messageMap", () => {
            const message1 = {
                time: new Date(),
                status: "object_id",
                sender: "CM",
                receiver: "REM",
                message_type: "Handshake",
                message_id: "message_id",
                object_id: "object_id101"
            };

            parser.messageMap.push(message1);
            expect(parser.getMessages()).toContainEqual(message1);
        });

        // Unit test code: UT-19
        test("UT-19: should be able to change the statuse of the message if the message has object_id", () => {
            const message1 = {
                time: new Date(),
                status: "object_id",
                sender: "CM",
                receiver: "REM",
                message_type: "RevokeObject",
                message_id: "messageid101",
                object_id: "abc123543434"
            };

            const message2 = {
                time: new Date(),
                status: "different_status",
                sender: "REM",
                receiver: "CM",
                message_type: "HandshakeResponse",
                message_id: "abc123543434",
            };

            parser.messageMap.push(message1);

            // Checking the message1 is in the messageMap
            expect(parser.getMessages()).toContainEqual(message1);

            parser.messageMap.push(message2);

            // Checking the message2 is in the messageMap

            expect(parser.getMessages()).toContainEqual(message2);

            // Checking the change of status of the message2
            expect(parser.getMessages()).toContainEqual(parser.messageMap.find((message) => (message.status === "revoked by message_id: " + message1.message_id) && message.message_id === message2.message_id));
        });
    });


    // Unit testing for parseLogFile function
    describe("parseLogFile", () => {

        global.window = { showOpenFilePicker: jest.fn() } as unknown as Window & typeof globalThis;

        // Mocking the parse() function
        beforeEach(() => {
            parser.parse = jest.fn();
        });

        // Unit test code: UT-20
        test("UT-20: should call the parse function for each line", async () => {
            const fileHandles = [
                { getFile: jest.fn().mockResolvedValue({ text: jest.fn().mockResolvedValue("Line1\nLine2\n") }) },
                { getFile: jest.fn().mockResolvedValue({ text: jest.fn().mockResolvedValue("Line3\nLine4\nLine5\n") }) }
            ];

            window.showOpenFilePicker = jest.fn().mockResolvedValue(fileHandles);

            await parser.parseLogFile();

            expect(window.showOpenFilePicker).toHaveBeenCalled();
            expect(fileHandles[0].getFile).toHaveBeenCalled();
            expect(fileHandles[1].getFile).toHaveBeenCalled();
            expect(parser.parse).toHaveBeenCalledTimes(2);      
            expect(parser.parse).toHaveBeenCalledWith("Line1\nLine2\n");
            expect(parser.parse).toHaveBeenCalledWith("Line3\nLine4\nLine5\n");      
        });

        // Unit test code: UT-21
        test("UT-21: should return the messages from getMessages", async () => {

            const message1 = {
            time: new Date(),
            status: "received",
            sender: "CM",
            receiver: "REM",
            message_type: "Handshake",
            message_id: "message_id101",
            };
            
            const message2 = {
            time: new Date(),
            status: "received",
            sender: "REM",
            receiver: "CM",
            message_type: "HandshakeResponse",
            message_id: "message_id102",
            };

            const fileHandles = [
            { getFile: jest.fn().mockResolvedValue({ text: jest.fn().mockResolvedValue(JSON.stringify(message1)) }) },
            { getFile: jest.fn().mockResolvedValue({ text: jest.fn().mockResolvedValue(JSON.stringify(message2)) }) }
            ];

            window.showOpenFilePicker = jest.fn().mockResolvedValue(fileHandles);
            parser.getMessages = jest.fn().mockReturnValue([message1, message2]);

            const parseLogFile = await parser.parseLogFile();

            expect(parseLogFile).toEqual([message1, message2]);
        });
    });

    // Unit testing for parse function
    describe("parse",() => {

        // Creating messageMap and bufferedMessages for following tests
        beforeEach(() => {
            parser.messageMap = [];
            //parser.bufferedMessages = [];
        });

        // Unit test code: UT-22
        test("UT-22: should return null for empty string", () => {
            const contents = "";
            parser.parse(contents);
            expect(parser.getMessages()).toBeNull;
        });

        // Unit test code: UT-23
        test("UT-23: should return null for string without message that only contains newline", () => {
            const contents = "\n";
            parser.parse(contents);
            expect(parser.getMessages()).toBeNull;
        });

        // Unit test code: UT-24
        test("UT-24: should return null for string without message that only contains newline and spaces", () => {
            const contents = " \n  \n\n    \n\n ";
            parser.parse(contents);
            expect(parser.getMessages()).toBeNull;
        });

        // Unit test code: UT-25
        test("UT-25: if isPaused true, should append the message to the bufferedMessages", () =>{

            const message1 = `2024-05-28 08:00:00 Message: {"sender":"CEM cem_mock","receiver":"RM battery1","message_type":"HandshakeResponse","message_id":"ae1b9d1c-c5ca-4ea7-aeb7-6521aa26a382"}\n`

            const message1Parsed = {
                message_type: "HandshakeResponse",
                message_id: "ae1b9d1c-c5ca-4ea7-aeb7-6521aa26a382",
                time: new Date("2024-05-28 08:00:00"),
                status: "",
                sender: null,
                receiver: null
            };

            const contents = message1;
            parser.setPause(true);
            parser.parse(contents);
            expect(parser.getMessages()).toBeNull;
            expect(parser.bufferedMessages).toContainEqual(message1Parsed);
        });

        // Unit test code: UT-26
        test("UT-26: if isPaused false, should append the message to the messageMap", () =>{
            const message1 = `2024-05-28 08:00:00 Message: {"sender":"CEM cem_mock","receiver":"RM battery1","message_type":"HandshakeResponse","message_id":"ae1b9d1c-c5ca-4ea7-aeb7-6521aa26a382"}\n`

            const message1Parsed = {
                message_type: "HandshakeResponse",
                message_id: "ae1b9d1c-c5ca-4ea7-aeb7-6521aa26a382",
                time: new Date("2024-05-28 08:00:00"),
                status: "",
                sender: null,
                receiver: null
            };

            const contents = message1;
            parser.parse(contents);
            expect(parser.getMessages()).toContainEqual(message1Parsed);
            expect(parser.bufferedMessages).toBeNull;
        });

        // Unit test code: UT-27
        test("UT-27: should detect duplicates and append the latest message to the messageMap", () => {
            const message1 = `2024-05-28 08:00:00 Message: {"sender":"CEM cem_mock","receiver":"RM battery1","message_type":"HandshakeResponse","message_id":"ae1b9d1c-c5ca-4ea7-aeb7-6521aa26a382"}\n`

            const message1Parsed = {
                message_type: "HandshakeResponse",
                message_id: "ae1b9d1c-c5ca-4ea7-aeb7-6521aa26a382",
                time: new Date("2024-05-28 08:00:00"),
                status: "",
                sender: null,
                receiver: null
            };

            const message2 = `2024-05-28 08:00:00 Message: {"sender":"RM battery1","receiver":"CEM cem_mock","message_type":"Handshake","message_id":"ae1b9d1c-c5ca-4ea7-aeb7-6521aa26a382"}\n`;

            const message2Parsed = {
                message_type: "Handshake",
                message_id: "ae1b9d1c-c5ca-4ea7-aeb7-6521aa26a382",
                time: new Date("2024-05-28 08:00:00"),
                status: "",
                sender: null,
                receiver: null
            };

            const contents = message1 + message2;
            parser.parse(contents);
            expect(parser.getMessages()).toContainEqual(message2Parsed);
            expect(parser.getMessages()).not.toContainEqual(message1Parsed);
        });

        // Unit test code: UT-28
        test("UT-28: should be able to parse multiple messages", () => {
            const message1 = `2024-05-28 08:00:00 Message: {"sender":"CEM cem_mock","receiver":"RM battery1","message_type":"HandshakeResponse","message_id":"ae1b9d1c-c5ca-4ea7-aeb7-6521aa26a382"}\n`

            const message1Parsed = {
                message_type: "HandshakeResponse",
                message_id: "ae1b9d1c-c5ca-4ea7-aeb7-6521aa26a382",
                time: new Date("2024-05-28 08:00:00"),
                status: "",
                sender: null,
                receiver: null
            };

            const message2 = `2024-05-28 08:00:00 Message: {"sender":"RM battery1","receiver":"CEM cem_mock","message_type":"Handshake","message_id":"ae1b9d1c-c5ca-4ea7-aeb7"}\n`;

            const message2Parsed = {
                message_type: "Handshake",
                message_id: "ae1b9d1c-c5ca-4ea7-aeb7",
                time: new Date("2024-05-28 08:00:00"),
                status: "",
                sender: null,
                receiver: null
            };

            const contents = message1 + message2;
            parser.parse(contents);
            expect(parser.getMessages()).toContainEqual(message1Parsed);
            expect(parser.getMessages()).toContainEqual(message2Parsed);
        });

        // Unit test code: UT-29
        test("UT-29: if the length of the bufferedMessages is bigger than 0, should empty the array and push messages to messageMap", () => {
            const message1 = `2024-05-28 08:00:00 Message: {"sender":"CEM cem_mock","receiver":"RM battery1","message_type":"HandshakeResponse","message_id":"ae1b9d1c-c5ca-4ea7-aeb7-6521aa26a382"}\n`

            const message1Parsed = {
                message_type: "HandshakeResponse",
                message_id: "ae1b9d1c-c5ca-4ea7-aeb7-6521aa26a382",
                time: new Date("2024-05-28 08:00:00"),
                status: "",
                sender: null,
                receiver: null
            };

            const message2 = `2024-05-28 08:00:00 Message: {"sender":"RM battery1","receiver":"CEM cem_mock","message_type":"Handshake","message_id":"ae1b9d1c-c5ca-4ea7-aeb7"}\n`;

            const message2Parsed = {
                message_type: "Handshake",
                message_id: "ae1b9d1c-c5ca-4ea7-aeb7",
                time: new Date("2024-05-28 08:00:00"),
                status: "",
                sender: null,
                receiver: null
            };

            const contents = message1;
            parser.setPause(true);
            parser.parse(contents);
            expect(parser.getMessages()).toBeNull;
            expect(parser.bufferedMessages).toContainEqual(message1Parsed);

            parser.setPause(false);
            const contents2 = message2;
            parser.parse(contents2);
            expect(parser.bufferedMessages).toBeNull;
            expect(parser.getMessages()).toContainEqual(message1Parsed);
            expect(parser.getMessages()).toContainEqual(message2Parsed);
        });
    });


    // Unit testing for emptyBufferedMessages function
    describe("emptyBufferedMessages", () => {

        // Creating bufferedMessages for following tests
        beforeEach(() => {
            parser.bufferedMessages = [];
            parser.messageMap = [];
        });

        // Unit test code: UT-30
        test("UT-30: should return an empty array for bufferedMessages and messageMap", () => {
            parser.emptyBufferedMessages();
            expect(parser.bufferedMessages).toEqual([]);
            expect(parser.messageMap).toEqual([]);
        });

        // Unit test code: UT-31
        test("UT-31: should return an empty array for bufferedMessages and put messages into messageMap", () => {
            const message1 = {
                time: new Date(),
                status: "buffered",
                sender: "CM",
                receiver: "REM",
                message_type: "Handshake",
                message_id: "message_id101",
            };

            const message2 = {
                time: new Date(),
                status: "buffered",
                sender: "REM",
                receiver: "CM",
                message_type: "HandshakeResponse",
                message_id: "message_id102",
            };

            parser.bufferedMessages.push(message1);
            expect(parser.bufferedMessages).toEqual([message1]);

            parser.bufferedMessages.push(message2);
            expect(parser.bufferedMessages).toEqual([message1, message2]);

            expect(parser.messageMap).toEqual([]);

            parser.emptyBufferedMessages();
            expect(parser.bufferedMessages).toEqual([]);
            expect(parser.messageMap).toEqual([message1, message2]);
        });

        // Unit test code: UT-32
        test("UT-32: should return an empty array for bufferedMessages and put messages into messageMap without duplicates", () => {
            const message1 = {
                time: new Date(),
                status: "buffered",
                sender: "CM",
                receiver: "REM",
                message_type: "Handshake",
                message_id: "message_id101",
            };

            const message2 = {
                time: new Date(),
                status: "buffered",
                sender: "CM",
                receiver: "REM",
                message_type: "different_Handshake",
                message_id: "message_id101",
            };

            parser.bufferedMessages.push(message1);
            expect(parser.bufferedMessages).toEqual([message1]);

            parser.bufferedMessages.push(message2);
            expect(parser.bufferedMessages).toEqual([message1, message2]);

            parser.emptyBufferedMessages();
            expect(parser.bufferedMessages).toEqual([]);
            expect(parser.messageMap).toEqual([message2]);
        });
    });
});
    



    