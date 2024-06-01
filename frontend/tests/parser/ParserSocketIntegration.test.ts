import WebSocketClient  from "../../src/parser/Socket";
import {Parser} from "../../src/parser/Parser";

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
 * Integration testing for WebSocketClient and Parser classes
 */
describe('WebSocketClient and Parser Integration', () => {
  let client: WebSocketClient;
  const url = 'ws://localhost:5000';

  // Mocking WebSocket and creating a new instance of WebSocketClient
  beforeEach(() => {
    global.WebSocket = MockWebSocket as any;
    client = new WebSocketClient(url);
    client.parser = new Parser();
  });

  // Clearing all mocks
  afterEach(() => {
    jest.clearAllMocks();
  });

  //Integration test for onReceive method
  describe("onReceive", () => {

    // Creating new messageMap and errors
    beforeEach(() => {
        client.parser.messageMap = [];
        client.parser.errors = [];
    });

    // Integration Test Code: IT-01
    test("IT-01: receive empty message and push it onto errors array", () => {
      const message1: string = "";

      client.onReceive(message1);
      expect(client.parser.errors.length).toBe(1);
    })

    // Integration Test Code: IT-02
    test("IT-02: should return the Handshake message type", () => {
        const messageString = '2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "Handshake", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}';
        
        const message ={
            "message_type": "Handshake",
            "message_id": "00ef6f72-257c-46a5-a656-07887903eb09",
            "role": "CEM",
            "sender": "CEM cem_mock",
            "receiver": "RM battery1",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-03
    test("IT-03: should return HandshakeResponse message type", () => {
        const messageString = '2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "HandshakeResponse", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}';
        
        const message ={
            "message_type": "HandshakeResponse",
            "message_id": "00ef6f72-257c-46a5-a656-07887903eb09",
            "role": "CEM",
            "sender": "CEM cem_mock",
            "receiver": "RM battery1",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-04
    test("IT-04: should return InstructionStatusUpdate message type", () => {
        const messageString = '2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "InstructionStatusUpdate", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}';
        
        const message ={
            "message_type": "InstructionStatusUpdate",
            "message_id": "00ef6f72-257c-46a5-a656-07887903eb09",
            "role": "CEM",
            "sender": "CEM cem_mock",
            "receiver": "RM battery1",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-05
    test("IT-05: should return PowerForecast message type", () => {
        const messageString = '2024-03-22 12:51:58 [Message received][Sender: RM battery2][Receiver: CEM cem_mock] Message: {"time":"2024-05-07T15:27:20.853Z","status":"forwarded","sender":"RM","receiver":"CEM","message_type":"PowerForecast","message_id":"edfafsafs3","start_time":"2024-05-07T15:27:20.853Z","elements":[{"duration":100,"power_values":[{"value_upper_limit":100,"value_upper_95PPR":90,"value_upper_68PPR":80,"value_expected":70,"value_lower_68PPR":60,"value_lower_95PPR":50,"value_lower_limit":60,"commodity_quantity":"ELECTRIC.POWER.L1"},{"value_upper_limit":110,"value_upper_95PPR":100,"value_upper_68PPR":90,"value_expected":80,"value_lower_68PPR":70,"value_lower_95PPR":60,"value_lower_limit":50,"commodity_quantity":"ELECTRIC.POWER.L2"},{"value_upper_limit":120,"value_upper_95PPR":110,"value_upper_68PPR":100,"value_expected":90,"value_lower_68PPR":80,"value_lower_95PPR":70,"value_lower_limit":60,"commodity_quantity":"ELECTRIC.POWER.L3"}]},{"duration":100,"power_values":[{"value_upper_limit":100,"value_upper_95PPR":90,"value_upper_68PPR":80,"value_expected":70,"value_lower_68PPR":60,"value_lower_95PPR":50,"value_lower_limit":60,"commodity_quantity":"ELECTRIC.POWER.L1"},{"value_upper_limit":110,"value_upper_95PPR":100,"value_upper_68PPR":90,"value_expected":50,"value_lower_68PPR":70,"value_lower_95PPR":60,"value_lower_limit":50,"commodity_quantity":"ELECTRIC.POWER.L2"},{"value_upper_limit":120,"value_upper_95PPR":110,"value_upper_68PPR":100,"value_expected":100,"value_lower_68PPR":80,"value_lower_95PPR":70,"value_lower_limit":60,"commodity_quantity":"ELECTRIC.POWER.L3"}]},{"duration":100,"power_values":[{"value_upper_limit":100,"value_upper_95PPR":90,"value_upper_68PPR":80,"value_expected":70,"value_lower_68PPR":60,"value_lower_95PPR":50,"value_lower_limit":60,"commodity_quantity":"ELECTRIC.POWER.L1"},{"value_upper_limit":110,"value_upper_95PPR":100,"value_upper_68PPR":90,"value_expected":80,"value_lower_68PPR":70,"value_lower_95PPR":60,"value_lower_limit":50,"commodity_quantity":"ELECTRIC.POWER.L2"},{"value_upper_limit":120,"value_upper_95PPR":110,"value_upper_68PPR":100,"value_expected":110,"value_lower_68PPR":80,"value_lower_95PPR":70,"value_lower_limit":60,"commodity_quantity":"ELECTRIC.POWER.L3"}]}]}';
        
        const message ={
            "message_type": "PowerForecast",
            "message_id": "edfafsafs3",
            "role": "RM battery2",
            "sender": "RM battery2",
            "receiver": "CEM cem_mock",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-06
    test("IT-06: should return PowerMeasurement message type", () => {
        const messageString = '2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "PowerMeasurement", "message_id": "46a5-a656-07887903eb09", "role": "CEM"}';
        
        const message ={
            "message_type": "PowerMeasurement",
            "message_id": "46a5-a656-07887903eb09",
            "role": "CEM",
            "sender": "CEM cem_mock",
            "receiver": "RM battery1",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-07
    test("IT-07: should return ReceptionStatus message type", () => {
        const messageString = '2024-03-22 12:50:53 [Message received][Sender: RM battery1][Receiver: CEM cem_mock] Message: {"message_type": "ReceptionStatus", "subject_message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "status": "OK"}';
        
        const message ={
            "message_type": "ReceptionStatus",
            "subject_message_id": "00ef6f72-257c-46a5-a656-07887903eb09",
            "role": "RM battery1",
            "sender": "RM battery1",
            "receiver": "CEM cem_mock",
            "status": "received",
            "time": "2024-03-22T11:50:53.000Z",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-08
    test("IT-08: should return ResourceManagerDetails message type", () => {
        const messageString = "2024-03-22 12:50:53 [Message buffered][Sender: RM battery1][Receiver: CEM cem_mock] Message: {'message_type': 'ResourceManagerDetails', 'message_id': '2d717c61-8500-4e8f-87a8-114b51acc08b', 'resource_id': '0309eaef-4fbb-4c9c-aa90-58bde4f4b07c', 'name': 'battery1', 'roles': [{'role': 'ENERGY_STORAGE', 'commodity': 'ELECTRICITY'}], 'manufacturer': 'APC', 'model': 'SMT500I', 'serial_number': 'kellox', 'firmware_version': '1.2.5', 'instruction_processing_delay': 100, 'available_control_types': ['FILL_RATE_BASED_CONTROL'], 'currency': 'EUR', 'provides_forecast': False, 'provides_power_measurement_types': ['ELECTRIC.POWER.L1']}";

        const message ={
            "message_type": "ResourceManagerDetails",
            "message_id": "2d717c61-8500-4e8f-87a8-114b51acc08b",
            "role": "RM battery1",
            "sender": "RM battery1",
            "receiver": "CEM cem_mock",
            "status": "buffered",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-09
    test("IT-09: should return RevokeObject message type", () => {
        const messageString = '2024-03-11 13:29:10 [Message received][Sender: RM battery1][Receiver: CEM cem_mock] Message: {"message_type": "RevokeObject", "message_id": "3fd3fd3", "object_type": "FRBC.Instruction", "object_id":"7dd55ca8-f15c-4cad-adf5-154d11a9a2e1"}'

        const message ={
            "message_type": "RevokeObject",
            "message_id": "3fd3fd3",
            "role": "RM battery1",
            "sender": "RM battery1",
            "receiver": "CEM cem_mock",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-10
    test("IT-10: should return SelectControlType message type", () => {
        const messageString = '2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "SelectControlType", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}';
        
        const message ={
            "message_type": "SelectControlType",
            "message_id": "00ef6f72-257c-46a5-a656-07887903eb09",
            "role": "CEM",
            "sender": "CEM cem_mock",
            "receiver": "RM battery1",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-11
    test("IT-11: should return SessionRequest message type", () => {
        const messageString = '2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "SessionRequest", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}';
        
        const message ={
            "message_type": "SessionRequest",
            "message_id": "00ef6f72-257c-46a5-a656-07887903eb09",
            "role": "CEM",
            "sender": "CEM cem_mock",
            "receiver": "RM battery1",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-12
    test("IT-12: should return FRBC.ActuatorStatus message type", () => {
        const messageString = '2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "FRBC.ActuatorStatus", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}';
        
        const message ={
            "message_type": "FRBC.ActuatorStatus",
            "message_id": "00ef6f72-257c-46a5-a656-07887903eb09",
            "role": "CEM",
            "sender": "CEM cem_mock",
            "receiver": "RM battery1",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-13
    test("IT-13: should return FRBC.FillLevelTargetProfile message type", () => {
        const messageString = '2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "FRBC.FillLevelTargetProfile", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}';
        
        const message ={
            "message_type": "FRBC.FillLevelTargetProfile",
            "message_id": "00ef6f72-257c-46a5-a656-07887903eb09",
            "role": "CEM",
            "sender": "CEM cem_mock",
            "receiver": "RM battery1",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-14
    test("IT-14: should return FRBC.Instruction message type", () => {
        const messageString = '2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "FRBC.Instruction", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}';
        
        const message ={
            "message_type": "FRBC.Instruction",
            "message_id": "00ef6f72-257c-46a5-a656-07887903eb09",
            "role": "CEM",
            "sender": "CEM cem_mock",
            "receiver": "RM battery1",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-15
    test("IT-15: should return FRBC.LeakageBehaviour message type", () => {
        const messageString = '2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "FRBC.LeakageBehaviour", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}';
        
        const message ={
            "message_type": "FRBC.LeakageBehaviour",
            "message_id": "00ef6f72-257c-46a5-a656-07887903eb09",
            "role": "CEM",
            "sender": "CEM cem_mock",
            "receiver": "RM battery1",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-16
    test("IT-16: should return FRBC.StorageStatus message type", () => {
        const messageString = '2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "FRBC.StorageStatus", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}';
        
        const message ={
            "message_type": "FRBC.StorageStatus",
            "message_id": "00ef6f72-257c-46a5-a656-07887903eb09",
            "role": "CEM",
            "sender": "CEM cem_mock",
            "receiver": "RM battery1",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-17
    test("IT-17: should return FRBC.SystemDescription message type", () => {
        const messageString = '2024-03-22 12:51:58 [Message received][Sender: RM battery2][Receiver: CEM cem_mock] Message: {"message_type":"FRBC.SystemDescription","message_id":"3","valid_from":"2024-05-14T00:58:51.284Z","storage":[{"diagnostic_label":"peos","fill_level_label":"peos","provides_leakage_behaviour":true,"provides_fill_level_target_profile":true,"provides_usage_forecast":false,"fill_level_range":{"start_of_range":5,"end_of_range":6}}],"actuators":[{"id":"main-actuator","diagnostic_label":null,"operation_modes":[{"abnormal_condition_only":false,"diagnostic_label":"Idle","elements":[{"running_costs":null,"fill_level_range":{"end_of_range":1,"start_of_range":0},"fill_rate":{"end_of_range":0,"start_of_range":0},"power_ranges":[{"commodity_quantity":"ELECTRIC.POWER.3_PHASE_SYMMETRIC","end_of_range":0,"start_of_range":0}]}],"id":"idle"},{"abnormal_condition_only":false,"diagnostic_label":"THP on","elements":[{"running_costs":null,"fill_level_range":{"end_of_range":0.4,"start_of_range":0},"fill_rate":{"end_of_range":0.009,"start_of_range":0.001},"power_ranges":[{"commodity_quantity":"ELECTRIC.POWER.3_PHASE_SYMMETRIC","end_of_range":11000,"start_of_range":4000}]},{"running_costs":null,"fill_level_range":{"end_of_range":0.8,"start_of_range":0.4},"fill_rate":{"end_of_range":0.005,"start_of_range":0.0003},"power_ranges":[{"commodity_quantity":"ELECTRIC.POWER.3_PHASE_SYMMETRIC","end_of_range":11000,"start_of_range":4000}]}],"id":"thp-on"},{"abnormal_condition_only":false,"diagnostic_label":"NES resistive heating on","elements":[{"running_costs":null,"fill_level_range":{"end_of_range":1,"start_of_range":0},"fill_rate":{"end_of_range":0.007,"start_of_range":0.003},"power_ranges":[{"commodity_quantity":"ELECTRIC.POWER.3_PHASE_SYMMETRIC","end_of_range":3700,"start_of_range":0}]}],"id":"nes-on"}],"supported_commodities":["ELECTRICITY"],"timers":[{"duration":600000,"id":"thp-turnon","diagnostic_label":null},{"duration":300000,"id":"thp-turnoff","diagnostic_label":null}],"transitions":[{"transition_costs":null,"abnormal_condition_only":false,"blocking_timers":[],"from":"idle","id":"59dbcd11-97fb-4756-99ed-bc6f3352456f","start_timers":[],"to":"nes-on","transition_duration":5000},{"transition_costs":null,"abnormal_condition_only":false,"blocking_timers":[],"from":"nes-on","id":"f886aea4-df79-434b-86d3-947168d09e09","start_timers":[],"to":"idle","transition_duration":1000},{"transition_costs":null,"abnormal_condition_only":false,"blocking_timers":["thp-turnoff"],"from":"idle","id":"b2af7b35-5556-443b-8827-7b169a6181a1","start_timers":["thp-turnon"],"to":"thp-on","transition_duration":120000},{"transition_costs":null,"abnormal_condition_only":false,"blocking_timers":["thp-turnon"],"from":"thp-on","id":"2ac8a766-76b3-44ba-9a91-ab9b375125a9","start_timers":["thp-turnoff"],"to":"idle","transition_duration":30000},{"transition_costs":null,"abnormal_condition_only":false,"blocking_timers":["thp-turnoff"],"from":"nes-on","id":"c53ec870-8fa5-42fc-886b-6d1bc51565b2","start_timers":["thp-turnon"],"to":"thp-on","transition_duration":120000},{"transition_costs":null,"abnormal_condition_only":false,"blocking_timers":["thp-turnon"],"from":"thp-on","id":"cd975bff-f1b0-462e-88ce-6f88d1984c1e","start_timers":["thp-turnoff"],"to":"nes-on","transition_duration":30000}]}]}';
        
        const message ={
            "message_type": "FRBC.SystemDescription",
            "message_id": "3",
            "role": "RM battery2",
            "sender": "RM battery2",
            "receiver": "CEM cem_mock",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-18
    test("IT-18: should return FRBC.TimerStatus message type", () => {
        const messageString = '2024-03-22 12:50:53 [Message received][Sender: CEM cem_mock][Receiver: RM battery1] Message: {"message_type": "FRBC.TimerStatus", "message_id": "00ef6f72-257c-46a5-a656-07887903eb09", "role": "CEM"}';
        
        const message ={
            "message_type": "FRBC.TimerStatus",
            "message_id": "00ef6f72-257c-46a5-a656-07887903eb09",
            "role": "CEM",
            "sender": "CEM cem_mock",
            "receiver": "RM battery1",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });

    // Integration Test Code: IT-19
    test("IT-19: should return FRBC.UsageForecast message type", () => {
        const messageString = '2024-03-22 12:51:58 [Message received][Sender: RM battery2][Receiver: CEM cem_mock] Message: {"time":"2024-05-07T15:27:57.957Z","status":"forwarded","sender":"RM","receiver":"CEM","message_type":"FRBC.UsageForecast","message_id":"edfafsafs4","start_time":"2024-05-07T15:27:57.957Z","elements":[{"duration":100,"usage_rate_upper_limit":120,"usage_rate_upper_95PPR":110,"usage_rate_upper_68PPR":100,"usage_rate_expected":110,"usage_rate_lower_68PPR":80,"usage_rate_lower_95PPR":70,"usage_rate_lower_limit":60},{"duration":100,"usage_rate_upper_limit":120,"usage_rate_upper_95PPR":110,"usage_rate_upper_68PPR":100,"usage_rate_expected":50,"usage_rate_lower_68PPR":80,"usage_rate_lower_95PPR":70,"usage_rate_lower_limit":60},{"duration":100,"usage_rate_upper_limit":120,"usage_rate_upper_95PPR":110,"usage_rate_upper_68PPR":100,"usage_rate_expected":60,"usage_rate_lower_68PPR":80,"usage_rate_lower_95PPR":70,"usage_rate_lower_limit":60},{"duration":100,"usage_rate_upper_limit":120,"usage_rate_upper_95PPR":110,"usage_rate_upper_68PPR":100,"usage_rate_expected":110,"usage_rate_lower_68PPR":80,"usage_rate_lower_95PPR":70,"usage_rate_lower_limit":60}]}';
        
        const message ={
            "message_type": "FRBC.UsageForecast",
            "message_id": "edfafsafs4",
            "role": "RM battery2",
            "sender": "RM battery2",
            "receiver": "CEM cem_mock",
            "status": "received",
        }
        
        const addLineFunction = jest.spyOn(client.parser, 'addLine');
        const parseFunction = jest.spyOn(client.parser, 'parse');

        client.onReceive(messageString);

        expect(addLineFunction).toHaveBeenCalledTimes(1);
        expect(parseFunction).toHaveBeenCalledTimes(1);

        expect(client.parser.messageMap.length).toBe(1);
        expect(client.parser.messageMap[0].message_type).toBe(message.message_type);
        expect(client.parser.errors.length).toBe(0);
    });
  });
});