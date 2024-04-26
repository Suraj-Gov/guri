import HomeAnonUser from "@/components/sections/HomeAnonUser";
import HomeSection from "@/components/sections/HomeSection";
import { getLoggedInUser } from "@/utils/data";
import { Container, Heading } from "@radix-ui/themes";

export default async function HomePage() {
  const user = await getLoggedInUser();
  if (!user) {
    return <HomeAnonUser />;
  }

  return (
    <Container p="4" size={"2"}>
      <Heading mb="4" size="4" weight={"regular"}>
        Hey, <strong>{user.name}</strong>
      </Heading>
      <HomeSection user={user} />
    </Container>
  );
}
