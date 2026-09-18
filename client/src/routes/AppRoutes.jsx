import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import AboutUs from "../pages/Home/AboutUs";
import ParkingStats from "../pages/Home/ParkingStats";

import UserLanding from "../pages/Parking/UserLanding";
import UserNavigation from "../pages/Parking/UserNavigation";
import UserConfirmation from "../pages/Parking/UserConfirmation";

import AdminLogin from "../pages/Admin/AdminLogin";
import Dashboard from "../pages/Admin/Dashboard";
import Manage from "../pages/Admin/Manage";
import Reports from "../pages/Admin/Reports";
import RatingsComments from "../pages/Admin/RatingsComments";

import AdminLayout from "../components/Admin/AdminLayout";

function AppRoutes() {
    return (
        <Routes>

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

            <Route
                path="/parking"
                element={<UserLanding />}
            />

            <Route
                path="/parking/navigation"
                element={<UserNavigation />}
            />

            <Route
                path="/parking/confirmation"
                element={<UserConfirmation />}
            />

                {/* Admin Login */}

            <Route
                path="/admin"
                element={<AdminLogin />}
            />


            {/* Admin Pages */}

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

        </Routes>
    );
}

export default AppRoutes;