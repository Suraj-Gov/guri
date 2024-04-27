"use client";
import { trpc } from "@/utils/trpc";
import { ClockIcon, MinusCircledIcon, PlusIcon } from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Callout,
  Flex,
  Heading,
  Spinner,
  Text,
} from "@radix-ui/themes";
import Link from "next/link";
import { UserProfile } from "../../../../server/src/db/models";
import ExceptionCallout from "../callouts/Exception";
import CreateGoalDialog from "../dialogs/CreateGoalDialog";
import Center from "../layouts/Center";

export default function HomeSection({ user }: { user: UserProfile }) {
  const goals = trpc.goals.get.useQuery({});
  if (goals.isLoading) {
    <Center>
      <Spinner size="3" />
    </Center>;
  }
  if (goals.error) {
    <ExceptionCallout>Could not fetch your goals</ExceptionCallout>;
  }
  return !goals.data?.length ? (
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
      {goals.data.map((g) => (
        <Flex direction={"column"} key={g.id} gap="2">
          <Heading asChild size="6">
            <Link href={`/goal/${g.id}`}>{g.title}</Link>
          </Heading>
          <Flex className="opacity-50" gap={"2"} align={"center"}>
            <ClockIcon />
            <Text>{g.achieveTill.toLocaleDateString()}</Text>
          </Flex>
        </Flex>
      ))}
    </Box>
  );
}
