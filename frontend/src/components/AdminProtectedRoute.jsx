import { Navigate } from "react-router";
import { useAuthStore } from "../store/useAuthStore";

const AdminProtectedRoute = ({ children }) => {
  const { authUser, isCheckingAuth } = useAuthStore();

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return null; // or a loading spinner if you prefer
  }

  // Redirect to login if not authenticated
  if (!authUser) {
    return <Navigate to="/admin/login" replace />;
  }

  // Redirect to home if authenticated but not admin
  if (authUser.role !== 'admin') {
    return <Navigate to="/chat" replace />;
  }

  // Render the protected component if authenticated and admin
  return children;
};

export default AdminProtectedRoute;
