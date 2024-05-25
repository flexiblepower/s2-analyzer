import { Parser } from "../../src/parser/Parser";

describe("Parser", () => {
    let parser : Parser;
    
    // Creating a new parser for each test
    beforeEach(() => {
        parser = new Parser();
    });


    // Testing the addLine function
    describe("addLine", () => {
       test("should append a newline character if missing to the end of the string", () => {
            const line = "Testing line without newline";
            parser.addLine(line);
            expect(parser.getLines().endsWith("\n")).toBe(true);
       })

       test("should not append a newline character if there is newline character already", () => {
            const line = "Testing line with newline\n";
            parser.addLine(line);
            expect(parser.getLines().endsWith("\n")).toBe(true);
       })

       test("should append the line to the bufferedLines when paused", () => {
            parser.setPause(true);
            expect(parser.getLines()).toBe("");
            parser.addLine("Line1");
            expect(parser.bufferedLines).toBe("Line1");
            parser.addLine("Line2");
            expect(parser.bufferedLines).toBe("Line1Line2");
            expect(parser.getLines()).toBe("");
       });

       test("should append the line to the lines when not paused", () => {
            parser.setPause(true);
            parser.addLine("Line1");
            parser.setPause(false);
            parser.addLine("Line2");
            expect(parser.getLines()).toBe("Line1Line2\n");
            parser.addLine("Line3");
            expect(parser.getLines()).toBe("Line1Line2\nLine3\n");
       });
    });
});

