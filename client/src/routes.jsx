import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";

import Home from "./pages/Home";
import Spots from "./pages/Spots";
import Events from "./pages/Events";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

import RequireAuth from "./components/auth/RequireAuth";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },

      // Protected routes
      {
        path: "spots",
        element: (
          <RequireAuth>
            <Spots />
          </RequireAuth>
        ),
      },
      {
        path: "events",
        element: (
          <RequireAuth>
            <Events />
          </RequireAuth>
        ),
      },
      {
        path: "leaderboard",
        element: (
          <RequireAuth>
            <Leaderboard />
          </RequireAuth>
        ),
      },

      // Public routes
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ],
  },
]);

export default router;