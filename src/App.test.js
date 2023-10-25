import { render, screen } from "@testing-library/react";
import App from "./App";
import { SomeClass } from "./SomeClass";

jest.mock("./SomeClass");
const mockMethod = jest.fn(() => 10);
// SomeClass.mockImplementation(() => {
//     return {
//         add: mockMethod,
//     };
// });

SomeClass.prototype.constructor.mockImplementation(() => {
    return {
        add: mockMethod,
    };
});

// console.log(new SomeClass().add());

test("renders learn react link", () => {
    render(<App />);
    const mainDiv = screen.getByText(/10/i);
    expect(mainDiv).toBeInTheDocument();
});
