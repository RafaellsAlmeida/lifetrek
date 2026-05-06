import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const email = "rsilva@lifetrek-medical.com";
const displayName = "Ronaldo Silva";
const redirectTo = process.env.RONALDO_REDIRECT_URL ?? "https://lifetrek-medical.com/admin/login";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(targetEmail: string) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === targetEmail.toLowerCase());
    if (user) return user;
    if (data.users.length < perPage) return null;

    page += 1;
  }
}

const existingUser = await findUserByEmail(email);
let userId = existingUser?.id ?? null;
let createdUser = false;

if (!existingUser) {
  const temporaryPassword = randomBytes(24).toString("base64url");
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      name: displayName,
    },
  });

  if (error) throw error;
  userId = data.user?.id ?? null;
  createdUser = true;
}

const { error: permissionError } = await supabase
  .from("admin_permissions")
  .upsert(
    {
      email,
      permission_level: "admin",
      display_name: displayName,
    },
    { onConflict: "email" },
  );

if (permissionError) throw permissionError;

const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

if (resetError) throw resetError;

const { data: permissionRow, error: verifyPermissionError } = await supabase
  .from("admin_permissions")
  .select("email, permission_level, display_name")
  .eq("email", email)
  .maybeSingle();

if (verifyPermissionError) throw verifyPermissionError;

console.log(
  JSON.stringify(
    {
      email,
      userId,
      createdUser,
      permission: permissionRow,
      resetEmailSent: true,
      redirectTo,
    },
    null,
    2,
  ),
);
