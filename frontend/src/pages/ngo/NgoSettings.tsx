import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Card, Button, Input, Select } from "../../components/ui";

export function NgoSettings() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg hover:bg-surface-alt text-text-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text">NGO Settings</h1>
          <p className="text-text-secondary">Configure capacity for the matching engine</p>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-8">

          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-border pb-2">Status & Capacity</h2>
            <p className="text-sm text-text-secondary pb-2">
              Update these regularly. The algorithm uses available capacity to prevent sending you more than you can handle.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Currently accepting donations?"
                options={[
                  { value: "yes", label: "Yes, Open" },
                  { value: "no", label: "No, Closed" },
                ]}
              />
              <Input
                type="number"
                label="Available Capacity (portions)"
                placeholder="e.g. 100"
                hint="How many meals can you accept right now?"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-border pb-2">Food Preferences</h2>

            <p className="text-sm font-medium text-text mb-2">Accepted Categories</p>
            <div className="space-y-2">
              {['Cooked Meals', 'Fresh Produce', 'Baked Goods', 'Packaged / Dry'].map(cat => (
                <label key={cat} className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-border text-primary-600 focus:ring-primary-500 w-4 h-4" defaultChecked />
                  <span className="text-sm text-text">{cat}</span>
                </label>
              ))}
            </div>

            <p className="text-sm font-medium text-text mt-4 mb-2">Current Urgent Needs</p>
            <div className="space-y-2">
              {['Cooked Meals', 'Fresh Produce', 'Baked Goods', 'Packaged / Dry'].map(cat => (
                <label key={cat} className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-border text-urgent-600 focus:ring-urgent-500 w-4 h-4" />
                  <span className="text-sm text-text">{cat}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-text-secondary">
              Marking an urgent need boosts your match score for that specific food type.
            </p>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>

        </div>
      </Card>
    </div>
  );
}
