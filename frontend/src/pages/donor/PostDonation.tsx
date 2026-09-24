import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, PlusCircle } from "lucide-react";
import { Card, Button, Input, Select, Textarea } from "../../components/ui";

export function PostDonation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default times: prepared now - 30m, safe until now + 4h
  const now = new Date();
  const preparedDefault = new Date(now.getTime() - 30 * 60000).toISOString().slice(0, 16);
  const safeDefault = new Date(now.getTime() + 4 * 3600000).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    food_type: "",
    food_category: "Cooked Meals",
    description: "",
    quantity: "",
    unit: "Portions",
    prepared_at: preparedDefault,
    safe_until: safeDefault,
    pickup_address: "SKIT Campus Hostel, Ramnagaria, Jaipur",
    pickup_lat: "26.8228",
    pickup_lng: "75.8660",
    food_image_url: ""
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 1-Click Demo Scenario Auto-Fill
  const handleFillDemoScenario = () => {
    const currentNow = new Date();
    setFormData({
      food_type: "Fresh Dal Makhani & Jeera Rice (40 Portions)",
      food_category: "Cooked Meals",
      description: "Hot, freshly prepared vegetarian meals from hostel luncheon. Packed in clean insulated containers.",
      quantity: "40",
      unit: "Portions",
      prepared_at: new Date(currentNow.getTime() - 40 * 60000).toISOString().slice(0, 16),
      safe_until: new Date(currentNow.getTime() + 3.5 * 3600000).toISOString().slice(0, 16),
      pickup_address: "SKIT Campus Hostel, Ramnagaria, Jaipur",
      pickup_lat: "26.8228",
      pickup_lng: "75.8660",
      food_image_url: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (Number(formData.quantity) <= 0) {
        throw new Error("Quantity must be greater than 0");
      }
      if (new Date(formData.safe_until) <= new Date(formData.prepared_at)) {
        throw new Error("Safe Until time must be after Prepared At time");
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
      
      // Directly navigate to tracking screen with "just_posted" parameter so user can immediately click "Find Best Match"
      navigate(`/track/${data.id}?just_posted=true`);
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/donor" className="p-2 -ml-2 rounded-lg hover:bg-surface-alt text-text-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text">Post Surplus Food</h1>
            <p className="text-text-secondary text-xs">Enter food surplus details to dispatch to matching shelters</p>
          </div>
        </div>

        {/* 1-Click Demo Helper */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-semibold"
          onClick={handleFillDemoScenario}
        >
          <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
          Auto-Fill Demo Scenario (40 Portions)
        </Button>
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
                label="Food Description (e.g. Rice & Dal)"
                name="food_type"
                required
                placeholder="e.g. Dal Makhani & Jeera Rice"
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
              label="Detailed Notes (Allergens, packaging, dietary info)"
              name="description"
              required
              rows={2}
              placeholder="e.g. Vegetarian, freshly prepared, packed in food-grade stainless containers."
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
                placeholder="40"
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
            <h3 className="font-semibold text-sm border-b border-border pb-2 text-text">Expiry & Safety Window</h3>
            
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
                label="Safe Until (Food Safety Expiry)"
                name="safe_until"
                type="datetime-local"
                required
                value={formData.safe_until}
                onChange={handleChange}
              />
            </div>
            <p className="text-[11px] text-text-muted">
              The matching engine calculates route ETA + 15 min buffer to ensure delivery completes before this deadline.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b border-border pb-2 text-text">Pickup Location</h3>
            
            <Input
              label="Street Address"
              name="pickup_address"
              required
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
