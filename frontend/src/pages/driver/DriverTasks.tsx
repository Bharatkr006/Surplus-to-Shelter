import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Package, CheckCircle2, Truck } from "lucide-react";
import { Card, Badge, LoadingSpinner, EmptyState, Button } from "../../components/ui";

export function DriverTasks() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/deliveries/")
      .then((r) => r.json())
      .then((data) => {
        setDeliveries(data.deliveries || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/delivery" className="p-2 -ml-2 rounded-lg hover:bg-surface-alt text-text-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text">Fleet Mission Log</h1>
          <p className="text-text-secondary text-sm">All dispatched food rescue deliveries and routes</p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : deliveries.length === 0 ? (
        <EmptyState
          title="No rescue missions logged yet"
          description="When matches are formed and drivers assigned, delivery tasks will appear here."
          action={
            <Link to="/donor">
              <Button size="sm">Go to Donor Dashboard</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => {
            const isDelivered = delivery.donation_status === "DELIVERED";
            return (
              <Card key={delivery.id} className="p-5 border border-border shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant={isDelivered ? "success" : "info"}>
                        {isDelivered ? "Delivered ✓" : delivery.donation_status}
                      </Badge>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(delivery.created_at).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-text">
                      {delivery.donation_quantity} {delivery.donation_unit} of {delivery.donation_food_type}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-primary-600">
                      {delivery.distance_km ? `${delivery.distance_km} km` : "—"}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {delivery.estimated_minutes ? `${delivery.estimated_minutes} min route` : "Road route"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 text-xs text-text-secondary bg-surface-alt p-3.5 rounded-xl border border-border">
                  <div className="flex-1">
                    <span className="font-semibold text-text block mb-0.5">Pickup:</span>
                    <span className="text-text-secondary truncate block">{delivery.donation_pickup_address}</span>
                  </div>
                  <div className="text-border hidden md:block">→</div>
                  <div className="flex-1">
                    <span className="font-semibold text-text block mb-0.5">Dropoff:</span>
                    <span className="text-text-secondary truncate block">
                      {delivery.organization_name || "Recipient Shelter"}
                    </span>
                  </div>
                  {delivery.driver_name && (
                    <div className="pt-2 md:pt-0 md:pl-3 border-t md:border-t-0 md:border-l border-border shrink-0">
                      <span className="font-semibold text-text block mb-0.5">Driver:</span>
                      <span className="text-text-secondary">{delivery.driver_name} ({delivery.driver_vehicle_type})</span>
                    </div>
                  )}
                </div>

                <div className="mt-3.5 flex justify-end">
                  <Link to={`/track/${delivery.donation_id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-primary-600">
                      View Full Route & Tracking Details →
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
