"use client";
import { trpc } from "@/utils/trpc";
import {
  ClockIcon,
  ExclamationTriangleIcon,
  MinusCircledIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import {
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  Spinner,
  Text,
} from "@radix-ui/themes";
import Link from "next/link";
import { UserProfile } from "../../../../server/src/db/models";
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
    <Callout.Root color="amber">
      <Callout.Icon>
        <ExclamationTriangleIcon />
      </Callout.Icon>
      <Callout.Text>Could not fetch your goals</Callout.Text>
    </Callout.Root>;
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
    <Flex wrap={"wrap"} gap="4">
      {goals.data.map((g) => (
        <Card key={g.id}>
          <Link href={`/goal/${g.id}`}>
            <Heading size="3">{g.title}</Heading>
          </Link>
          <Text>
            <ClockIcon />
            {new Date(g.achieveTill).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Text>
        </Card>
      ))}
    </Flex>
  );
}
