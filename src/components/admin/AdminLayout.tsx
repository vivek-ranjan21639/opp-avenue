import { useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminSidebar } from "./AdminSidebar";
import { AdminErrorBoundary } from "./AdminErrorBoundary";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function AdminLayout() {
  const { loading, isAdmin, signOut, user } = useAdminAuth();
  const navigate = useNavigate();
  // Once admin access is confirmed, remember it so background auth refreshes
  // never cause a flash of blank/null content that would unmount editors.
  const wasAdmin = useRef(false);
  if (isAdmin) wasAdmin.current = true;

  useEffect(() => {
    if (!loading && !user) {
      wasAdmin.current = false;
      navigate("/admin/login");
    }
    if (!loading && user && !isAdmin && !wasAdmin.current) {
      navigate("/admin/login");
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading && !wasAdmin.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin && !wasAdmin.current) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user ? (user as any).email : ''}</span>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto bg-background">
            <AdminErrorBoundary>
              <Outlet />
            </AdminErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
