"use client";
import { trpc } from "@/utils/trpc";
import { CalendarIcon } from "@radix-ui/react-icons";
import {
  Container,
  Flex,
  Heading,
  Link,
  Separator,
  Spinner,
  Text,
} from "@radix-ui/themes";
import dayjs from "dayjs";
import ExceptionCallout from "../callouts/Exception";
import Center from "../layouts/Center";
import TaskList from "./TaskList";

export default function GoalView({ id }: { id: number }) {
  const goal = trpc.goals.get.useQuery({ id });
  const tasks = trpc.tasks.get.useQuery(
    { goalId: id },
    {
      queryKey: ["tasks.get", {}],
      enabled: goal.isFetched && Boolean(goal.data?.length),
    }
  );

  if (goal.isLoading) {
    return (
      <Center>
        <Spinner size={"3"} />
      </Center>
    );
  }
  const goalData = goal.data?.[0];
  if (!goalData || goal.error) {
    return (
      <ExceptionCallout>
        Goal not found. Go <Link href="/">home</Link>
      </ExceptionCallout>
    );
  }

  const daysTillEnd = dayjs(goalData.achieveTill).diff(undefined, "days");

  return (
    <Container size="3" mx="4">
      <Heading size="6">{goalData.title}</Heading>
      <Flex my="2" gap="2" align={"center"}>
        <CalendarIcon />
        <Text>{goalData.achieveTill.toLocaleDateString()}</Text>

        {daysTillEnd >= 0 && (
          <>
            <Separator orientation={"vertical"} />
            <Text>
              <strong>{daysTillEnd}</strong> days to go
            </Text>
          </>
        )}
      </Flex>
      {tasks.isLoading ? (
        <Center my="2">
          <Spinner />
        </Center>
      ) : tasks.error ? (
        <ExceptionCallout>
          We had a problem while fetching your tasks
        </ExceptionCallout>
      ) : (
        <Container my="4">
          <TaskList goalId={id} tasks={tasks.data} />
        </Container>
      )}
    </Container>
  );
}
