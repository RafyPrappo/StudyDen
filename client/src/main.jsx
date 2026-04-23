import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./routes.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { PointsProvider } from "./context/PointsContext.jsx";

if (import.meta.env.DEV) {
  const originalConsoleError = console.error;

  console.error = (...args) => {
    const joinedMessage = args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        if (arg instanceof Error) return arg.message;
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(" ");

    const isBarikoiMissingPlaceLayerError =
      joinedMessage.includes('Source layer "place" does not exist on source "admin"');

    if (isBarikoiMissingPlaceLayerError) {
      return;
    }

    originalConsoleError(...args);
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <PointsProvider>
        <RouterProvider router={router} />
      </PointsProvider>
    </AuthProvider>
  </React.StrictMode>
);