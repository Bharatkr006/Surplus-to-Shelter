import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  UtensilsCrossed,
  Building2,
  Truck,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  Building,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Card, Button, Input, Select } from "../../components/ui";
import { useRole, type UserRole } from "../../context/RoleContext";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, role: currentRole } = useRole();

  // If role is passed via query string or default to "donor"
  const searchParams = new URLSearchParams(location.search);
  const initialRole = (searchParams.get("role") as UserRole) || "donor";

  const [selectedRole, setSelectedRole] = useState<"donor" | "recipient" | "delivery">(
    initialRole === "recipient" || initialRole === "delivery" ? initialRole : "donor"
  );

  // Loaded real organizations and drivers for selection
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Form states
  // 1. Donor form
  const [donorName, setDonorName] = useState("SKIT Campus Kitchen");
  const [donorContact, setDonorContact] = useState("Rajesh Sharma");
  const [donorPhone, setDonorPhone] = useState("9876543210");
  const [donorAddress, setDonorAddress] = useState("SKIT Campus Hostel, Ramnagaria, Jaipur");

  // 2. Recipient form
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [recipientContact, setRecipientContact] = useState("Sunita Sharma");
  const [recipientPhone, setRecipientPhone] = useState("9876543211");

  // 3. Driver form
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverVehicle, setDriverVehicle] = useState("Bike");

  useEffect(() => {
    setLoadingOptions(true);
    Promise.all([
      fetch("/api/organizations/").then((r) => r.json()),
      fetch("/api/drivers/").then((r) => r.json()),
    ])
      .then(([orgData, driverData]) => {
        const orgList = orgData.organizations || [];
        setOrganizations(orgList);
        if (orgList.length > 0) {
          const annapurna = orgList.find((o: any) => o.name.includes("Annapurna")) || orgList[0];
          setSelectedOrgId(annapurna.id);
        }

        const driverList = driverData.drivers || [];
        setDrivers(driverList);
        if (driverList.length > 0) {
          setSelectedDriverId(driverList[0].id);
          setDriverName(driverList[0].name);
          setDriverPhone(driverList[0].phone);
          setDriverVehicle(driverList[0].vehicle_type);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingOptions(false));
  }, []);

  const handleDriverSelectChange = (id: string) => {
    setSelectedDriverId(id);
    const found = drivers.find((d) => d.id === id);
    if (found) {
      setDriverName(found.name);
      setDriverPhone(found.phone);
      setDriverVehicle(found.vehicle_type);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === "donor") {
      login({
        role: "donor",
        userName: donorContact || "Donor Admin",
        entityName: donorName || "Surplus Food Donor",
        phone: donorPhone,
        address: donorAddress,
      });
      navigate("/donor");
    } else if (selectedRole === "recipient") {
      const org = organizations.find((o) => o.id === selectedOrgId);
      login({
        role: "recipient",
        userName: recipientContact || "Shelter In-Charge",
        entityName: org?.name || "Recipient Shelter",
        activeOrgId: selectedOrgId,
        phone: recipientPhone,
        address: org?.address || "",
      });
      navigate("/recipient");
    } else if (selectedRole === "delivery") {
      const drv = drivers.find((d) => d.id === selectedDriverId);
      login({
        role: "delivery",
        userName: driverName || drv?.name || "Volunteer Driver",
        entityName: `${driverName || drv?.name} (${driverVehicle || drv?.vehicle_type || "Vehicle"})`,
        activeDriverId: selectedDriverId,
        phone: driverPhone || drv?.phone,
      });
      navigate("/delivery");
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-8">
      {/* Header Branding */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold shadow-2xs">
          <Zap className="h-3.5 w-3.5 text-primary-600" />
          <span>Surplus-to-Shelter • Unified Authentication</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
          Login to Your Portal
        </h1>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          Select your profile type, enter your details, and access your dedicated real-time dashboard.
        </p>
      </div>

      <Card className="border border-border shadow-md overflow-hidden bg-surface">
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 border-b border-border bg-surface-alt/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedRole("donor")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === "donor"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-text-secondary hover:text-text hover:bg-surface"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4 shrink-0" />
            <span>1. Donor</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("recipient")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === "recipient"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-text-secondary hover:text-text hover:bg-surface"
            }`}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <span>2. Recipient</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("delivery")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === "delivery"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-text-secondary hover:text-text hover:bg-surface"
            }`}
          >
            <Truck className="h-4 w-4 shrink-0" />
            <span>3. Delivery</span>
          </button>
        </div>

        {/* Dynamic Form for Selected Role */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* DONOR FORM */}
          {selectedRole === "donor" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <UtensilsCrossed className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Donor Account Information</p>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    For Restaurants, Hostels, Caterers, and Food Providers posting surplus food.
                  </p>
                </div>
              </div>

              <Input
                label="Organization / Kitchen / Hostel Name"
                required
                placeholder="e.g. SKIT Campus Mess, Green Valley Bistro"
                value={donorName}
                onChange={(e: any) => setDonorName(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contact Person Name"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={donorContact}
                  onChange={(e: any) => setDonorContact(e.target.value)}
                />
                <Input
                  label="Phone Number"
                  required
                  placeholder="e.g. 9876543210"
                  value={donorPhone}
                  onChange={(e: any) => setDonorPhone(e.target.value)}
                />
              </div>

              <Input
                label="Default Pickup Address"
                required
                placeholder="e.g. SKIT Campus Hostel, Ramnagaria, Jaipur"
                value={donorAddress}
                onChange={(e: any) => setDonorAddress(e.target.value)}
              />
            </div>
          )}

          {/* RECIPIENT FORM */}
          {selectedRole === "recipient" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <Building2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Recipient Shelter / NGO Portal</p>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    For Shelters, Community Kitchens, and NGOs receiving and distributing food.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Select Registered Shelter / Organization
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-sm font-medium text-text focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({parseFloat(org.capacity_available).toFixed(0)} available cap) — {org.address}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-text-muted mt-1">
                  Connecting to live database organization profile
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="In-Charge Contact Person"
                  required
                  placeholder="e.g. Sunita Sharma"
                  value={recipientContact}
                  onChange={(e: any) => setRecipientContact(e.target.value)}
                />
                <Input
                  label="Contact Phone"
                  required
                  placeholder="e.g. 9876543211"
                  value={recipientPhone}
                  onChange={(e: any) => setRecipientPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* DELIVERY FLEET FORM */}
          {selectedRole === "delivery" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <Truck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Delivery Driver & Fleet Command</p>
                  <p className="text-blue-800 text-[11px] mt-0.5">
                    For volunteer drivers and fleet operators transporting surplus food from donors to shelters.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Select Registered Driver Profile
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => handleDriverSelectChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-sm font-medium text-text focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.vehicle_type}) — Status: {d.status}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-text-muted mt-1">
                  Load driver credentials and active assignments from database
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Driver Name"
                  required
                  placeholder="e.g. Alex Kumar"
                  value={driverName}
                  onChange={(e: any) => setDriverName(e.target.value)}
                />
                <Select
                  label="Vehicle Type"
                  value={driverVehicle}
                  onChange={(e: any) => setDriverVehicle(e.target.value)}
                  options={[
                    { value: "Bike", label: "Motorbike / Two-Wheeler" },
                    { value: "Scooter", label: "Electric Scooter" },
                    { value: "Van", label: "Delivery Van" },
                    { value: "Car", label: "Car" },
                  ]}
                />
              </div>

              <Input
                label="Contact Phone"
                required
                placeholder="e.g. 8881112221"
                value={driverPhone}
                onChange={(e: any) => setDriverPhone(e.target.value)}
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              className={`w-full py-3 text-sm font-bold text-white shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                selectedRole === "donor"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : selectedRole === "recipient"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <span>
                Enter {selectedRole === "donor" ? "Donor Dashboard" : selectedRole === "recipient" ? "Recipient Dashboard" : "Delivery Fleet"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
