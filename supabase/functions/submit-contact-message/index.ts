import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().min(1).max(2000),
});

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    console.error("Resend not configured: missing LOVABLE_API_KEY or RESEND_API_KEY");
    return { ok: false, error: "Resend not configured" };
  }

  const payload: Record<string, unknown> = {
    from: "Opp Avenue Contact <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  };
  if (replyTo) payload.reply_to = replyTo;

  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Resend error", res.status, data);
    return { ok: false, error: `Resend ${res.status}: ${JSON.stringify(data)}` };
  }
  console.log("Resend ok", data);
  return { ok: true };
}

async function sendSms(to: string, body: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  if (!LOVABLE_API_KEY || !TWILIO_API_KEY) return { ok: false, error: "Twilio not configured" };
  const TWILIO_FROM = Deno.env.get("TWILIO_FROM_NUMBER");
  if (!TWILIO_FROM) return { ok: false, error: "TWILIO_FROM_NUMBER not set" };

  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: `Twilio ${res.status}: ${JSON.stringify(data)}` };
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { name, email, subject, message } = parsed.data;

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Insert message
    const { data: row, error: insErr } = await sb
      .from("contact_messages")
      .insert({ name, email, subject: subject ?? null, message })
      .select("id")
      .single();
    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get destination contact info
    const { data: setting } = await sb
      .from("site_settings")
      .select("value")
      .eq("key", "contact_info")
      .maybeSingle();
    const contact = (setting?.value as { email?: string; phone?: string }) || {};

    let emailStatus = "skipped";
    let smsStatus = "skipped";
    let deliveryError: string | null = null;

    if (contact.email) {
      const html = `
        <h2>New contact form submission</h2>
        <p><b>From:</b> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        ${subject ? `<p><b>Subject:</b> ${escapeHtml(subject)}</p>` : ""}
        <p><b>Message:</b></p>
        <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>
      `;
      const r = await sendEmail(
        contact.email,
        `New message from ${name}${subject ? ` — ${subject}` : ""}`,
        html,
        email,
      );
      emailStatus = r.ok ? "sent" : "failed";
      if (!r.ok) deliveryError = r.error || null;
    }

    if (contact.phone) {
      const sms = `New message from ${name} (${email})${subject ? `: ${subject}` : ""}\n${message.slice(0, 300)}`;
      const r = await sendSms(contact.phone, sms);
      smsStatus = r.ok ? "sent" : "failed";
      if (!r.ok && !deliveryError) deliveryError = r.error || null;
    }

    await sb
      .from("contact_messages")
      .update({ email_status: emailStatus, sms_status: smsStatus, delivery_error: deliveryError })
      .eq("id", row.id);

    return new Response(JSON.stringify({ ok: true, id: row.id, emailStatus, smsStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
