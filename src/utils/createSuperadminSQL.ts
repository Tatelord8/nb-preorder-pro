import { supabase } from "@/integrations/supabase/client";

// Alternative method using SQL to create superadmin
export const createSuperadminSQL = async (email: string, password: string) => {
  try {
    // First, try to sign up the user normally
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error("No se pudo crear el usuario");
    }

    // Use SQL to create superadmin role
    const { error: sqlError } = await supabase.rpc('create_superadmin', {
      user_id: authData.user.id
    });

    if (sqlError) {
      // Fallback: try direct insert
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "superadmin",
        });

      if (roleError) throw roleError;
    }

    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error("Error creating superadmin:", error);
    return { success: false, error: error.message };
  }
};

// Function to create superadmin using direct SQL
export const createSuperadminDirect = async (email: string, password: string) => {
  try {
    // First, try to sign up the user normally
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error("No se pudo crear el usuario");
    }

    // Create superadmin role directly
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: "superadmin",
      });

    if (roleError) {
      // If insert fails, try to update existing role
      const { error: updateError } = await supabase
        .from("user_roles")
        .update({ role: "superadmin" })
        .eq("user_id", authData.user.id);

      if (updateError) throw updateError;
    }

    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error("Error creating superadmin:", error);
    return { success: false, error: error.message };
  }
};
