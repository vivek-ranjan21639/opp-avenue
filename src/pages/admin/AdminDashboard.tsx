import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, BookOpen, FolderOpen, Clock, Building } from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminData";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  const cards = [
    { title: "Live Jobs", value: stats?.liveJobs ?? 0, icon: Briefcase, color: "text-primary" },
    { title: "Draft Jobs", value: stats?.draftJobs ?? 0, icon: Clock, color: "text-accent" },
    { title: "Blogs", value: stats?.totalBlogs ?? 0, icon: BookOpen, color: "text-green-500" },
    { title: "Resources", value: stats?.totalResources ?? 0, icon: FolderOpen, color: "text-muted-foreground" },
    { title: "Companies", value: stats?.totalCompanies ?? 0, icon: Building, color: "text-blue-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{isLoading ? '...' : c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
