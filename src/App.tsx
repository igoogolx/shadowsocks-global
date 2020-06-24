import React from "react";
import "./App.css";
import "flag-icon-css/css/flag-icon.min.css";
import { Home } from "./components/Home/Home";
import { Provider } from "react-redux";
import { store } from "./store/store";
import "./i18n/index";

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="App">
        <Home />
      </div>
    </Provider>
  );
};

export default App;
