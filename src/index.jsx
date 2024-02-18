import { StrictMode } from "react";
import ReactDOM from "react-dom";
import { initializeIcons } from "@fluentui/react/lib/Icons";

import App from "./App";
import MainComponent from "./layout";
import "./styles.css";

initializeIcons(/* optional base url */);
const rootElement = document.getElementById("root");
ReactDOM.render(
  <StrictMode>
    <App />
    {/* <MainComponent /> */}
  </StrictMode>,
  rootElement,
);
