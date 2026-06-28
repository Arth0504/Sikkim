import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
  const adminToken = sessionStorage.getItem("adminToken");
  const role = sessionStorage.getItem("role");

  if (!adminToken || role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
