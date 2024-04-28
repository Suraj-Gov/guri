import HomeAnonUser from "@/components/sections/HomeAnonUser";
import HomeSection from "@/components/sections/HomeSection";
import { trpcProxy } from "@/utils/trpc/server";
import { Container, Flex, Heading } from "@radix-ui/themes";

const getData = async () => {
  try {
    const user = await trpcProxy.user.getUser.query();
    const goals = await trpcProxy.goals.get.query({});

    return { user, goals };
  } catch (err) {
    return {};
  }
};

export default async function HomePage() {
  const { user, goals } = await getData();
  if (!user) {
    return <HomeAnonUser />;
  }

  return (
    <Container flexGrow={"1"} asChild size="2">
      <Flex direction={"column"} justify={"center"}>
        <Heading mb="6" size="4" weight={"regular"}>
          Hey, <strong>{user.name}</strong>
        </Heading>
        <HomeSection user={user} goals={goals ?? []} />
      </Flex>
    </Container>
  );
}
