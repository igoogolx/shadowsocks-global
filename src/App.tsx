import React from "react";
import "./App.css";
import "flag-icon-css/css/flag-icon.min.css";
import { Home } from "./components/Home/Home";
//https://github.com/facebook/create-react-app/issues/8285#issuecomment-571209969
import { MemoryRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Home />
        </div>
      </Router>
    </Provider>
  );
};

export default App;
