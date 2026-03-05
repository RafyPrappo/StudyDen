import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./routes.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { PointsProvider } from "./context/PointsContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <PointsProvider>
        <RouterProvider router={router} />
      </PointsProvider>
    </AuthProvider>
  </React.StrictMode>
);