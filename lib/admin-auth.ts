import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

export type AdminRole = "super_admin" | "admin";

export type AdminSession = {
  user: {
    id: string;
    email?: string;
  };
  role: AdminRole;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: adminUser, error: adminError } =
    await supabaseAdmin
      .from("admin_users")
      .select("user_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

  if (adminError) {
    console.error("Admin role lookup error:", adminError);
    return null;
  }

  if (!adminUser) {
    return null;
  }

  if (
    adminUser.role !== "super_admin" &&
    adminUser.role !== "admin"
  ) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    role: adminUser.role as AdminRole,
  };
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (session.role !== "super_admin") {
    throw new Error("FORBIDDEN");
  }

  return session;
}