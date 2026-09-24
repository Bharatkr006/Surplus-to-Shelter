import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useRole } from "../../context/RoleContext";
import { UtensilsCrossed, Building2, Truck, LogOut, Shield } from "lucide-react";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, logout } = useRole();

  // If on landing / role selector page
  const isHomePage = location.pathname === "/";

  // Determine current active profile from path
  const currentRole = location.pathname.startsWith("/donor")
    ? "donor"
    : location.pathname.startsWith("/recipient") || location.pathname.startsWith("/ngo")
    ? "recipient"
    : location.pathname.startsWith("/delivery") || location.pathname.startsWith("/driver")
    ? "delivery"
    : role;

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  const getProfileHeader = () => {
    switch (currentRole) {
      case "donor":
        return {
          title: "Donor Portal",
          entity: "Food Provider Session",
          badge: "bg-amber-100 text-amber-800 border-amber-200",
          icon: UtensilsCrossed,
          iconColor: "text-amber-600",
        };
      case "recipient":
        return {
          title: "Recipient Portal",
          entity: "NGO & Shelter Beneficiary",
          badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: Building2,
          iconColor: "text-emerald-600",
        };
      case "delivery":
        return {
          title: "Delivery Fleet",
          entity: "Driver Logistics Command",
          badge: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Truck,
          iconColor: "text-blue-600",
        };
      default:
        return {
          title: "Platform Overview",
          entity: "Portal Selection",
          badge: "bg-purple-100 text-purple-800 border-purple-200",
          icon: Shield,
          iconColor: "text-purple-600",
        };
    }
  };

  const profileInfo = getProfileHeader();
  const ProfileIcon = profileInfo.icon;

  return (
    <div className="min-h-screen bg-surface-alt">
      {!isHomePage && <Sidebar />}

      <main className={!isHomePage ? "lg:pl-64 pt-14 lg:pt-0" : ""}>
        {/* Desktop Header */}
        {!isHomePage && (
          <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-surface border-b border-border sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <ProfileIcon className={`h-4 w-4 ${profileInfo.iconColor}`} />
                <span className="text-xs font-bold text-text">{profileInfo.title}:</span>
                <span className="text-xs font-medium text-text-secondary">{profileInfo.entity}</span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${profileInfo.badge}`}>
                Protected Session
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live Real-Time Sync
              </span>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text bg-surface-alt hover:bg-surface border border-border rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Switch Profile
              </button>
            </div>
          </header>
        )}

        <div className={`p-6 lg:p-8 ${isHomePage ? "max-w-6xl mx-auto" : "max-w-7xl mx-auto"}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
