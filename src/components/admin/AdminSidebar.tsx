import { useLocation, Link } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Briefcase, BookOpen, FolderOpen,
  Building, Layers, Tag, Users, Wrench, MapPin, PlusCircle, FileEdit, Star, Upload, Inbox, BarChart3, ShieldCheck, Megaphone, FileText, Settings, MessageSquare,
} from "lucide-react";
import { useAdminPermissions, AdminModule } from "@/hooks/useAdminPermissions";

type Item = { title: string; url: string; icon: any; module?: AdminModule };

const jobItems: Item[] = [
  { title: "Add New Job", url: "/admin/jobs/edit", icon: PlusCircle, module: "jobs" },
  { title: "Bulk Upload", url: "/admin/jobs/bulk-upload", icon: Upload, module: "bulk_jobs" },
  { title: "Bulk Uploaded Jobs", url: "/admin/jobs/bulk", icon: Inbox, module: "bulk_jobs" },
  { title: "Draft Jobs", url: "/admin/jobs/drafts", icon: FileEdit, module: "jobs" },
  { title: "Live Jobs", url: "/admin/jobs/live", icon: Briefcase, module: "jobs" },
  { title: "Locations", url: "/admin/jobs/locations", icon: MapPin, module: "taxonomy" },
  { title: "Domain", url: "/admin/jobs/domains", icon: Layers, module: "taxonomy" },
  { title: "Skills", url: "/admin/jobs/skills", icon: Wrench, module: "taxonomy" },
  { title: "Field Options", url: "/admin/jobs/taxonomy", icon: Settings, module: "taxonomy" },
  { title: "Companies", url: "/admin/jobs/companies", icon: Building, module: "taxonomy" },
];

const blogItems: Item[] = [
  { title: "Blogs", url: "/admin/blogs", icon: BookOpen, module: "blogs" },
  { title: "Categories", url: "/admin/blogs/categories", icon: FolderOpen, module: "taxonomy" },
  { title: "Tags", url: "/admin/blogs/tags", icon: Tag, module: "taxonomy" },
  { title: "Authors", url: "/admin/blogs/authors", icon: Users, module: "taxonomy" },
];

const resourceItems: Item[] = [
  { title: "Resources", url: "/admin/resources", icon: FolderOpen, module: "resources" },
  { title: "Categories", url: "/admin/resources/categories", icon: FolderOpen, module: "taxonomy" },
  { title: "Tags", url: "/admin/resources/tags", icon: Tag, module: "taxonomy" },
];

const siteItems: Item[] = [
  { title: "Featured Carousel", url: "/admin/featured", icon: Star, module: "featured_carousel" },
  { title: "Notices", url: "/admin/notices", icon: Megaphone },
  { title: "Site Pages", url: "/admin/site-pages", icon: FileText },
  { title: "Site Settings", url: "/admin/site-settings", icon: Settings },
  { title: "Messages", url: "/admin/messages", icon: MessageSquare },
];

const overviewExtraItems: Item[] = [
  { title: "User Permissions", url: "/admin/users", icon: ShieldCheck, module: "user_management" },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3, module: "analytics" },
];

export function AdminSidebar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const { has, loading } = useAdminPermissions();

  const filterItems = (items: Item[]) =>
    items.filter((i) => !i.module || has(i.module));

  const renderGroup = (label: string, items: Item[]) => {
    const visible = filterItems(items);
    if (visible.length === 0) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {visible.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive(item.url)}>
                  <Link to={item.url}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  if (loading) {
    return (
      <Sidebar collapsible="icon">
        <SidebarContent />
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pb-8">
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/admin"}>
                  <Link to="/admin"><LayoutDashboard className="h-4 w-4" /><span>Dashboard</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {filterItems(overviewExtraItems).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {renderGroup("Jobs", jobItems)}
        {renderGroup("Blogs", blogItems)}
        {renderGroup("Resources", resourceItems)}
        {renderGroup("Site", siteItems)}
      </SidebarContent>
    </Sidebar>
  );
}
