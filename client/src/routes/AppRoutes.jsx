import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "../pages/Home/Home";
import AboutUs from "../pages/Home/AboutUs";
import ParkingStats from "../pages/Home/ParkingStats";

import UserLanding from "../pages/Parking/UserLanding";
import UserConfirmation from "../pages/Parking/UserConfirmation";

import ParkingDirections from "../pages/ParkingDirections/ParkingDirections";
import ParkingConfirmation from "../pages/ParkingConfirmation/ParkingConfirmation";
import NavigationPage from "../pages/NavigationPage";

import AdminLogin from "../pages/Admin/AdminLogin";
import Dashboard from "../pages/Admin/Dashboard";
import Manage from "../pages/Admin/Manage";
import Reports from "../pages/Admin/Reports";
import RatingsComments from "../pages/Admin/RatingsComments";

import AdminLayout from "../components/Admin/AdminLayout";
import AdminRoute from "./AdminRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Default */}

      <Route
        path="/"
        element={
          <Navigate
            to="/home"
            replace
          />
        }
      />

      {/* Public Pages */}

      <Route
        path="/home"
        element={<Home />}
      />

      <Route
        path="/about"
        element={<AboutUs />}
      />

      <Route
        path="/parking-stats"
        element={<ParkingStats />}
      />

      {/* Parking Flow */}

      <Route
        path="/parking"
        element={<UserLanding />}
      />

      <Route
        path="/parking/navigation"
        element={<NavigationPage />}
      />

      <Route
        path="/parking/confirmation"
        element={<UserConfirmation />}
      />

      <Route
        path="/parking-directions"
        element={<ParkingDirections />}
      />

      <Route
        path="/parking-confirmation"
        element={<ParkingConfirmation />}
      />

      <Route
        path="/navigation"
        element={<NavigationPage />}
      />

      {/* Admin Login */}

      <Route
        path="/admin"
        element={<AdminLogin />}
      />

      {/* Admin Pages */}

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            path="/admin/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/admin/manage"
            element={<Manage />}
          />

          <Route
            path="/admin/reports"
            element={<Reports />}
          />

          <Route
            path="/admin/ratings"
            element={<RatingsComments />}
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;