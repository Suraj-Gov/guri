import HomeAnonUser from "@/components/sections/HomeAnonUser";
import HomeSection from "@/components/sections/HomeSection";
import { trpcProxy } from "@/utils/trpc/server";
import { Container, Flex, Heading } from "@radix-ui/themes";

export default async function HomePage() {
  const user = await trpcProxy.user.getUser.query();
  if (!user) {
    return <HomeAnonUser />;
  }

  const goals = await trpcProxy.goals.get
    .query({})
    .then((g) => g)
    .catch(() => undefined);

  return (
    <Container flexGrow={"1"} asChild size="2">
      <Flex direction={"column"} justify={"center"}>
        <Heading mb="6" size="4" weight={"regular"}>
          Hey, <strong>{user.name}</strong>
        </Heading>
        <HomeSection user={user} goals={goals} />
      </Flex>
    </Container>
  );
}
