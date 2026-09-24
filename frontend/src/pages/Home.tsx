import { useNavigate, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, Button } from "../components/ui";
import { useRole } from "../context/RoleContext";
import {
  UtensilsCrossed,
  Building2,
  Truck,
  BarChart3,
  ArrowRight,
  Zap,
  Lock,
  CheckCircle2,
  LogIn,
} from "lucide-react";

export function Home() {
  const navigate = useNavigate();
  const { session, role } = useRole();

  const handleSelectRole = (selectedRole: "donor" | "recipient" | "delivery") => {
    // If already logged in as this role, go straight to dashboard
    if (session && role === selectedRole) {
      navigate(`/${selectedRole}`);
    } else {
      // Go to common login page with role pre-selected
      navigate(`/login?role=${selectedRole}`);
    }
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold shadow-2xs">
          <Zap className="h-3.5 w-3.5 text-primary-600" />
          <span>Surplus-to-Shelter • Real-Time Food Rescue Routing</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-text tracking-tight">
          Select Your Workspace Profile
        </h1>
        <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto">
          Each stakeholder operates in an independent, dedicated dashboard. Choose your profile below and enter your credentials to access your portal.
        </p>

        <div className="pt-2">
          <Link to="/login">
            <Button variant="outline" size="sm" className="text-xs font-semibold">
              <LogIn className="h-3.5 w-3.5 mr-1.5" />
              Open Unified Login Page
            </Button>
          </Link>
        </div>
      </div>

      {/* 3 Isolated Portal Doors */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile 1: Donor Door */}
        <div
          onClick={() => handleSelectRole("donor")}
          className="group cursor-pointer text-left"
        >
          <Card className="h-full border-2 border-border group-hover:border-amber-500 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 relative overflow-hidden bg-surface">
            <div className="h-2 w-full bg-amber-500" />
            <CardHeader className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                  <UtensilsCrossed className="h-8 w-8" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Profile 1
                </span>
              </div>

              <div>
                <CardTitle className="text-xl font-bold text-text group-hover:text-amber-600 transition-colors flex items-center justify-between">
                  Donor Portal
                  <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </CardTitle>
                <p className="text-xs text-amber-700 font-semibold mt-0.5 uppercase tracking-wider">
                  Restaurants, Hostels & Caterers
                </p>
                <CardDescription className="text-xs mt-2 text-text-secondary">
                  Login to post surplus food, trigger candidate matching, and monitor live rescue progress.
                </CardDescription>
              </div>

              <div className="pt-3 border-t border-border/60 text-xs text-text-secondary space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Surplus meal listings</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>AI matching algorithm</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Real-time route tracking</span>
                </div>
              </div>

              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2.5 mt-2 cursor-pointer">
                Login as Donor →
              </Button>
            </CardHeader>
          </Card>
        </div>

        {/* Profile 2: Recipient Door */}
        <div
          onClick={() => handleSelectRole("recipient")}
          className="group cursor-pointer text-left"
        >
          <Card className="h-full border-2 border-border group-hover:border-emerald-500 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 relative overflow-hidden bg-surface">
            <div className="h-2 w-full bg-emerald-600" />
            <CardHeader className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                  <Building2 className="h-8 w-8" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Profile 2
                </span>
              </div>

              <div>
                <CardTitle className="text-xl font-bold text-text group-hover:text-emerald-600 transition-colors flex items-center justify-between">
                  Recipient Portal
                  <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </CardTitle>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5 uppercase tracking-wider">
                  Shelters, NGOs & Kitchens
                </p>
                <CardDescription className="text-xs mt-2 text-text-secondary">
                  Login to manage shelter capacity, configure food categories, and confirm incoming rescued food.
                </CardDescription>
              </div>

              <div className="pt-3 border-t border-border/60 text-xs text-text-secondary space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Real-time capacity gauge</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Open/closed availability toggle</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>One-click delivery confirmation</span>
                </div>
              </div>

              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 mt-2 cursor-pointer">
                Login as Recipient →
              </Button>
            </CardHeader>
          </Card>
        </div>

        {/* Profile 3: Delivery Door */}
        <div
          onClick={() => handleSelectRole("delivery")}
          className="group cursor-pointer text-left"
        >
          <Card className="h-full border-2 border-border group-hover:border-blue-500 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 relative overflow-hidden bg-surface">
            <div className="h-2 w-full bg-blue-600" />
            <CardHeader className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                  <Truck className="h-8 w-8" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Profile 3
                </span>
              </div>

              <div>
                <CardTitle className="text-xl font-bold text-text group-hover:text-blue-600 transition-colors flex items-center justify-between">
                  Delivery Fleet
                  <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </CardTitle>
                <p className="text-xs text-blue-700 font-semibold mt-0.5 uppercase tracking-wider">
                  Drivers & Volunteer Logistics
                </p>
                <CardDescription className="text-xs mt-2 text-text-secondary">
                  Login to accept rescue tasks, navigate pickup to shelter dropoff, and update mission status.
                </CardDescription>
              </div>

              <div className="pt-3 border-t border-border/60 text-xs text-text-secondary space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Assigned rescue missions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Turn-by-turn road navigation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Pickup & dropoff validation</span>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 mt-2 cursor-pointer">
                Login as Driver →
              </Button>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Platform Analytics link */}
      <div className="text-center pt-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-primary-600 transition-colors bg-surface px-4 py-2 rounded-xl border border-border"
        >
          <BarChart3 className="h-4 w-4 text-primary-500" />
          <span>View Platform-Wide Impact Analytics & Rescue Metrics →</span>
        </Link>
      </div>
    </div>
  );
}
