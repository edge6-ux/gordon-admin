"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Permissions, Role } from "./permissions";
import { ROLE_PERMISSIONS, FULL_PERMISSIONS } from "./permissions";

const PermissionsContext = createContext<Permissions>(FULL_PERMISSIONS);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<Permissions>(FULL_PERMISSIONS);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { role?: string }) => {
        const role = data.role as Role | undefined;
        if (role && ROLE_PERMISSIONS[role]) {
          const p = ROLE_PERMISSIONS[role];
          setPermissions(p);
          // Redirect to role's home when landing on base /dashboard
          if (pathname === "/dashboard" && p.defaultRoute !== "/dashboard") {
            router.replace(p.defaultRoute);
          }
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): Permissions {
  return useContext(PermissionsContext);
}
