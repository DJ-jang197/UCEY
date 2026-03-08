import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import MainMap from "./components/MainMap";

export default async function Home() {
  const cookieStore = await cookies();
  const hasCustomSession = cookieStore.has('zv_session');
  const hasAuth0Session = cookieStore.has('appSession');
  
  if (!hasCustomSession && !hasAuth0Session) {
    redirect('/login');
  }

  return (
    <div className="map-shell">
      <MainMap />
    </div>
  );
}
