import { useState } from "react";
import {
  useAdminCountries, useAdminStates, useAdminAllLocations,
  useUpsertCountry, useUpsertState, useUpsertCity,
  useDeleteCountry, useDeleteState, useDeleteCity,
  useBulkDelete,
} from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionsToolbar, downloadCsv } from "@/components/admin/BulkActionsToolbar";

const NEW = "__new__";

export default function AdminLocations() {
  const { toast } = useToast();
  const { data: countries = [] } = useAdminCountries();
  const [country, setCountry] = useState(""); // existing country id, or NEW, or ""
  const [state, setState] = useState("");     // existing state id, or NEW, or ""
  const { data: states = [] } = useAdminStates(country && country !== NEW ? country : undefined);
  const { data: cities = [], isLoading } = useAdminAllLocations();

  const upsertCountry = useUpsertCountry();
  const upsertState = useUpsertState();
  const upsertCity = useUpsertCity();
  const delCountry = useDeleteCountry();
  const delState = useDeleteState();
  const delCity = useDeleteCity();

  // Form fields
  const [cityName, setCityName] = useState("");
  const [newCountryName, setNewCountryName] = useState("");
  const [newCountryIso, setNewCountryIso] = useState("");
  const [newStateName, setNewStateName] = useState("");

  const isCreatingCountry = country === NEW || (countries as any[]).length === 0;
  const isCreatingState = state === NEW;

  const handleAdd = async () => {
    if (!cityName.trim()) { toast({ title: "City name is required", variant: "destructive" }); return; }

    let countryId = country && country !== NEW ? country : "";
    let stateId = state && state !== NEW ? state : "";

    // Resolve / create country
    if (!countryId) {
      if (!newCountryName.trim() || !newCountryIso.trim()) {
        toast({ title: "Enter new country name and ISO code (2-3 letters)", variant: "destructive" }); return;
      }
      try {
        const c = await upsertCountry.mutateAsync({ name: newCountryName, iso_code: newCountryIso });
        countryId = c.id;
      } catch { return; }
    }

    // Resolve / create state (optional)
    if (!stateId && newStateName.trim()) {
      try {
        const s = await upsertState.mutateAsync({ name: newStateName, country_id: countryId });
        stateId = s.id;
      } catch { return; }
    }

    try {
      await upsertCity.mutateAsync({ name: cityName, state_id: stateId || null, country_id: countryId });
      toast({ title: "Location saved" });
      setCityName(""); setNewCountryName(""); setNewCountryIso(""); setNewStateName("");
      setCountry(""); setState("");
    } catch { /* toast already shown by hook */ }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Locations</h1>

      <Card>
        <CardHeader><CardTitle>Add Location</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Country */}
            <div>
              <Label>Country *</Label>
              {(countries as any[]).length > 0 ? (
                <Select value={country} onValueChange={(v) => { setCountry(v); setState(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {(countries as any[]).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    <SelectItem value={NEW}>+ Add new country…</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground py-2">No countries yet — fill in the fields below.</p>
              )}
              {isCreatingCountry && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Input className="col-span-2" placeholder="New country name" value={newCountryName} onChange={(e) => setNewCountryName(e.target.value)} />
                  <Input placeholder="ISO" maxLength={3} value={newCountryIso} onChange={(e) => setNewCountryIso(e.target.value.toUpperCase())} />
                </div>
              )}
            </div>

            {/* State */}
            <div>
              <Label>State (optional)</Label>
              {!isCreatingCountry && states.length > 0 ? (
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger><SelectValue placeholder="Select state (or skip)" /></SelectTrigger>
                  <SelectContent>
                    {states.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    <SelectItem value={NEW}>+ Add new state…</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground py-2">
                  {isCreatingCountry ? "Available after country is set." : "No states yet for this country."}
                </p>
              )}
              {(isCreatingCountry || isCreatingState || (!isCreatingCountry && states.length === 0)) && (
                <Input
                  className="mt-2"
                  placeholder="New state name (optional)"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  disabled={isCreatingCountry ? !newCountryName.trim() : false}
                />
              )}
            </div>

            {/* City */}
            <div>
              <Label>City *</Label>
              <Input value={cityName} onChange={(e) => setCityName(e.target.value)} placeholder="Bengaluru" />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={upsertCity.isPending || upsertCountry.isPending || upsertState.isPending}>
            <Plus className="h-4 w-4 mr-2" /> Add Location
          </Button>
          <p className="text-xs text-muted-foreground">
            Tip: pick an existing country/state from the dropdown, or choose <em>“Add new…”</em> to create one inline. Existing entries are reused (case-insensitive) to prevent duplicates.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Cities</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Loading...</p> : cities.length === 0 ? <p className="text-muted-foreground">No locations yet.</p> : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cities.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.j_states?.name || '—'}</TableCell>
                      <TableCell>{c.j_countries?.name || '—'}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete city?</AlertDialogTitle>
                              <AlertDialogDescription>This may affect jobs linked to this city.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => delCity.mutate(c.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Countries</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>ISO</TableHead><TableHead className="w-[60px]" /></TableRow></TableHeader>
                <TableBody>
                  {(countries as any[]).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.iso_code}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => delCountry.mutate(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>States {country && country !== NEW && '(filtered)'}</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="w-[60px]" /></TableRow></TableHeader>
                <TableBody>
                  {states.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => delState.mutate(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
