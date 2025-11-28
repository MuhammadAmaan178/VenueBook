import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertUser() {
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        name: "Test User",
        email: "testuser@example.com",
        password: "hashed_pw",
      },
    ]);
  console.log({ data, error });
}
