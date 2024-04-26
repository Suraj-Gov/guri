import HomeAnonUser from "@/components/sections/HomeAnonUser";
import HomeSection from "@/components/sections/HomeSection";
import { getLoggedInUser } from "@/utils/data";

export default async function HomePage() {
  const user = await getLoggedInUser();
  if (!user) {
    return <HomeAnonUser />;
  }
  return <HomeSection user={user} />;
}
