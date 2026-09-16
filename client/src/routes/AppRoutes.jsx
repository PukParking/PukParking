import { Routes, Route } from "react-router-dom";

import AdminLogin from "../pages/Admin/AdminLogin";
import Dashboard from "../pages/Admin/Dashboard";
import Manage from "../pages/Admin/Manage";
import Reports from "../pages/Admin/Reports";
import RatingsComments from "../pages/Admin/RatingsComments";


import AdminLayout from "../components/Admin/AdminLayout";

function AppRoutes() {
    return (
        <Routes>

            {/* Admin Login */}
            <Route path="/admin" element={<AdminLogin />} />

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