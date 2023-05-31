import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "@tanstack/router";
import { router } from "#build/tanstack/router";

ReactDOM.createRoot(document.getElementById("app") ).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
