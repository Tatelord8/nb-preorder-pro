import { supabase } from "@/integrations/supabase/client";

export const createSuperadmin = async (email: string, password: string) => {
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

    // Create superadmin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: "superadmin",
      });

    if (roleError) throw roleError;

    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error("Error creating superadmin:", error);
    return { success: false, error: error.message };
  }
};

// Function to check if superadmin exists
export const checkSuperadminExists = async () => {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("id")
      .eq("role", "superadmin")
      .limit(1);

    if (error) {
      console.error("Error checking superadmin:", error);
      return { exists: false, error: error.message };
    }

    return { exists: (data && data.length > 0), error: null };
  } catch (error: any) {
    console.error("Error checking superadmin:", error);
    return { exists: false, error: error.message };
  }
};
