import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { RoleProvider } from "./context/RoleContext";
import { Home } from "./pages/Home";
import { DonorDashboard } from "./pages/donor/DonorDashboard";
import { PostDonation } from "./pages/donor/PostDonation";
import { NgoDashboard } from "./pages/ngo/NgoDashboard";
import { NgoSettings } from "./pages/ngo/NgoSettings";
import { DriverDashboard } from "./pages/driver/DriverDashboard";
import { DriverTasks } from "./pages/driver/DriverTasks";
import { ImpactDashboard } from "./pages/dashboard/ImpactDashboard";
import { TrackDonation } from "./pages/track/TrackDonation";

function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Landing & Role Selection Portal */}
            <Route path="/" element={<Home />} />

            {/* 1. SEPARATE DONOR DASHBOARD (Strictly isolated) */}
            <Route path="/donor" element={<DonorDashboard />} />
            <Route path="/donor/post" element={<PostDonation />} />

            {/* 2. SEPARATE RECIPIENT DASHBOARD (Strictly isolated) */}
            <Route path="/recipient" element={<NgoDashboard />} />
            <Route path="/recipient/settings" element={<NgoSettings />} />
            <Route path="/ngo" element={<Navigate to="/recipient" replace />} />
            <Route path="/ngo/settings" element={<Navigate to="/recipient/settings" replace />} />

            {/* 3. SEPARATE DELIVERY DASHBOARD (Strictly isolated) */}
            <Route path="/delivery" element={<DriverDashboard />} />
            <Route path="/delivery/tasks" element={<DriverTasks />} />
            <Route path="/driver" element={<Navigate to="/delivery" replace />} />
            <Route path="/driver/tasks" element={<Navigate to="/delivery/tasks" replace />} />

            {/* Cross-cutting Impact & Track */}
            <Route path="/dashboard" element={<ImpactDashboard />} />
            <Route path="/track/:id" element={<TrackDonation />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RoleProvider>
  );
}

export default App;
