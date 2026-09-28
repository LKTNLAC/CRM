import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth";
import { Loader2 } from "lucide-react";

export function ProtectedRoute() {
  const location = useLocation();
  const token = useAuthStore((s) => s.accessToken) ?? localStorage.getItem("access_token");
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: authService.me,
    enabled: !!token && !user,
    retry: false,
  });

  useEffect(() => {
    if (data) setUser(data);
    if (isError) {
      clear();
    }
  }, [data, isError, setUser, clear]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}