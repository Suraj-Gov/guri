import { ClockIcon, MinusCircledIcon, PlusIcon } from "@radix-ui/react-icons";
import { Box, Button, Callout, Flex, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";
import { UserGoal, UserProfile } from "../../../../server/src/db/models";
import ExceptionCallout from "../callouts/Exception";
import CreateGoalDialog from "../dialogs/CreateGoalDialog";
import Center from "../layouts/Center";

export default function HomeSection({
  user,
  goals,
}: {
  user: UserProfile;
  goals?: UserGoal[];
}) {
  if (!goals) {
    <ExceptionCallout>Could not fetch your goals</ExceptionCallout>;
  }
  return !goals?.length ? (
    <Callout.Root>
      <Callout.Icon>
        <MinusCircledIcon />
      </Callout.Icon>
      <Center align={"center"}>
        <Callout.Text>You don&apos;t have any active goals. </Callout.Text>
        <CreateGoalDialog>
          <Button variant="outline" ml="3" size="1">
            <PlusIcon />
            Create Goal
          </Button>
        </CreateGoalDialog>
      </Center>
    </Callout.Root>
  ) : (
    <Box my="2">
      {goals.map((g) => (
        <Flex direction={"column"} key={g.id} gap="2">
          <Heading asChild size="6">
            <Link href={`/goal/${g.id}`}>{g.title}</Link>
          </Heading>
          <Flex className="opacity-50" gap={"2"} align={"center"}>
            <ClockIcon />
            <Text>{g.achieveTill.toDateString()}</Text>
          </Flex>
        </Flex>
      ))}
    </Box>
  );
}
