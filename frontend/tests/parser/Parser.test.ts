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
       test("should append a newline character if missing to the end of the string", () => {
            const line = "Testing line without newline";
            parser.addLine(line);
            expect(parser.getLines().endsWith("\n")).toBe(true);
       })

       // Unit test code: UT-02
       test("should not append a newline character if there is newline character already", () => {
            const line = "Testing line with newline\n";
            parser.addLine(line);
            expect(parser.getLines().endsWith("\n")).toBe(true);
       })

       // Unit test code: UT-03
       test("should append the line to the bufferedLines when paused", () => {
            parser.setPause(true);
            expect(parser.getLines()).toBe("");
            parser.addLine("Line1");
            expect(parser.bufferedLines).toBe("Line1");
            parser.addLine("Line2");
            expect(parser.bufferedLines).toBe("Line1Line2");
            expect(parser.getLines()).toBe("");
       });

       // Unit test code: UT-04
       test("should append the line to the lines when not paused and length of bufferedLines are bigger than 0", () => {
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
       test("should append the line to the lines when not paused and length of bufferedLines are less or equal than 0", () => {
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
        test("should return empty string", () => {
            expect(parser.getLines()).toBe("");
        });

        // Unit test code: UT-07
        test("should return the lines that added", () => {
            parser.addLine("Line1");
            expect(parser.getLines()).toBe("Line1\n");
            parser.addLine("Line2");
            expect(parser.getLines()).toBe("Line1\nLine2\n");
        });
    });

    // Unit testing for getErrors() function
    describe("getErrors", () => {

        // Unit test code: UT-08
        test("should not return any errors", () => {
            expect(parser.getErrors()).toBeNull;
        });

        // Unit test code: UT-09
        test("should return some errors", () => {
            parser.errors.push("Error1");
            expect(parser.getErrors()).toEqual(["Error1"]);
            parser.errors.push("Error2");
            expect(parser.getErrors()).toEqual(["Error1", "Error2"]);
        });
    });

    // Unit testing for getIsPaused() function
    describe("getIsPaused", () => {

        // Unit test code: UT-10
        test("should return false (not paused)", () => {
            expect(parser.getIsPaused()).toBe(false);
        });

        // Unit test code: UT-11
        test("should return true (paused)", () => {
            expect(parser.getIsPaused()).toBe(false);
            parser.setPause(true);
            expect(parser.getIsPaused()).toBe(true);
        });
    });

    // Unit testing for setPause() function
    describe("setPause", () => {

        // Unit test code: UT-12
        test("should set the isPaused value to false", ()=> {
            const booleanValue = false;
            parser.setPause(booleanValue);
            expect(parser.getIsPaused()).toBe(false);
        });

        // Unit test code: UT-13
        test("should set the isPaused value to true", () => {
            const booleanValue = true;
            parser.setPause(booleanValue);
            expect(parser.getIsPaused()).toBe(true);
        });

        // Unit test code: UT-14
        test("should be able to change the value of isPaused always",() => {
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
});

