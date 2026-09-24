import { useEffect, useState, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, Clock, MapPin, Package,
  XCircle, Star, Truck, ChevronDown, ChevronUp, Zap, AlertTriangle, RefreshCw
} from "lucide-react";
import { Card, Badge, LoadingSpinner, EmptyState, Button } from "../../components/ui";
import { subscribeDataUpdated, notifyDataUpdated } from "../../lib/realtime";

function formatTimeRemaining(safeUntilISO: string) {
  if (!safeUntilISO) return "—";
  const safeUntil = new Date(safeUntilISO).getTime();
  const now = new Date().getTime();
  const diff = safeUntil - now;
  if (diff <= 0) return "EXPIRED";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m left`;
}

// --------------- Leaflet Map Component ---------------
function MatchMap({
  pickupLat, pickupLng,
  orgLat, orgLng,
  orgName,
  routeProvider,
  driverName,
  driverVehicle
}: {
  pickupLat: number; pickupLng: number;
  orgLat: number; orgLng: number;
  orgName: string;
  routeProvider: string;
  driverName?: string;
  driverVehicle?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const bounds: [[number, number], [number, number]] = [
        [Math.min(pickupLat, orgLat), Math.min(pickupLng, orgLng)],
        [Math.max(pickupLat, orgLat), Math.max(pickupLng, orgLng)],
      ];

      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false });
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Pickup marker (Amber/Green)
      const pickupIcon = L.divIcon({
        className: "",
        html: `<div style="background:#d97706;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 10px rgba(0,0,0,0.3);border:2px solid white;">🍱</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      // Recipient Shelter marker (Emerald)
      const orgIcon = L.divIcon({
        className: "",
        html: `<div style="background:#059669;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 10px rgba(0,0,0,0.3);border:2px solid white;">🏛️</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      L.marker([pickupLat, pickupLng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup("<b>📍 Donor Pickup Origin</b><br/>Surplus food location");

      L.marker([orgLat, orgLng], { icon: orgIcon })
        .addTo(map)
        .bindPopup(`<b>🏛️ Selected Recipient</b><br/>${orgName}`);

      // Driver marker midpoint if available
      if (driverName) {
        const midLat = (pickupLat + orgLat) / 2;
        const midLng = (pickupLng + orgLng) / 2;
        const driverIcon = L.divIcon({
          className: "",
          html: `<div style="background:#2563eb;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 3px 10px rgba(0,0,0,0.3);border:2px solid white;">🚚</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        L.marker([midLat, midLng], { icon: driverIcon })
          .addTo(map)
          .bindPopup(`<b>🚚 Assigned Driver</b><br/>${driverName} (${driverVehicle || 'Vehicle'})`);
      }

      // Draw route line
      const lineStyle = routeProvider === "OSRM"
        ? { color: "#059669", weight: 4, opacity: 0.85 }
        : { color: "#d97706", weight: 3, opacity: 0.7, dashArray: "8 4" };

      L.polyline([[pickupLat, pickupLng], [orgLat, orgLng]], lineStyle).addTo(map);

      map.fitBounds(bounds, { padding: [50, 50] });
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [pickupLat, pickupLng, orgLat, orgLng, driverName, driverVehicle, routeProvider]);

  return (
    <div className="relative">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ height: "300px", width: "100%", borderRadius: "12px", overflow: "hidden" }} />
      <div className="absolute bottom-2 left-2 bg-surface/90 backdrop-blur-xs border border-border text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-xs">
        {routeProvider === "OSRM" ? (
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Road Route verified via OSRM Engine
          </span>
        ) : (
          <span className="text-amber-700 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Estimated straight-line geometry (Fallback Provider)
          </span>
        )}
      </div>
    </div>
  );
}

