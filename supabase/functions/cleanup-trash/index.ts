import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Get expired trash records
  const { data: trashItems, error: fetchError } = await supabase
    .from("storage_trash")
    .select("*")
    .lte("permanent_delete_after", new Date().toISOString());

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!trashItems || trashItems.length === 0) {
    return new Response(JSON.stringify({ message: "No files to clean up", deleted: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let deletedCount = 0;
  const errors: string[] = [];

  for (const item of trashItems) {
    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from(item.bucket_id)
      .remove([item.file_path]);

    if (storageError) {
      errors.push(`Failed to delete ${item.file_path}: ${storageError.message}`);
      continue;
    }

    // Remove the trash record
    const { error: deleteError } = await supabase
      .from("storage_trash")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      errors.push(`Failed to remove trash record ${item.id}: ${deleteError.message}`);
    } else {
      deletedCount++;
    }
  }

  return new Response(
    JSON.stringify({ message: "Cleanup complete", deleted: deletedCount, errors }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
