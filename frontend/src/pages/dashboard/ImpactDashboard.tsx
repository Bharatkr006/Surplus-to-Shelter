import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Leaf, Utensils, Route, Target, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, Button, LoadingSpinner } from "../../components/ui";
import { subscribeDataUpdated } from "../../lib/realtime";

export function ImpactDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchImpact = async () => {
    try {
      const res = await fetch("/api/impact/");
      const data = await res.json();
      setMetrics(data.metrics || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImpact();
    const unsubscribe = subscribeDataUpdated(fetchImpact, 3000);
    return () => unsubscribe();
  }, []);

  // Dynamic pipeline chart from purely real DB metrics
  const chartData = [
    { name: "Posted", value: metrics?.total_donations_posted || 0, fill: "#f59e0b" },
    { name: "Matched", value: metrics?.total_matches_created || 0, fill: "#3b82f6" },
    { name: "In Transit", value: metrics?.active_donations || 0, fill: "#8b5cf6" },
    { name: "Delivered", value: metrics?.successful_deliveries || 0, fill: "#10b981" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text">City-Wide Impact Analytics</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Live Real-Time Database
            </span>
          </div>
          <p className="text-text-secondary text-sm mt-0.5">
            Real-time rescue metrics calculated directly from verified deliveries and donation records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchImpact}
            title="Refresh impact metrics"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Real Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-t-4 border-t-emerald-500 shadow-xs">
              <CardHeader className="p-5">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Meals Rescued
                  </CardTitle>
                  <Utensils className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-black text-text">
                    {metrics?.total_portions_rescued ?? 0}
                    <span className="text-sm font-normal text-text-muted ml-1">portions</span>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium mt-1">Safely delivered to shelters</p>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-t-4 border-t-teal-500 shadow-xs">
              <CardHeader className="p-5">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Food Weight Diverted
                  </CardTitle>
                  <Leaf className="h-4 w-4 text-teal-600" />
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-black text-text">
                    {metrics?.estimated_weight_kg ?? 0}
                    <span className="text-sm font-normal text-text-muted ml-1">kg</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">Saved from landfill decay</p>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-t-4 border-t-green-600 shadow-xs">
              <CardHeader className="p-5">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    CO₂e Avoided
                  </CardTitle>
                  <Target className="h-4 w-4 text-green-600" />
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-black text-text">
                    {metrics?.estimated_co2e_avoided_kg ?? 0}
                    <span className="text-sm font-normal text-text-muted ml-1">kg CO₂e</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">Based on 2.5 kg CO₂e / kg food</p>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-t-4 border-t-blue-500 shadow-xs">
              <CardHeader className="p-5">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Deliveries Completed
                  </CardTitle>
                  <Route className="h-4 w-4 text-blue-600" />
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-black text-text">
                    {metrics?.successful_deliveries ?? 0}
                    <span className="text-sm font-normal text-text-muted ml-1">rescues</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">{metrics?.active_donations ?? 0} currently in transit</p>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Charts & Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-text">Live Platform Pipeline Activity</CardTitle>
                <p className="text-xs text-text-secondary">Real distribution of rescues across active pipeline stages</p>
              </CardHeader>
              <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} textAnchor="middle" />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.03)" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-text">Core Matching Engine Factors</CardTitle>
                <p className="text-xs text-text-secondary">Normalized weights governing candidate recipient scoring</p>
              </CardHeader>
              <div className="space-y-3.5 mt-2 text-xs">
                {[
                  { factor: "Road Distance & Proximity", weight: "20%", color: "bg-blue-500", desc: "Penalizes excessive road transit distance via OSRM" },
                  { factor: "Capacity Fit & Headroom", weight: "20%", color: "bg-emerald-500", desc: "Filter + rewards headroom above requested quantity" },
                  { factor: "Food Category Compatibility", weight: "20%", color: "bg-purple-500", desc: "Rejection filter if food is not in accepted list" },
                  { factor: "Expiry Safety Window", weight: "20%", color: "bg-amber-500", desc: "Disqualifies routes exceeding safe safe_until deadline" },
                  { factor: "Recipient Priority Need", weight: "10%", color: "bg-red-500", desc: "Boosts shelters actively needing this food category" },
                  { factor: "Volunteer Driver Availability", weight: "10%", color: "bg-cyan-500", desc: "Rewards shelters with immediately dispatchable drivers" },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-text">{item.factor}</span>
                      <span className="font-mono font-bold text-text">{item.weight}</span>
                    </div>
                    <div className="w-full bg-surface-alt rounded-full h-1.5 overflow-hidden">
                      <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: item.weight }} />
                    </div>
                    <p className="text-[10px] text-text-muted">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