// --------------- Visual Score Bar ---------------
function ScoreBar({ label, value, color = "#16a34a" }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary font-medium">{label}</span>
        <span className="font-bold font-mono" style={{ color }}>{value.toFixed(0)} / 100</span>
      </div>
      <div className="w-full bg-surface-alt rounded-full h-2 overflow-hidden border border-border/40">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// --------------- Main Component ---------------
export function TrackDonation() {
  const { id } = useParams();
  const location = useLocation();
  const [donation, setDonation] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showRejected, setShowRejected] = useState(true);
  const [runMatchError, setRunMatchError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [donRes, matchRes] = await Promise.all([
        fetch(`/api/donations/${id}`),
        fetch(`/api/matches/donation/${id}`)
      ]);
      if (!donRes.ok) throw new Error();
      const donData = await donRes.json();
      setDonation(donData);

      if (matchRes.ok) {
        const matchData = await matchRes.json();
        if (matchData.match) {
          setMatch(matchData.match);
        }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubscribe = subscribeDataUpdated(fetchData, 3000);
    return () => unsubscribe();
  }, [id]);

  const handleRunMatching = async () => {
    setMatchLoading(true);
    setRunMatchError(null);
    try {
      const res = await fetch(`/api/matches/run/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Matching failed");
      await fetchData();
      notifyDataUpdated();
    } catch (err: any) {
      setRunMatchError(err.message || "Matching failed");
    } finally {
      setMatchLoading(false);
    }
  };

  if (loading) return <div className="py-24 flex justify-center"><LoadingSpinner /></div>;
  if (error || !donation) return (
    <div className="max-w-3xl mx-auto">
      <Link to="/donor" className="inline-flex items-center text-text-secondary hover:text-text mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Donor Dashboard
      </Link>
      <EmptyState title="Donation Not Found" description="The donation ID provided does not exist or has been removed." />
    </div>
  );

  const statusList = [
    { key: "POSTED", label: "Surplus Food Posted" },
    { key: "MATCHING", label: "Evaluating Candidates" },
    { key: "MATCHED", label: "Best Recipient Matched" },
    { key: "DRIVER_ASSIGNED", label: "Driver Dispatched" },
    { key: "PICKED_UP", label: "Food Picked Up" },
    { key: "DELIVERED", label: "Delivered to Shelter" }
  ];
  const currentStatusIndex = statusList.findIndex(s => s.key === donation.status);

  const reasoning = match?.reasoning || null;
  const selectedMatch = reasoning ? {
    score: match.score,
    score_breakdown: reasoning.score_breakdown,
    explanation: reasoning.explanation,
    route: reasoning.route,
    eligible_candidates: reasoning.eligible_candidates || [],
    rejected_candidates: reasoning.rejected_candidates || [],
  } : null;

  const hasMatchData = ["MATCHED", "DRIVER_ASSIGNED", "PICKED_UP", "DELIVERED"].includes(donation.status) && selectedMatch;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/donor" className="p-2 -ml-2 rounded-lg hover:bg-surface-alt text-text-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text mb-0.5 flex items-center gap-2">
              <span>Food Rescue Tracker</span>
              <Badge variant={donation.status === "DELIVERED" ? "success" : "info"}>
                {donation.status}
              </Badge>
            </h1>
            <p className="text-text-secondary text-xs font-mono">
              Donation #{donation.id.slice(0, 8)} • {donation.quantity} {donation.unit} of {donation.food_type}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchData} title="Refresh live status">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {location.search.includes("just_posted=true") && donation.status === "POSTED" && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>Surplus food posted successfully! Click <strong>"Find Best Match"</strong> below to run the real-time matching engine.</span>
          </div>
        </div>
      )}

      {/* ---- MATCH RESULT SECTION (Visible across MATCHED, PICKED_UP, DELIVERED) ---- */}
      {hasMatchData && (
        <Card className="border-2 border-emerald-500/30 shadow-md overflow-hidden">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4.5 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">
                      Optimal Recipient Selected
                    </span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">
                      Algorithm Match
                    </span>
                  </div>
                  <h2 className="text-white text-2xl font-extrabold mt-0.5">{match.organization_name}</h2>
                  <p className="text-emerald-100 text-xs mt-0.5">{match.organization_address}</p>
                </div>
              </div>

              <div className="text-right bg-white/10 px-4 py-2 rounded-xl border border-white/20 backdrop-blur-xs shrink-0">
                <p className="text-emerald-100 text-[10px] uppercase font-bold tracking-wider">Total Match Score</p>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-white text-3xl font-black">{selectedMatch.score.toFixed(1)}</span>
                  <span className="text-emerald-200 text-xs font-semibold">/ 100</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-surface-alt rounded-xl border border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted">Road Distance</p>
                  <p className="font-bold text-base text-text">{selectedMatch.route.distance_km} km</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted">Driving ETA</p>
                  <p className="font-bold text-base text-text">{selectedMatch.route.estimated_minutes} mins</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted">Routing Provider</p>
                  <p className="font-bold text-base text-emerald-600">{selectedMatch.route.provider}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted">Assigned Driver</p>
                  <p className="font-bold text-sm text-text truncate max-w-[120px]">
                    {match.driver_name || "Available"}
                  </p>
                </div>
              </div>
            </div>

            {/* WHY THIS MATCH? */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4.5">
              <h3 className="font-bold text-sm text-emerald-900 mb-2.5 flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                Why Was This Recipient Selected?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-950">
                {selectedMatch.explanation.map((reason: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SCORE BREAKDOWN BARS */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-text flex items-center gap-2">
                  <span>Multi-Factor Scoring Breakdown</span>
                  <span className="text-[11px] font-normal text-text-muted">(Engine Factors)</span>
                </h3>
                <span className="text-xs text-text-muted font-mono">Weighted Total: {selectedMatch.score.toFixed(1)}/100</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 bg-surface p-4 rounded-xl border border-border">
                {[
                  { key: "distance", label: "Distance & Proximity (20%)", color: "#2563eb" },
                  { key: "capacity", label: "Capacity Fit & Headroom (20%)", color: "#16a34a" },
                  { key: "food_compatibility", label: "Food Compatibility (20%)", color: "#9333ea" },
                  { key: "urgency", label: "Expiry Urgency & Margin (20%)", color: "#ea580c" },
                  { key: "need", label: "Recipient Priority Need (10%)", color: "#dc2626" },
                  { key: "driver", label: "Driver Availability (10%)", color: "#0891b2" },
                ].map(({ key, label, color }) => (
                  <ScoreBar
                    key={key}
                    label={label}
                    value={selectedMatch.score_breakdown?.[key] ?? 0}
                    color={color}
                  />
                ))}
              </div>
            </div>

            {/* ROUTE MAP */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-text">Interactive Road Route Map</h3>
                <span className="text-xs text-text-muted">OSRM Route Analysis</span>
              </div>
              <MatchMap
                pickupLat={donation.pickup_lat}
                pickupLng={donation.pickup_lng}
                orgLat={match.organization_lat}
                orgLng={match.organization_lng}
                orgName={match.organization_name}
                routeProvider={selectedMatch.route.provider}
                driverName={match.driver_name}
                driverVehicle={match.driver_vehicle_type}
              />
            </div>
          </div>
        </Card>
      )}

      {/* ---- WHY NOT OTHER RECIPIENTS? ---- */}
      {selectedMatch && (
        <div className="space-y-3">
          <Card className="border border-border">
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-sm text-text flex items-center gap-2">
                    <span className="text-base">⚖️</span>
                    <span>Why Not Other Candidates? (Candidate Evaluation Summary)</span>
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Proves intelligent multi-factor matching over naive nearest-neighbor lookup
                  </p>
                </div>
                <button
                  onClick={() => setShowRejected(!showRejected)}
                  className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showRejected ? "Hide Details" : "Show Details"}
                  {showRejected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showRejected && (
                <div className="mt-4 space-y-3">
                  {/* Rejected Candidates List */}
                  {selectedMatch.rejected_candidates.map((candidate: any, i: number) => (
                    <div
                      key={i}
                      className="p-3.5 bg-danger-50/70 border border-danger-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-sm text-danger-900">{candidate.organization_name}</p>
                          <Badge variant="danger">REJECTED</Badge>
                          <span className="text-xs text-text-muted">
                            ({candidate.distance_km} km away • {candidate.estimated_minutes} min ETA)
                          </span>
                        </div>
                        <div className="space-y-1 mt-1">
                          {candidate.reasons.map((reason: string, j: number) => (
                            <div key={j} className="flex items-center gap-1.5 text-xs font-medium text-danger-800">
                              <XCircle className="w-3.5 h-3.5 text-danger-600 shrink-0" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-semibold text-danger-700 bg-white px-2.5 py-1 rounded-md border border-danger-200">
                          Disqualified
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Other Eligible Runners-up if any */}
                  {selectedMatch.eligible_candidates
                    .filter((c: any) => c.organization_id !== match.organization_id)
                    .map((runnerUp: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 bg-surface-alt border border-border rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-sm text-text">{runnerUp.organization_name}</p>
                          <p className="text-xs text-text-muted">
                            {runnerUp.route.distance_km} km • Score: {runnerUp.score.toFixed(1)} / 100
                          </p>
                        </div>
                        <Badge variant="info">Runner-up Match</Badge>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ---- RUN MATCHING CALLOUT (When donation is POSTED) ---- */}
      {donation.status === "POSTED" && (
        <Card className="border-2 border-primary-400 bg-primary-50/30">
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Zap className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="font-bold text-lg text-text">Ready to Dispatch Matching Engine</h3>
              <p className="text-text-secondary text-xs mt-1">
                Evaluate candidate shelters for capacity, food compatibility, expiry margin, and volunteer driver availability.
              </p>
            </div>
            {runMatchError && (
              <div className="p-3 bg-danger-50 text-danger-700 rounded-lg text-xs border border-danger-200 max-w-md mx-auto">
                {runMatchError}
              </div>
            )}
            <Button
              id="run-matching-btn"
              onClick={handleRunMatching}
              loading={matchLoading}
              disabled={matchLoading}
              className="w-full max-w-sm mx-auto bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 shadow-md cursor-pointer"
            >
              <Zap className="w-4 h-4 mr-2" />
              {matchLoading ? "Evaluating Shelters & Routing..." : "Find Best Match"}
            </Button>
          </div>
        </Card>
      )}

      {donation.status === "MATCHING" && (
        <Card>
          <div className="p-8 text-center space-y-3">
            <LoadingSpinner />
            <p className="font-bold text-base text-text">Matching Engine Evaluating Candidates…</p>
            <p className="text-text-secondary text-xs">Computing road routes via OSRM, checking safe windows and shelter capacities.</p>
          </div>
        </Card>
      )}

      {/* ---- DONATION DETAILS & TIMELINE ---- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-base font-bold mb-4 flex items-center border-b border-border pb-3 text-text">
                <Package className="mr-2 h-4 w-4 text-primary-600" />
                Donation Details
              </h2>
              <div className="grid grid-cols-2 gap-y-4 text-xs">
                <div>
                  <p className="text-text-muted uppercase tracking-wider font-semibold">Food Type</p>
                  <p className="font-bold mt-1 text-sm text-text">{donation.food_type}</p>
                  <Badge variant="info" className="mt-1">{donation.food_category}</Badge>
                </div>
                <div>
                  <p className="text-text-muted uppercase tracking-wider font-semibold">Quantity</p>
                  <p className="font-bold mt-1 text-sm text-text">{donation.quantity} {donation.unit}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-text-muted uppercase tracking-wider font-semibold">Description</p>
                  <p className="font-medium mt-1 text-text-secondary">{donation.description}</p>
                </div>
                <div>
                  <p className="text-text-muted uppercase tracking-wider font-semibold">Prepared At</p>
                  <p className="font-medium mt-1">{new Date(donation.prepared_at).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-text-muted uppercase tracking-wider font-semibold">Safe Window</p>
                  <p className="font-bold mt-1 text-amber-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTimeRemaining(donation.safe_until)}
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-border/60">
                  <p className="text-text-muted uppercase tracking-wider font-semibold">Pickup Address</p>
                  <p className="font-medium mt-1 text-text flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span>{donation.pickup_address}</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Rescue Progression Timeline */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-5">
              <h2 className="font-bold mb-4 text-sm border-b border-border pb-2 text-text">
                Rescue Progression
              </h2>
              <div className="space-y-6 relative text-xs">
                <div className="absolute left-3 top-2 bottom-4 w-0.5 bg-border z-0" />
                {statusList.map((step, i) => {
                  const isDone = currentStatusIndex >= i && !["EXPIRED", "CANCELLED"].includes(donation.status);
                  const isCurrent = currentStatusIndex === i && !["EXPIRED", "CANCELLED"].includes(donation.status);
                  return (
                    <div key={i} className={`flex gap-3 relative z-10 ${i > currentStatusIndex + 1 ? "opacity-40" : ""}`}>
                      <div className={`mt-0.5 rounded-full bg-surface border-2 flex-shrink-0 w-6 h-6 flex items-center justify-center
                        ${isDone ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "border-border text-transparent"}
                        ${isCurrent ? "ring-4 ring-primary-100 bg-primary-50 border-primary-500" : ""}`}>
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {!isDone && <div className="w-1.5 h-1.5 rounded-full bg-border" />}
                      </div>
                      <div>
                        <p className={`font-semibold ${isDone ? "text-text" : "text-text-secondary"} ${isCurrent ? "text-primary-700 font-bold" : ""}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] text-primary-700 font-bold mt-0.5 bg-primary-100 inline-block px-1.5 py-0.5 rounded">
                            Current Stage
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
