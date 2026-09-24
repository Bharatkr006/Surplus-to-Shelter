import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  Building2,
  Truck,
  BarChart3,
  Menu,
  X,
  PlusCircle,
  LogOut,
  Sliders,
  History,
  Package,
} from "lucide-react";
import { useState } from "react";
import { useRole } from "../../context/RoleContext";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, logout, setRole } = useRole();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync role from URL path if user enters URL directly
  const getActiveRoleFromPath = () => {
    if (location.pathname.startsWith("/donor")) return "donor";
    if (location.pathname.startsWith("/recipient") || location.pathname.startsWith("/ngo")) return "recipient";
    if (location.pathname.startsWith("/delivery") || location.pathname.startsWith("/driver")) return "delivery";
    return role;
  };

  const currentRole = getActiveRoleFromPath();

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleSwitchProfile = () => {
    logout();
    navigate("/");
    setMobileOpen(false);
  };

  // 1. DONOR NAVIGATION (Only visible in Donor profile)
  const donorNavItems = [
    { to: "/donor", label: "My Surplus Listings", icon: Package, exact: true },
    { to: "/donor/post", label: "Post Surplus Food", icon: PlusCircle },
    { to: "/dashboard", label: "Rescue Impact", icon: BarChart3 },
  ];

  // 2. RECIPIENT NAVIGATION (Only visible in Recipient profile)
  const recipientNavItems = [
    { to: "/recipient", label: "Shelter Matches & Food", icon: Building2, exact: true },
    { to: "/recipient/settings", label: "Capacity & Preferences", icon: Sliders },
    { to: "/dashboard", label: "Rescue Impact", icon: BarChart3 },
  ];

  // 3. DELIVERY NAVIGATION (Only visible in Delivery profile)
  const deliveryNavItems = [
    { to: "/delivery", label: "Active Rescue Missions", icon: Truck, exact: true },
    { to: "/delivery/tasks", label: "Fleet Task History", icon: History },
    { to: "/dashboard", label: "Platform Analytics", icon: BarChart3 },
  ];

  let currentNavItems = donorNavItems;
  let roleTitle = "Donor Portal";
  let roleSubtitle = "Food Provider";
  let roleBadgeColor = "bg-amber-100 text-amber-800 border-amber-200";
  let roleIcon = UtensilsCrossed;
  let roleIconBg = "bg-amber-600";

  if (currentRole === "recipient") {
    currentNavItems = recipientNavItems;
    roleTitle = "Recipient Portal";
    roleSubtitle = "NGO & Shelter";
    roleBadgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
    roleIcon = Building2;
    roleIconBg = "bg-emerald-600";
  } else if (currentRole === "delivery") {
    currentNavItems = deliveryNavItems;
    roleTitle = "Delivery Fleet";
    roleSubtitle = "Driver Logistics";
    roleBadgeColor = "bg-blue-100 text-blue-800 border-blue-200";
    roleIcon = Truck;
    roleIconBg = "bg-blue-600";
  }

  const RoleIconComp = roleIcon;

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-lg ${roleIconBg} flex items-center justify-center text-white`}>
            <RoleIconComp className="h-4 w-4" />
          </div>
          <span className="font-bold text-text">{roleTitle}</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md hover:bg-surface-alt text-text-secondary"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-surface border-r border-border flex flex-col transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Isolated Profile Header */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${roleIconBg} flex items-center justify-center text-white shadow-xs`}>
              <RoleIconComp className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-text block leading-tight text-base">
                {roleTitle}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block mt-0.5 ${roleBadgeColor}`}>
                {roleSubtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Dedicated Navigation Items for this Role ONLY */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-3 mb-2">
            {roleTitle} Menu
          </p>

          {currentNavItems.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              onClick={() => {
                setRole(currentRole as any);
                setMobileOpen(false);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(to, exact)
                  ? "bg-primary-50 text-primary-700 font-semibold shadow-2xs"
                  : "text-text-secondary hover:bg-surface-alt hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}

          {/* Quick Action Button Specific to Role */}
          {currentRole === "donor" && (
            <div className="pt-4 px-1">
              <Link
                to="/donor/post"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                + Post Surplus Food
              </Link>
            </div>
          )}

          {currentRole === "recipient" && (
            <div className="pt-4 px-1">
              <Link
                to="/recipient/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Sliders className="h-4 w-4" />
                Update Capacity
              </Link>
            </div>
          )}
        </nav>

        {/* Switch / Exit Role Button at bottom */}
        <div className="p-3 border-t border-border bg-surface-alt/40 space-y-2">
          <button
            onClick={handleSwitchProfile}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg border border-border bg-surface hover:bg-surface-alt text-text-secondary hover:text-text text-xs font-semibold transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Switch Account / Role
          </button>

          <div className="flex items-center justify-between text-[11px] text-text-muted px-1">
            <span>Role-Separated Session</span>
            <span className="font-mono text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border">v1.0.1</span>
          </div>
        </div>
      </aside>
    </>
  );
}
