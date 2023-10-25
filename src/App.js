import "./App.css";
import { SomeClass } from "./SomeClass";

function App() {
    const some = new SomeClass();
    console.log(some.add);
    console.log(some.add());
    const sum = some.add(1, 2);
    console.log(sum);
    return <div className="App">{sum}</div>;
    // return <div className="App">10</div>;
}

export default App;
