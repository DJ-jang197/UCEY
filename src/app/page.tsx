import { redirect } from 'next/navigation';
import MainMap from "./components/MainMap";
import { hasAppSession } from "@/lib/auth/session";

export default async function Home() {
  const authenticated = await hasAppSession();

  if (!authenticated) {
    redirect('/login');
  }

  return (
    <div className="map-shell">
      <MainMap />
    </div>
  );
}
