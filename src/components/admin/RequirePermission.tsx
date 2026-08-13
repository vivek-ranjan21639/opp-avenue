import { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAdminPermissions, AdminModule, MODULE_LABELS } from "@/hooks/useAdminPermissions";

interface Props {
  module: AdminModule;
  children: ReactNode;
}

export function RequirePermission({ module, children }: Props) {
  const { loading, has } = useAdminPermissions();

  if (loading) {
    return <div className="text-muted-foreground text-sm">Checking access…</div>;
  }

  if (!has(module)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="text-muted-foreground max-w-md">
          You don't have permission to view <b>{MODULE_LABELS[module]}</b>. Ask a super admin to grant you access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
