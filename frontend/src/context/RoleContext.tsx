import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "donor" | "recipient" | "delivery" | null;

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeOrgId: string;
  setActiveOrgId: (id: string) => void;
  activeDriverId: string;
  setActiveDriverId: (id: string) => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem("s2s_active_role");
    if (saved === "donor" || saved === "recipient" || saved === "delivery") {
      return saved;
    }
    return null;
  });

  const [activeOrgId, setActiveOrgIdState] = useState<string>(() => {
    return localStorage.getItem("s2s_active_org_id") || "";
  });

  const [activeDriverId, setActiveDriverIdState] = useState<string>(() => {
    return localStorage.getItem("s2s_active_driver_id") || "";
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem("s2s_active_role", newRole);
    } else {
      localStorage.removeItem("s2s_active_role");
    }
  };

  const setActiveOrgId = (id: string) => {
    setActiveOrgIdState(id);
    localStorage.setItem("s2s_active_org_id", id);
  };

  const setActiveDriverId = (id: string) => {
    setActiveDriverIdState(id);
    localStorage.setItem("s2s_active_driver_id", id);
  };

  const logout = () => {
    setRole(null);
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        activeOrgId,
        setActiveOrgId,
        activeDriverId,
        setActiveDriverId,
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
