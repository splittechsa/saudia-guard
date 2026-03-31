import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ITDashboard from "./pages/ITDashboard";
import Onboarding from "./pages/Onboarding";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import SLA from "./pages/SLA";
import Support from "./pages/Support";
import Reports from "./pages/Reports";
import StoreSetup from "./pages/StoreSetup";
import SystemStatus from "./pages/SystemStatus";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/dashboard/store-setup" element={<ProtectedRoute><StoreSetup /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="super_owner"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/system-status" element={<ProtectedRoute requiredRole="super_owner"><SystemStatus /></ProtectedRoute>} />
            <Route path="/it-dashboard" element={<ProtectedRoute requiredRole="it_support"><ITDashboard /></ProtectedRoute>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/sla" element={<SLA />} />
            <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
