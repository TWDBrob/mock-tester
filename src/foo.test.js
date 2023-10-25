import Foo from "./foo.js";
import Bar from "./bar.js";

jest.mock("./bar.js");

Bar.prototype.constructor.mockImplementation(() => {
    console.log("i want this to run");
});

describe("Foo", () => {
    it("should...", () => {
        const foo = new Foo();

        expect(foo.bar).toBeInstanceOf(Bar);
        expect(Bar).toBeCalled();
    });

    it("should be a mock function", () => {
        expect(jest.isMockFunction(Bar)).toEqual(true);
    });
});
