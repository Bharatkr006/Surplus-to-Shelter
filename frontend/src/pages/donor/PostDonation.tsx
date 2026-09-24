import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { Card, Button, Input, Select, Textarea } from "../../components/ui";
import { notifyDataUpdated } from "../../lib/realtime";

export function PostDonation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default times: prepared now, safe until now + 4 hours
  const now = new Date();
  const preparedDefault = new Date(now.getTime() - 10 * 60000).toISOString().slice(0, 16);
  const safeDefault = new Date(now.getTime() + 4 * 3600000).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    food_type: "",
    food_category: "Cooked Meals",
    description: "",
    quantity: "",
    unit: "Portions",
    prepared_at: preparedDefault,
    safe_until: safeDefault,
    pickup_address: "",
    pickup_lat: "26.8228",
    pickup_lng: "75.8660",
    food_image_url: ""
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!formData.food_type.trim()) {
        throw new Error("Please specify the food item description");
      }
      if (Number(formData.quantity) <= 0) {
        throw new Error("Quantity must be greater than 0");
      }
      if (new Date(formData.safe_until) <= new Date(formData.prepared_at)) {
        throw new Error("Safe Until time must be after Prepared At time");
      }
      if (!formData.pickup_address.trim()) {
        throw new Error("Please enter a pickup address");
      }
      
      const res = await fetch("/api/donations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity),
          pickup_lat: Number(formData.pickup_lat),
          pickup_lng: Number(formData.pickup_lng),
          prepared_at: new Date(formData.prepared_at).toISOString(),
          safe_until: new Date(formData.safe_until).toISOString()
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to post donation");
      }
      
      // Notify all other dashboards and tabs immediately
      notifyDataUpdated();

      // Navigate to tracking screen for this newly created real donation
      navigate(`/track/${data.id}?just_posted=true`);
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Link to="/donor" className="p-2 -ml-2 rounded-lg hover:bg-surface-alt text-text-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text">Post Surplus Food</h1>
          <p className="text-text-secondary text-xs">Enter surplus food details to save and match with recipient shelters</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-danger-50 text-danger-700 rounded-lg text-sm border border-danger-200">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b border-border pb-2 text-text">Food Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Food Item / Title"
                name="food_type"
                required
                placeholder="e.g. Cooked Rice & Curry, Sandwiches"
                value={formData.food_type}
                onChange={handleChange}
              />
              <Select
                label="Food Category"
                name="food_category"
                value={formData.food_category}
                onChange={handleChange}
                options={[
                  { value: "Cooked Meals", label: "Cooked Meals (Hot/Prepared)" },
                  { value: "Rice & Grains", label: "Rice & Grains" },
                  { value: "Vegetables", label: "Fresh Vegetables" },
                  { value: "Bakery", label: "Bakery & Bread" },
                  { value: "Fruits", label: "Fresh Fruits" },
                  { value: "Dairy", label: "Dairy Products" },
                  { value: "Packaged Food", label: "Packaged / Canned Food" },
                  { value: "Other", label: "Other" }
                ]}
              />
            </div>

            <Textarea
              label="Description & Packaging Notes"
              name="description"
              required
              rows={2}
              placeholder="e.g. Vegetarian, hot-packed in clean stainless containers. No allergens."
              value={formData.description}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantity"
                name="quantity"
                type="number"
                min="1"
                required
                placeholder="e.g. 40"
                value={formData.quantity}
                onChange={handleChange}
              />
              <Select
                label="Unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                options={[
                  { value: "Portions", label: "Portions (Meals)" },
                  { value: "kg", label: "Kilograms (kg)" },
                  { value: "Trays", label: "Catering Trays" },
                  { value: "Boxes", label: "Boxes" }
                ]}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b border-border pb-2 text-text">Expiry & Food Safety</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prepared At"
                name="prepared_at"
                type="datetime-local"
                required
                value={formData.prepared_at}
                onChange={handleChange}
              />
              <Input
                label="Safe Until (Food Expiry Deadline)"
                name="safe_until"
                type="datetime-local"
                required
                value={formData.safe_until}
                onChange={handleChange}
              />
            </div>
            <p className="text-[11px] text-text-muted">
              The matching engine verifies that transit and pickup buffer will complete before this safe deadline.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b border-border pb-2 text-text">Pickup Location</h3>
            
            <Input
              label="Street Address / Building"
              name="pickup_address"
              required
              placeholder="e.g. 15 Malviya Nagar, Jaipur"
              value={formData.pickup_address}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                name="pickup_lat"
                required
                value={formData.pickup_lat}
                onChange={handleChange}
              />
              <Input
                label="Longitude"
                name="pickup_lng"
                required
                value={formData.pickup_lng}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Link to="/donor">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button
              type="submit"
              loading={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Post Surplus Food → Find Match
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
