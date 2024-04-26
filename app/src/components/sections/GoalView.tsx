"use client";
import { trpc } from "@/utils/trpc";
import { CalendarIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import {
  Callout,
  Container,
  Flex,
  Heading,
  Link,
  Separator,
  Spinner,
  Text,
} from "@radix-ui/themes";
import dayjs from "dayjs";
import Center from "../layouts/Center";

export default function GoalView({ id }: { id: number }) {
  const goal = trpc.goals.get.useQuery({ id });

  if (goal.isLoading) {
    <Center>
      <Spinner size={"3"} />
    </Center>;
  }
  const goalData = goal.data?.[0];
  if (!goalData || goal.error) {
    return (
      <Callout.Root color="amber">
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Callout.Text>
          Goal not found. Go <Link href="/">home</Link>
        </Callout.Text>
      </Callout.Root>
    );
  }

  const daysTillEnd = dayjs(goalData.achieveTill).diff(undefined, "days");

  return (
    <Container size="2">
      <Heading size="6">{goalData.title}</Heading>
      <Flex my="2" gap="2" align={"center"}>
        <CalendarIcon />
        <Text>{goalData.achieveTill.toLocaleDateString()}</Text>

        {daysTillEnd >= 0 && (
          <>
            <Separator orientation={"vertical"} />
            <Text>
              <strong>{daysTillEnd}</strong> days to do
            </Text>
          </>
        )}
      </Flex>
      {}
    </Container>
  );
}
