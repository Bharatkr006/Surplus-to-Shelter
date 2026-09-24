import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  PlusCircle,
  Clock,
  MapPin,
  Package,
  ArrowRight,
  Zap,
  UtensilsCrossed,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, Button, Badge, LoadingSpinner, EmptyState } from "../../components/ui";
import { subscribeDataUpdated, notifyDataUpdated } from "../../lib/realtime";

function formatTimeRemaining(safeUntilISO: string) {
  if (!safeUntilISO) return "—";
  const safeUntil = new Date(safeUntilISO).getTime();
  const now = new Date().getTime();
  const diff = safeUntil - now;
  if (diff <= 0) return "EXPIRED";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "POSTED":
      return <Badge variant="warning">🟡 POSTED — Awaiting Match</Badge>;
    case "MATCHING":
      return <Badge variant="info">🔵 MATCHING IN PROGRESS</Badge>;
    case "MATCHED":
      return <Badge variant="success">🟢 RECIPIENT MATCHED</Badge>;
    case "DRIVER_ASSIGNED":
      return <Badge variant="success">🚗 DRIVER EN ROUTE</Badge>;
    case "PICKED_UP":
      return <Badge variant="success">📦 FOOD PICKED UP</Badge>;
    case "DELIVERED":
      return <Badge variant="default">✅ SAFELY DELIVERED</Badge>;
    case "EXPIRED":
      return <Badge variant="danger">🔴 EXPIRED</Badge>;
    case "CANCELLED":
      return <Badge variant="danger">❌ CANCELLED</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function DonorDashboard() {
  const location = useLocation();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [matchingId, setMatchingId] = useState<string | null>(null);

  const fetchDonations = async () => {
    try {
      const res = await fetch("/api/donations/");
      const data = await res.json();
      setDonations(data.donations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    // Real-time synchronization (cross-tab broadcasts + fast 3s polling)
    const unsubscribe = subscribeDataUpdated(() => {
      fetchDonations();
    }, 3000);
    return () => unsubscribe();
  }, []);

  const handleRunMatch = async (donationId: string) => {
    setMatchingId(donationId);
    try {
      const res = await fetch(`/api/matches/run/${donationId}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Matching failed");
      } else {
        await fetchDonations();
        notifyDataUpdated();
      }
    } catch {
      alert("Network error during matching");
    } finally {
      setMatchingId(null);
    }
  };

  // Real KPI Calculations purely from actual DB rows
  const totalDonations = donations.length;
  const totalPortions = donations.reduce((sum, d) => sum + (parseFloat(d.quantity) || 0), 0);
  const activeUnmatched = donations.filter((d) => d.status === "POSTED" || d.status === "MATCHING").length;
  const inProgress = donations.filter((d) => ["MATCHED", "DRIVER_ASSIGNED", "PICKED_UP"].includes(d.status)).length;
  const deliveredCount = donations.filter((d) => d.status === "DELIVERED").length;

  const filteredDonations = donations.filter((d) => {
    if (filter === "active") return ["POSTED", "MATCHING"].includes(d.status);
    if (filter === "matched") return ["MATCHED", "DRIVER_ASSIGNED", "PICKED_UP"].includes(d.status);
    if (filter === "completed") return d.status === "DELIVERED";
    if (filter === "expired") return d.status === "EXPIRED" || formatTimeRemaining(d.safe_until) === "EXPIRED";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Profile Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
            <UtensilsCrossed className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text">Donor Portal</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Surplus Provider
              </span>
            </div>
            <p className="text-text-secondary text-sm mt-0.5">
              List surplus food, run multi-factor matching algorithms, and track food rescue to shelters in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDonations} title="Refresh listings">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link to="/donor/post">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              <PlusCircle className="mr-2 h-4 w-4" />
              Post Surplus Food
            </Button>
          </Link>
        </div>
      </div>

      {location.state?.newDonation && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Surplus food listing published! Click <strong>"Find Best Match"</strong> on the card below to trigger recipient matching.</span>
        </div>
      )}

      {/* KPI Stats Row from Real DB Data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase">Total Surplus Listings</span>
            <TrendingUp className="h-4 w-4 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-text mt-2">{totalDonations}</p>
          <p className="text-xs text-text-secondary mt-1">{totalPortions.toFixed(0)} total portions registered</p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase">Awaiting Match</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{activeUnmatched}</p>
          <p className="text-xs text-text-secondary mt-1">Ready for algorithm allocation</p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase">In Rescue & Transit</span>
            <Package className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{inProgress}</p>
          <p className="text-xs text-text-secondary mt-1">Matched with shelters/drivers</p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase">Delivered Safely</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{deliveredCount}</p>
          <p className="text-xs text-text-secondary mt-1">Successfully rescued from waste</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex gap-2">
          {[
            { id: "all", label: `All (${donations.length})` },
            { id: "active", label: `Awaiting Match (${activeUnmatched})` },
            { id: "matched", label: `In Transit (${inProgress})` },
            { id: "completed", label: `Delivered (${deliveredCount})` },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === id
                  ? "bg-primary-50 text-primary-700 font-semibold"
                  : "text-text-secondary hover:bg-surface-alt"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Donation Cards List */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : filteredDonations.length === 0 ? (
        <EmptyState
          title="No food listings found"
          description={
            donations.length === 0
              ? "You haven't posted any surplus food yet. Create your first donation to begin matching with shelters."
              : `No donations match the '${filter}' filter.`
          }
          action={
            <Link to="/donor/post">
              <Button>Post Food Donation</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDonations.map((donation) => {
            const timeRemaining = formatTimeRemaining(donation.safe_until);
            const isExpiredTime = timeRemaining === "EXPIRED";
            const currentStatus =
              isExpiredTime && donation.status === "POSTED" ? "EXPIRED" : donation.status;
            const isRunningMatch = matchingId === donation.id;

            return (
              <Card
                key={donation.id}
                className={`flex flex-col border border-border shadow-xs hover:border-primary-300 transition-all ${
                  isExpiredTime ? "opacity-75 bg-surface-alt" : ""
                }`}
              >
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    {getStatusBadge(currentStatus)}
                    <span className="text-[11px] text-text-muted">
                      {new Date(donation.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-text truncate">{donation.food_type}</h3>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                      {donation.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" /> Quantity:
                      </span>
                      <span className="font-semibold text-text">
                        {donation.quantity} {donation.unit} ({donation.food_category})
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-muted flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Pickup:
                      </span>
                      <span className="truncate max-w-[170px] text-text-secondary font-medium">
                        {donation.pickup_address}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-muted flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> Safe Window:
                      </span>
                      <span
                        className={`font-semibold ${
                          isExpiredTime ? "text-danger-600" : "text-amber-600"
                        }`}
                      >
                        {isExpiredTime ? "Expired" : timeRemaining}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border p-3 mt-auto bg-surface-alt/40 flex flex-col gap-2 rounded-b-xl">
                  {donation.status === "POSTED" && !isExpiredTime && (
                    <Button
                      id={`run-match-${donation.id}`}
                      variant="primary"
                      size="sm"
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                      loading={isRunningMatch}
                      disabled={isRunningMatch}
                      onClick={() => handleRunMatch(donation.id)}
                    >
                      <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-200" />
                      {isRunningMatch ? "Evaluating Shelters..." : "Find Best Match"}
                    </Button>
                  )}

                  <Link to={`/track/${donation.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      View Match & Route Map <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
