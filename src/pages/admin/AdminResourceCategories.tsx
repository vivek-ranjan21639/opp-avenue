import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ResourceFieldConfig } from "@/hooks/useResources";

interface Cat {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_filled: boolean;
  default_view: 'list' | 'grid';
  field_config?: ResourceFieldConfig | null;
}

export default function AdminResourceCategories() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data = [], isLoading } = useQuery<Cat[]>({
    queryKey: ['admin-resource-categories-full'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('r_categories')
        .select('id, name, slug, display_order, is_filled, default_view, field_config')
        .order('display_order', { ascending: true })
        .order('name');
      if (error) throw error;
      return (data || []) as any;
    },
  });

  const reorder = useMutation({
    mutationFn: async (c: Cat) => {
      const { error } = await (supabase as any)
        .from('r_categories')
        .update({ display_order: c.display_order })
        .eq('id', c.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-resource-categories-full'] });
      qc.invalidateQueries({ queryKey: ['resource-categories'] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('r_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-resource-categories-full'] });
      qc.invalidateQueries({ queryKey: ['resource-categories'] });
      toast({ title: "Category deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const move = async (it: Cat, dir: -1 | 1) => {
    const idx = data.findIndex((d) => d.id === it.id);
    const swap = data[idx + dir];
    if (!swap) return;
    await reorder.mutateAsync({ ...it, display_order: swap.display_order });
    await reorder.mutateAsync({ ...swap, display_order: it.display_order });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Resource Categories</h1>
        <Button onClick={() => navigate('/admin/resources/categories/new')}>
          <Plus className="h-4 w-4 mr-2" /> New Category
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="w-[120px]">Filled</TableHead>
                <TableHead className="w-[120px]">View</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((it, idx) => (
                <TableRow
                  key={it.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/resources/categories/${it.id}`)}
                >
                  <TableCell className="font-mono text-xs">{it.display_order}</TableCell>
                  <TableCell className="font-medium">{it.name}</TableCell>
                  <TableCell className="text-muted-foreground">{it.slug}</TableCell>
                  <TableCell>{it.is_filled ? "Yes" : "No"}</TableCell>
                  <TableCell className="capitalize">{it.default_view || 'list'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" disabled={idx === 0} onClick={() => move(it, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" disabled={idx === data.length - 1} onClick={() => move(it, 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/resources/categories/${it.id}`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete category?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone. Resources in this category may be affected.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => del.mutate(it.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
