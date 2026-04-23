import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";

import Home from "./pages/Home";
import Spots from "./pages/Spots";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import SpotDetails from "./pages/SpotDetails";
import AdminDashboard from "./pages/AdminDashboard";
<<<<<<< HEAD

import RequireAuth from "./components/auth/RequireAuth";
import RequireAdmin from "./components/auth/RequireAdmin";
import AdminSpots from "./pages/AdminSpots";
=======
import AdminSpots from "./pages/AdminSpots";
import AdminSpotsVerification from "./pages/AdminSpotsVerification"; // Arrafy's addition
import AdminReports from "./pages/AdminReports"; // Friend's addition

import RequireAuth from "./components/auth/RequireAuth";
import RequireAdmin from "./components/auth/RequireAdmin";

>>>>>>> main
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
<<<<<<< HEAD

=======
>>>>>>> main
      {
        path: "spots",
        element: (
          <RequireAuth>
            <Spots />
          </RequireAuth>
        ),
      },
      {
        path: "spots/:id",
        element: (
          <RequireAuth>
            <SpotDetails />
          </RequireAuth>
        ),
      },
      {
        path: "events",
        element: <Events />,
      },
      {
        path: "events/:id",
        element: <EventDetails />,
      },
      {
        path: "leaderboard",
        element: (
          <RequireAuth>
            <Leaderboard />
          </RequireAuth>
        ),
      },
      {
        path: "profile",
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        ),
      },
      {
        path: "profile/:userId",
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        ),
      },
      {
        path: "admin",
        element: (
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        ),
      },
      {
        path: "admin/spots",
        element: (
          <RequireAdmin>
            <AdminSpots />
          </RequireAdmin>
        ),
      },
<<<<<<< HEAD

=======
      {
        path: "admin/spots/verify",
        element: (
          <RequireAdmin>
            <AdminSpotsVerification />
          </RequireAdmin>
        ),
      },
      {
        path: "admin/reports",
        element: (
          <RequireAdmin>
            <AdminReports />
          </RequireAdmin>
        ),
      },
>>>>>>> main
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ],
  },
]);

export default router;