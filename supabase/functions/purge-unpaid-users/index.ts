import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing Supabase environment variables.", { status: 500 });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  let page = 1;
  let deleted = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const users = data?.users ?? [];
    if (!users.length) {
      break;
    }

    for (const user of users) {
      const createdAt = user.created_at ? new Date(user.created_at) : null;
      const paid = user.user_metadata?.paid === true;

      if (createdAt && createdAt < cutoff && !paid) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (!deleteError) {
          deleted += 1;
        }
      }
    }

    page += 1;
  }

  return new Response(JSON.stringify({ deleted }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});