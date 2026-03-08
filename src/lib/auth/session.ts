import { cookies } from "next/headers";
import { getAuth0Client } from "@/lib/auth0";

export async function hasAppSession() {
  const cookieStore = await cookies();
  if (cookieStore.has("zv_session")) {
    return true;
  }

  const auth0 = getAuth0Client();
  if (!auth0) {
    return false;
  }

  const session = await auth0.getSession();
  return Boolean(session?.user?.sub);
}
