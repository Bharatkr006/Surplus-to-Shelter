import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "donor" | "recipient" | "delivery" | null;

export interface UserSession {
  role: UserRole;
  userName: string;
  entityName: string;
  activeOrgId: string;
  activeDriverId: string;
  phone?: string;
  address?: string;
}

interface RoleContextType {
  role: UserRole;
  session: UserSession | null;
  activeOrgId: string;
  setActiveOrgId: (id: string) => void;
  activeDriverId: string;
  setActiveDriverId: (id: string) => void;
  login: (params: {
    role: "donor" | "recipient" | "delivery";
    userName: string;
    entityName?: string;
    activeOrgId?: string;
    activeDriverId?: string;
    phone?: string;
    address?: string;
  }) => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem("s2s_user_session");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore JSON parse error
    }
    return null;
  });

  const role = session?.role || null;
  const activeOrgId = session?.activeOrgId || "";
  const activeDriverId = session?.activeDriverId || "";

  const login = (params: {
    role: "donor" | "recipient" | "delivery";
    userName: string;
    entityName?: string;
    activeOrgId?: string;
    activeDriverId?: string;
    phone?: string;
    address?: string;
  }) => {
    const newSession: UserSession = {
      role: params.role,
      userName: params.userName || (params.role === "donor" ? "Donor Admin" : params.role === "recipient" ? "Shelter In-Charge" : "Volunteer Driver"),
      entityName: params.entityName || (params.role === "donor" ? "Surplus Food Donor" : params.role === "recipient" ? "Recipient Shelter" : "Delivery Fleet"),
      activeOrgId: params.activeOrgId || "",
      activeDriverId: params.activeDriverId || "",
      phone: params.phone || "",
      address: params.address || "",
    };
    setSession(newSession);
    localStorage.setItem("s2s_user_session", JSON.stringify(newSession));
    localStorage.setItem("s2s_active_role", params.role);
    if (params.activeOrgId) localStorage.setItem("s2s_active_org_id", params.activeOrgId);
    if (params.activeDriverId) localStorage.setItem("s2s_active_driver_id", params.activeDriverId);
  };

  const setActiveOrgId = (id: string) => {
    if (session) {
      const updated = { ...session, activeOrgId: id };
      setSession(updated);
      localStorage.setItem("s2s_user_session", JSON.stringify(updated));
    }
    localStorage.setItem("s2s_active_org_id", id);
  };

  const setActiveDriverId = (id: string) => {
    if (session) {
      const updated = { ...session, activeDriverId: id };
      setSession(updated);
      localStorage.setItem("s2s_user_session", JSON.stringify(updated));
    }
    localStorage.setItem("s2s_active_driver_id", id);
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem("s2s_user_session");
    localStorage.removeItem("s2s_active_role");
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        session,
        activeOrgId,
        setActiveOrgId,
        activeDriverId,
        setActiveDriverId,
        login,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return ctx;
}
