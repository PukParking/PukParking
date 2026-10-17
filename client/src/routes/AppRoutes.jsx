import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "../pages/Home/Home";
import AboutUs from "../pages/Home/AboutUs";
import ParkingStats from "../pages/Home/ParkingStats";

import UserLanding from "../pages/Parking/UserLanding";
import ParkingConfirmation from "../pages/ParkingConfirmation/ParkingConfirmation";
import NavigationPage from "../pages/NavigationPage";

import AdminLogin from "../pages/Admin/AdminLogin";
import Dashboard from "../pages/Admin/Dashboard";
import Manage from "../pages/Admin/Manage";
import Reports from "../pages/Admin/Reports";
import RatingsComments from "../pages/Admin/RatingsComments";
import Settings from "../pages/Admin/Settings";

import AdminLayout from "../components/Admin/AdminLayout";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/parking-stats" element={<ParkingStats />} />

      <Route path="/parking" element={<UserLanding />} />
      <Route path="/parking/navigation" element={<NavigationPage />} />
      <Route
        path="/parking/confirmation"
        element={<ParkingConfirmation />}
      />
      <Route path="/navigation" element={<NavigationPage />} />

      <Route path="/admin" element={<AdminLogin />} />

      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/manage" element={<Manage />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route
          path="/admin/ratings"
          element={<RatingsComments />}
        />
        <Route path="/admin/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default AppRoutes;