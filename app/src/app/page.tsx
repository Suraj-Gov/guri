import HomeAnonUser from "@/components/sections/HomeAnonUser";
import HomeSection from "@/components/sections/HomeSection";
import { getLoggedInUser } from "@/utils/data";
import { Container, Flex, Heading } from "@radix-ui/themes";

export default async function HomePage() {
  const user = await getLoggedInUser();
  if (!user) {
    return <HomeAnonUser />;
  }

  return (
    <Container flexGrow={"1"} asChild size="2" mx="4">
      <Flex direction={"column"} justify={"center"}>
        <Heading mb="6" size="4" weight={"regular"}>
          Hey, <strong>{user.name}</strong>
        </Heading>
        <HomeSection user={user} />
      </Flex>
    </Container>
  );
}
