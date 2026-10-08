import { Navigate, Outlet } from "react-router-dom";
import { ADMIN_TOKEN_KEY } from "../services/adminApi";

function AdminRoute() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) ? (
    <Outlet />
  ) : (
    <Navigate to="/admin" replace />
  );
}

export default AdminRoute;
