import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

interface ContactInfo { email: string; phone: string }
interface SocialLinks {
  linkedin?: string; youtube?: string; whatsapp?: string; phone?: string; email?: string;
}
type SocialKey = 'linkedin' | 'youtube' | 'whatsapp' | 'phone' | 'email';
type SocialVisibility = Partial<Record<SocialKey, boolean>>;

export default function AdminSiteSettings() {
  const [contact, setContact] = useState<ContactInfo>({ email: "", phone: "" });
  const [social, setSocial] = useState<SocialLinks>({});
  const [visibility, setVisibility] = useState<SocialVisibility>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["contact_info", "social_links", "social_visibility"]);
      for (const row of data || []) {
        if (row.key === "contact_info") setContact(row.value as unknown as ContactInfo);
        if (row.key === "social_links") setSocial(row.value as unknown as SocialLinks);
        if (row.key === "social_visibility") setVisibility(row.value as unknown as SocialVisibility);
      }
      setLoading(false);
    })();
  }, []);

  const save = async (key: string, value: any) => {
    setSaving(key);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value }, { onConflict: "key" });
    setSaving(null);
    if (error) toast.error(`Save failed: ${error.message}`);
    else toast.success("Saved");
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <p className="text-sm text-muted-foreground">
          Public contact info shown on the Connect with Us page and the social-media pill in the header.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Email and phone shown on the Connect page. Form submissions are also delivered to these.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="c-email">Email</Label>
            <Input id="c-email" type="email" value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              placeholder="contact@oppavenue.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-phone">Phone (E.164 for SMS, e.g. +91…)</Label>
            <Input id="c-phone" value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              placeholder="+91 98765 43210" />
          </div>
          <Button onClick={() => save("contact_info", contact)} disabled={saving === "contact_info"}>
            {saving === "contact_info" ? "Saving…" : "Save Contact Info"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>
            URLs used by the social-media pill. Toggle the switch to show or hide each icon on the frontend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {([
            ["linkedin", "LinkedIn URL", "https://www.linkedin.com/company/..."],
            ["youtube", "YouTube URL", "https://www.youtube.com/@..."],
            ["whatsapp", "WhatsApp link", "https://wa.me/91XXXXXXXXXX"],
            ["phone", "Phone link", "tel:+91XXXXXXXXXX"],
            ["email", "Email link", "mailto:contact@example.com"],
          ] as const).map(([k, label, ph]) => (
            <div key={k} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`s-${k}`}>{label}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {visibility[k] ? "Shown" : "Hidden"}
                  </span>
                  <Switch
                    id={`v-${k}`}
                    checked={!!visibility[k]}
                    onCheckedChange={(checked) =>
                      setVisibility({ ...visibility, [k]: checked })
                    }
                  />
                </div>
              </div>
              <Input id={`s-${k}`} value={(social as any)[k] || ""}
                onChange={(e) => setSocial({ ...social, [k]: e.target.value })}
                placeholder={ph} />
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={() => save("social_links", social)} disabled={saving === "social_links"}>
              {saving === "social_links" ? "Saving…" : "Save Social Links"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => save("social_visibility", visibility)}
              disabled={saving === "social_visibility"}
            >
              {saving === "social_visibility" ? "Saving…" : "Save Visibility"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
