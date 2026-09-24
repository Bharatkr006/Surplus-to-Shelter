import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Settings,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Truck,
  Power,
  Sliders,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, Button, Badge, LoadingSpinner, EmptyState } from "../../components/ui";
import { subscribeDataUpdated, notifyDataUpdated } from "../../lib/realtime";

function formatTimeRemaining(safeUntilISO: string) {
  if (!safeUntilISO) return "—";
  const safeUntil = new Date(safeUntilISO).getTime();
  const now = new Date().getTime();
  const diff = safeUntil - now;
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

export function NgoDashboard() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [org, setOrg] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingCapacity, setUpdatingCapacity] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Load all organizations
  const loadOrganizations = async (preserveSelected = true) => {
    try {
      const res = await fetch("/api/organizations/");
      const data = await res.json();
      const list = data.organizations || [];
      setOrganizations(list);

      if (list.length > 0) {
        const targetId = (preserveSelected && selectedOrgId) ? selectedOrgId : list[0].id;
        setSelectedOrgId(targetId);
        fetchOrgData(targetId);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchOrgData = async (orgId: string) => {
    if (!orgId) return;
    try {
      const res = await fetch(`/api/organizations/${orgId}/matches`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrg(data.organization);
      setMatches(data.matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations(false);

    // Subscribe to cross-tab updates and real-time polling
    const unsubscribe = subscribeDataUpdated(() => {
      if (selectedOrgId) {
        fetchOrgData(selectedOrgId);
      } else {
        loadOrganizations(true);
      }
    }, 3000);

    return () => unsubscribe();
  }, [selectedOrgId]);

  const handleOrgChange = (newOrgId: string) => {
    setSelectedOrgId(newOrgId);
    setLoading(true);
    fetchOrgData(newOrgId);
  };

  // Toggle open/closed
  const handleToggleOpen = async () => {
    if (!org) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_open: !org.is_open }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrg(updated);
        notifyDataUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Quick adjust capacity
  const handleAdjustCapacity = async (delta: number) => {
    if (!org) return;
    const current = parseFloat(org.capacity_available) || 0;
    const nextVal = Math.max(0, current + delta);
    setUpdatingCapacity(true);
    try {
      const res = await fetch(`/api/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity_available: nextVal }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrg(updated);
        notifyDataUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingCapacity(false);
    }
  };

  // Mark incoming rescue as delivered/received
  const handleConfirmReceived = async (donationId: string) => {
    setConfirmingId(donationId);
    try {
      const res = await fetch(`/api/donations/${donationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DELIVERED" }),
      });
      if (res.ok) {
        await fetchOrgData(org.id);
        notifyDataUpdated();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update delivery status");
      }
    } catch {
      alert("Network error confirming delivery");
    } finally {
      setConfirmingId(null);
    }
  };

  const incomingMatches = matches.filter(
    (m) =>
      m.donation_status === "MATCHED" ||
      m.donation_status === "DRIVER_ASSIGNED" ||
      m.donation_status === "PICKED_UP"
  );
  const pastMatches = matches.filter((m) => m.donation_status === "DELIVERED");

  const capacityPct = org && parseFloat(org.capacity_total) > 0
    ? Math.min(100, Math.round((parseFloat(org.capacity_available) / parseFloat(org.capacity_total)) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Profile Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center text-emerald-600 shrink-0">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text">Recipient Portal</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                NGO & Shelter Hub
              </span>
            </div>
            <p className="text-text-secondary text-sm mt-0.5">
              Manage shelter capacity in real time, set food acceptance criteria, and accept inbound rescued meals.
            </p>
          </div>
        </div>

        {/* Shelter Switcher Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-surface-alt border border-border rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted">Active Shelter:</span>
            <select
              value={selectedOrgId}
              onChange={(e) => handleOrgChange(e.target.value)}
              className="bg-transparent text-sm font-semibold text-text focus:outline-hidden cursor-pointer"
            >
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.is_open ? "🟢" : "🔴"} ({parseFloat(o.capacity_available).toFixed(0)} cap)
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => org && fetchOrgData(org.id)}
            title="Refresh shelter data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Link to="/recipient/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1.5" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : org ? (
        <>
          {/* Active Shelter Control & Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Live Capacity Card with Quick Adjust */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-text-muted uppercase">
                    Available Capacity
                  </CardTitle>
                  <Sliders className="h-3.5 w-3.5 text-text-muted" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-extrabold text-emerald-600">
                    {parseFloat(org.capacity_available).toFixed(0)}
                  </p>
                  <span className="text-xs text-text-muted">/ {parseFloat(org.capacity_total).toFixed(0)} portions</span>
                </div>
                <div className="mt-2 w-full bg-surface-alt rounded-full h-2 overflow-hidden border border-border/50">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${capacityPct}%` }}
                  />
                </div>
                {/* Real-time Capacity Adjuster */}
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border/60">
                  <span className="text-[11px] text-text-muted mr-1">Adjust:</span>
                  <button
                    disabled={updatingCapacity}
                    onClick={() => handleAdjustCapacity(-10)}
                    className="px-2 py-0.5 text-xs rounded bg-surface-alt hover:bg-surface-alt/80 border border-border text-text font-mono cursor-pointer"
                  >
                    -10
                  </button>
                  <button
                    disabled={updatingCapacity}
                    onClick={() => handleAdjustCapacity(10)}
                    className="px-2 py-0.5 text-xs rounded bg-surface-alt hover:bg-surface-alt/80 border border-border text-text font-mono cursor-pointer"
                  >
                    +10
                  </button>
                  <button
                    disabled={updatingCapacity}
                    onClick={() => handleAdjustCapacity(40)}
                    className="px-2 py-0.5 text-xs rounded bg-surface-alt hover:bg-surface-alt/80 border border-border text-text font-mono cursor-pointer"
                  >
                    +40
                  </button>
                </div>
              </CardHeader>
            </Card>

            {/* Inbound & Matches Count */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-xs font-semibold text-text-muted uppercase">
                  Inbound Rescues
                </CardTitle>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-extrabold text-blue-600">{incomingMatches.length}</p>
                  <span className="text-xs text-text-muted">in transit / matched</span>
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  {pastMatches.length} total deliveries completed previously
                </p>
              </CardHeader>
            </Card>

            {/* Status & Open/Closed Toggle */}
            <Card className="col-span-1 md:col-span-2 border border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-text-muted uppercase">
                    Matching Engine Eligibility Status
                  </CardTitle>
                  <Button
                    size="sm"
                    variant={org.is_open ? "outline" : "primary"}
                    className={org.is_open ? "text-danger-600 border-danger-200 hover:bg-danger-50 text-xs" : "bg-emerald-600 text-xs"}
                    loading={updatingStatus}
                    onClick={handleToggleOpen}
                  >
                    <Power className="h-3.5 w-3.5 mr-1" />
                    {org.is_open ? "Set to Closed" : "Open for Rescues"}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant={org.is_open ? "success" : "danger"}>
                    {org.is_open ? "🟢 Open & Eligible for Matching" : "🔴 Closed (Algorithm Will Reject)"}
                  </Badge>
                  {(org.accepted_food_categories || []).map((cat: string) => (
                    <Badge key={cat} variant="info">
                      Accepts: {cat}
                    </Badge>
                  ))}
                </div>

                {org.current_needs?.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span><strong>Urgent Need Factor:</strong> {org.current_needs.join(", ")} (Score Boosted)</span>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-1.5 text-xs text-text-muted">
                  <MapPin className="h-3 w-3" />
                  <span>{org.address}</span>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Inbound Matched Donations */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text">Inbound Food Rescues</h2>
                <p className="text-xs text-text-secondary">
                  Surplus donations routed to <strong>{org.name}</strong> by the matching engine
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-surface border border-border text-text-muted">
                {incomingMatches.length} pending
              </span>
            </div>

            {incomingMatches.length === 0 ? (
              <EmptyState
                title="No incoming food matches right now"
                description={`When donors post food compatible with ${org.name}, the matching algorithm will dispatch them here.`}
                action={
                  <Link to="/donor/post">
                    <Button size="sm">Post Surplus Food to Match</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-4">
                {incomingMatches.map((m) => {
                  const timeLeft = formatTimeRemaining(m.donation_safe_until);
                  const isConfirming = confirmingId === m.donation_id;

                  return (
                    <Card key={m.id} className="border-2 border-emerald-500/30 shadow-xs overflow-hidden">
                      <div className="bg-emerald-50 px-6 py-2.5 border-b border-emerald-100 flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Matched to Your Shelter</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Status: {m.donation_status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-semibold text-emerald-700">
                            Match Score: {m.score ? m.score.toFixed(1) : "—"} / 100
                          </span>
                          <Link to={`/track/${m.donation_id}`} className="text-emerald-700 hover:underline flex items-center gap-1 font-medium">
                            Live Track <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>

                      <div className="p-6 flex flex-col lg:flex-row justify-between gap-6">
                        <div className="space-y-4 flex-1">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-text">
                                {m.donation_quantity} {m.donation_unit} of {m.donation_food_type}
                              </h3>
                              <Badge variant="info">{m.donation_food_category}</Badge>
                            </div>
                            <p className="text-text-secondary mt-1 flex items-center gap-1 text-sm">
                              <MapPin className="w-4 h-4 text-text-muted" />
                              Pickup Origin: {m.donation_pickup_address}
                            </p>
                          </div>

                          {/* Explainability Breakdown */}
                          {m.reasoning?.explanation && (
                            <div className="bg-surface-alt/70 rounded-xl p-4 border border-border text-xs space-y-1.5">
                              <p className="font-bold text-text mb-2">Why Our Shelter Was Selected:</p>
                              {m.reasoning.explanation.map((exp: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-text-secondary">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>{exp}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Route & Action Column */}
                        <div className="w-full lg:w-64 space-y-3 shrink-0">
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-surface-alt p-2.5 rounded-lg border border-border">
                              <p className="text-[10px] uppercase font-semibold text-text-muted">Safe Margin</p>
                              <p className="text-base font-bold text-amber-600">{timeLeft}</p>
                            </div>
                            <div className="bg-surface-alt p-2.5 rounded-lg border border-border">
                              <p className="text-[10px] uppercase font-semibold text-text-muted">Road Dist</p>
                              <p className="text-base font-bold text-text">{m.distance_km ? `${m.distance_km} km` : "—"}</p>
                            </div>
                          </div>

                          {m.driver_name && (
                            <div className="bg-blue-50/70 border border-blue-100 p-2.5 rounded-lg text-xs">
                              <p className="font-semibold text-blue-900 flex items-center gap-1">
                                <Truck className="h-3.5 w-3.5" /> Assigned Driver:
                              </p>
                              <p className="text-blue-800 font-medium mt-0.5">{m.driver_name} ({m.driver_vehicle_type})</p>
                              <p className="text-blue-600 text-[11px] mt-0.5">📞 {m.driver_phone}</p>
                            </div>
                          )}

                          <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5"
                            loading={isConfirming}
                            disabled={isConfirming}
                            onClick={() => handleConfirmReceived(m.donation_id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Confirm Food Received
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Deliveries History */}
          {pastMatches.length > 0 && (
            <div className="space-y-3 pt-4">
              <h2 className="text-base font-bold text-text">Past Delivered Rescues</h2>
              <Card className="border border-border">
                {pastMatches.map((m, i) => (
                  <div
                    key={m.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      i < pastMatches.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-text">
                          {m.donation_quantity} {m.donation_unit} of {m.donation_food_type}
                        </p>
                        <p className="text-xs text-text-muted">Origin: {m.donation_pickup_address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-emerald-700">Delivered & Received</span>
                      <Link to={`/track/${m.donation_id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Tracking Log
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </>
      ) : (
        <EmptyState title="No Shelter Selected" description="Please choose an organization from the switcher." />
      )}
    </div>
  );
}
