import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Mail, MessageSquare } from "lucide-react";

interface Msg {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  email_status: string | null;
  sms_status: string | null;
  delivery_error: string | null;
  is_read: boolean;
  created_at: string;
}

export default function AdminMessages() {
  const [rows, setRows] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) toast.error(error.message);
    else setRows((data || []) as Msg[]);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string, is_read: boolean) => {
    await supabase.from("contact_messages").update({ is_read }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    await supabase.from("contact_messages").delete().eq("id", id);
    load();
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Contact Messages</h1>
        <p className="text-sm text-muted-foreground">
          Submissions from the "Connect with Us" form. Email/SMS delivery status shown per message.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">No messages yet.</div>
      ) : (
        rows.map((m) => (
          <Card key={m.id} className={m.is_read ? "opacity-70" : ""}>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{m.name} <span className="text-muted-foreground font-normal">&lt;{m.email}&gt;</span></div>
                  {m.subject && <div className="text-sm text-muted-foreground">Subject: {m.subject}</div>}
                  <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={m.email_status === "sent" ? "default" : "secondary"} className="text-xs">
                    <Mail className="w-3 h-3 mr-1" />{m.email_status || "n/a"}
                  </Badge>
                  <Badge variant={m.sms_status === "sent" ? "default" : "secondary"} className="text-xs">
                    <MessageSquare className="w-3 h-3 mr-1" />{m.sms_status || "n/a"}
                  </Badge>
                </div>
              </div>
              <div className="whitespace-pre-wrap text-sm border rounded-md p-3 bg-muted/30">{m.message}</div>
              {m.delivery_error && (
                <div className="text-xs text-destructive">Delivery error: {m.delivery_error}</div>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => markRead(m.id, !m.is_read)}>
                  Mark as {m.is_read ? "unread" : "read"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
