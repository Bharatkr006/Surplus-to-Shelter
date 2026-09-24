import { Link, useLocation } from "react-router-dom";
import { UtensilsCrossed, Building2, Truck } from "lucide-react";

export function ProfileSwitcher() {
  const location = useLocation();

  const profiles = [
    {
      id: "donor",
      label: "Donor",
      subtitle: "Surplus Food",
      to: "/donor",
      icon: UtensilsCrossed,
      activeColor: "bg-amber-500 text-white shadow-sm",
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      id: "recipient",
      label: "Recipient",
      subtitle: "NGO / Shelter",
      to: "/recipient",
      icon: Building2,
      activeColor: "bg-emerald-600 text-white shadow-sm",
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    {
      id: "delivery",
      label: "Delivery",
      subtitle: "Driver Fleet",
      to: "/delivery",
      icon: Truck,
      activeColor: "bg-blue-600 text-white shadow-sm",
      badgeColor: "bg-blue-100 text-blue-800",
    },
  ];

  const currentProfile = profiles.find((p) => location.pathname.startsWith(p.to))?.id || null;

  return (
    <div className="bg-surface border border-border rounded-xl p-1.5 shadow-xs flex items-center gap-1.5">
      <span className="text-xs font-semibold text-text-muted px-2 hidden sm:inline uppercase tracking-wider">
        Profile:
      </span>
      {profiles.map(({ id, label, subtitle, to, icon: Icon, activeColor }) => {
        const isActive = currentProfile === id;
        return (
          <Link
            key={id}
            to={to}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? activeColor
                : "text-text-secondary hover:text-text hover:bg-surface-alt"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="font-semibold">{label}</span>
            <span className={`text-[10px] hidden md:inline opacity-80 ${isActive ? "text-white/90" : "text-text-muted"}`}>
              ({subtitle})
            </span>
          </Link>
        );
      })}
    </div>
  );
}
