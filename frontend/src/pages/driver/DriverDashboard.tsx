import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  CheckCircle2,
  Navigation,
  Clock,
  MapPin,
  Package,
  Phone,
  Power,
  RefreshCw,
  ExternalLink,
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

export function DriverDashboard() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [currentDriver, setCurrentDriver] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDrivers = async () => {
    try {
      const res = await fetch("/api/drivers/");
      const data = await res.json();
      const list = data.drivers || [];
      setDrivers(list);

      if (list.length > 0) {
        if (!selectedDriverId) {
          const preferred = list[0];
          setSelectedDriverId(preferred.id);
          setCurrentDriver(preferred);
        } else {
          const found = list.find((d: any) => d.id === selectedDriverId);
          if (found) setCurrentDriver(found);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const res = await fetch("/api/deliveries/");
      const data = await res.json();
      setDeliveries(data.deliveries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchDeliveries();

    // Subscribe to cross-dashboard and cross-tab events + 3s safety polling
    const unsubscribe = subscribeDataUpdated(() => {
      fetchDrivers();
      fetchDeliveries();
    }, 3000);

    return () => unsubscribe();
  }, [selectedDriverId]);

  const handleDriverChange = (driverId: string) => {
    setSelectedDriverId(driverId);
    const d = drivers.find((item) => item.id === driverId);
    if (d) setCurrentDriver(d);
  };

  // Toggle Driver Online / Available
  const handleToggleOnline = async () => {
    if (!currentDriver) return;
    const nextAvail = !currentDriver.is_available;
    const nextStatus = nextAvail ? "IDLE" : "OFFLINE";
    setActionLoading("toggle-status");
    try {
      const res = await fetch(`/api/drivers/${currentDriver.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: nextAvail, status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentDriver(updated);
        await fetchDrivers();
        notifyDataUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Step 1: Mark Picked Up
  const handlePickup = async (matchId: string) => {
    setActionLoading(`pickup-${matchId}`);
    try {
      const res = await fetch(`/api/deliveries/${matchId}/pickup`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchDeliveries();
        await fetchDrivers();
        notifyDataUpdated();
      } else {
        const err = await res.json();
        alert(err.error || "Pickup failed");
      }
    } catch {
      alert("Network error marking pickup");
    } finally {
      setActionLoading(null);
    }
  };

  // Step 2: Mark Delivered
  const handleDeliver = async (matchId: string) => {
    setActionLoading(`deliver-${matchId}`);
    try {
      const res = await fetch(`/api/deliveries/${matchId}/deliver`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchDeliveries();
        await fetchDrivers();
        notifyDataUpdated();
      } else {
        const err = await res.json();
        alert(err.error || "Delivery update failed");
      }
    } catch {
      alert("Network error marking delivery");
    } finally {
      setActionLoading(null);
    }
  };

  // Step: Claim Unassigned Rescue
  const handleClaim = async (matchId: string) => {
    if (!currentDriver) return;
    setActionLoading(`claim-${matchId}`);
    try {
      const res = await fetch(`/api/deliveries/${matchId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: currentDriver.id }),
      });
      if (res.ok) {
        await fetchDeliveries();
        await fetchDrivers();
        notifyDataUpdated();
      } else {
        const err = await res.json();
        alert(err.error || "Claim failed");
      }
    } catch {
      alert("Network error claiming task");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter deliveries for the selected driver
  const myAssignedDeliveries = deliveries.filter(
    (d) => d.driver_id === selectedDriverId && d.donation_status !== "DELIVERED"
  );
  const myCompletedDeliveries = deliveries.filter(
    (d) => d.driver_id === selectedDriverId && d.donation_status === "DELIVERED"
  );
  // Unassigned deliveries (matches with no driver assigned)
  const unassignedDeliveries = deliveries.filter(
    (d) => !d.driver_id && ["POSTED", "MATCHED"].includes(d.donation_status)
  );

  // Active mission: the first non-completed delivery for this driver
  const activeMission = myAssignedDeliveries[0] || null;

  return (
    <div className="space-y-6">
      {/* Profile Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 shrink-0">
            <Truck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text">Delivery Fleet Portal</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Logistics & Driver Command
              </span>
            </div>
            <p className="text-text-secondary text-sm mt-0.5">
              Pickup donor surplus, navigate optimal road routes, and deliver to recipient shelters in real time.
            </p>
          </div>
        </div>

        {/* Driver Persona Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-surface-alt border border-border rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted">Active Driver:</span>
            <select
              value={selectedDriverId}
              onChange={(e) => handleDriverChange(e.target.value)}
              className="bg-transparent text-sm font-semibold text-text focus:outline-hidden cursor-pointer"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.vehicle_type}) — {d.status}
                </option>
              ))}
            </select>
          </div>

          {currentDriver && (
            <Button
              size="sm"
              variant={currentDriver.is_available ? "outline" : "primary"}
              className={currentDriver.is_available ? "text-danger-600 border-danger-200 cursor-pointer" : "bg-blue-600 cursor-pointer"}
              loading={actionLoading === "toggle-status"}
              onClick={handleToggleOnline}
            >
              <Power className="h-3.5 w-3.5 mr-1" />
              {currentDriver.is_available ? "Go Offline" : "Go Online"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchDrivers();
              fetchDeliveries();
            }}
            title="Refresh deliveries"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Driver Stats & Status Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase">Driver Status</span>
                <Badge variant={currentDriver?.is_available ? "success" : "default"}>
                  {currentDriver?.status || "OFFLINE"}
                </Badge>
              </div>
              <p className="text-xl font-bold text-text mt-2">{currentDriver?.name || "Driver"}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {currentDriver?.vehicle_type} • 📞 {currentDriver?.phone || "No phone"}
              </p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase">Active Mission</span>
                <Truck className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {activeMission ? "1 In Progress" : "No Active Route"}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {activeMission ? `Status: ${activeMission.donation_status}` : "Ready for dispatch"}
              </p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase">Rescues Delivered</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                {myCompletedDeliveries.length}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">Meals safely delivered</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase">Total Fleet Deliveries</span>
                <Package className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-text mt-2">{deliveries.length}</p>
              <p className="text-xs text-text-secondary mt-0.5">Across all volunteer drivers</p>
            </div>
          </div>

          {/* ACTIVE ASSIGNED MISSION CARD */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text flex items-center gap-2">
                <span>Current Rescue Mission</span>
                {activeMission && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                    Live Assignment
                  </span>
                )}
              </h2>
              <Link to="/delivery/tasks" className="text-xs text-primary-600 font-medium hover:underline">
                View Mission History →
              </Link>
            </div>

            {activeMission ? (
              <Card className="border-2 border-blue-500/40 shadow-sm relative overflow-hidden">
                <div className="bg-blue-600 px-6 py-3 text-white flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Navigation className="h-4 w-4 animate-bounce" />
                    <span>Active Route: {activeMission.donation_quantity} {activeMission.donation_unit} of {activeMission.donation_food_type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span>Road Distance: <strong>{activeMission.distance_km} km</strong></span>
                    <span>•</span>
                    <span>ETA: <strong>{activeMission.estimated_minutes} mins</strong></span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Two Step Timeline: Pickup -> Delivery */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                    {/* Step 1: Donor Pickup */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      activeMission.donation_status === "PICKED_UP"
                        ? "bg-surface-alt/60 border-border opacity-70"
                        : "bg-amber-50/60 border-amber-200"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                          <span className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
                            1
                          </span>
                          Pickup from Donor
                        </span>
                        {activeMission.donation_status === "PICKED_UP" ? (
                          <Badge variant="success">Completed ✓</Badge>
                        ) : (
                          <Badge variant="warning">Awaiting Pickup</Badge>
                        )}
                      </div>
                      <p className="font-bold text-base text-text">{activeMission.donation_food_type}</p>
                      <p className="text-xs text-text-secondary mt-1 flex items-start gap-1">
                        <MapPin className="h-3.5 w-3.5 text-text-muted shrink-0 mt-0.5" />
                        <span>{activeMission.donation_pickup_address}</span>
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 text-xs text-amber-700">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Safe window: <strong>{formatTimeRemaining(activeMission.donation_safe_until)}</strong></span>
                      </div>
                    </div>

                    {/* Step 2: Recipient Dropoff */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      activeMission.donation_status === "PICKED_UP"
                        ? "bg-emerald-50/70 border-emerald-300"
                        : "bg-surface-alt/60 border-border opacity-70"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                          <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                            2
                          </span>
                          Deliver to Recipient Shelter
                        </span>
                        {activeMission.donation_status === "PICKED_UP" ? (
                          <Badge variant="info">In Transit Now</Badge>
                        ) : (
                          <Badge variant="default">Next Step</Badge>
                        )}
                      </div>
                      <p className="font-bold text-base text-text">
                        {activeMission.organization_name || "Matched Shelter"}
                      </p>
                      <p className="text-xs text-text-secondary mt-1 flex items-start gap-1">
                        <MapPin className="h-3.5 w-3.5 text-text-muted shrink-0 mt-0.5" />
                        <span>{activeMission.organization_address || "Shelter Dropoff Location"}</span>
                      </p>
                      {activeMission.organization_phone && (
                        <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Contact: {activeMission.organization_phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mission Action Buttons */}
                  <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Link to={`/track/${activeMission.donation_id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Open Live Route & Route Map <ExternalLink className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {["MATCHED", "DRIVER_ASSIGNED"].includes(activeMission.donation_status) && (
                        <Button
                          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2 px-5 cursor-pointer"
                          loading={actionLoading === `pickup-${activeMission.id}`}
                          onClick={() => handlePickup(activeMission.id)}
                        >
                          <Package className="h-4 w-4 mr-1.5" />
                          Confirm Food Picked Up
                        </Button>
                      )}

                      {activeMission.donation_status === "PICKED_UP" && (
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-5 cursor-pointer"
                          loading={actionLoading === `deliver-${activeMission.id}`}
                          onClick={() => handleDeliver(activeMission.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          Complete Delivery & Release Driver
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <EmptyState
                title="No active delivery assigned to this driver"
                description={`${currentDriver?.name || "Driver"} is available for dispatch. Once a donation is matched and assigned, it will appear here automatically.`}
              />
            )}
          </div>

          {/* UNASSIGNED RESCUES POOL (Available to claim) */}
          {unassignedDeliveries.length > 0 && (
            <div className="space-y-3 pt-4">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>Available Rescues Awaiting Driver</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                  {unassignedDeliveries.length} available
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unassignedDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="p-4 border border-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-text">
                          {delivery.donation_quantity} {delivery.donation_unit} of {delivery.donation_food_type}
                        </h4>
                        <p className="text-xs text-text-secondary mt-1">
                          From: {delivery.donation_pickup_address}
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          To: {delivery.organization_name || "Matched Shelter"}
                        </p>
                      </div>
                      <Badge variant="warning">{delivery.distance_km} km</Badge>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex justify-end">
                      <Button
                        size="sm"
                        className="bg-blue-600 text-xs cursor-pointer"
                        loading={actionLoading === `claim-${delivery.id}`}
                        onClick={() => handleClaim(delivery.id)}
                      >
                        Accept Rescue Task
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Missions History */}
          {myCompletedDeliveries.length > 0 && (
            <div className="space-y-3 pt-4">
              <h2 className="text-base font-bold text-text">Completed Deliveries for {currentDriver?.name}</h2>
              <Card className="border border-border">
                {myCompletedDeliveries.map((d, i) => (
                  <div
                    key={d.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      i < myCompletedDeliveries.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-text">
                          {d.donation_quantity} {d.donation_unit} of {d.donation_food_type}
                        </p>
                        <p className="text-xs text-text-muted">
                          Delivered to {d.organization_name || "Shelter"} • Road Distance: {d.distance_km} km
                        </p>
                      </div>
                    </div>
                    <Link to={`/track/${d.donation_id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View Log
                      </Button>
                    </Link>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
