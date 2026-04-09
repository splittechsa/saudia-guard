import { Navigate } from "react-router-dom";
import { AppRole, useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: AppRole }) {
  const { user, loading, hasRole, getDefaultRoute } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to={getDefaultRoute()} replace />;
  }

  return <>{children}</>;
}
