import {
  CheckIcon,
  Cross2Icon,
  MinusCircledIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import {
  Button,
  Callout,
  Container,
  IconButton,
  Table,
  Text,
} from "@radix-ui/themes";
import { TaskSchedule, UserTask } from "../../../../server/src/db/models";
import MarkProgressDialog from "../dialogs/MarkProgressDialog";
import TaskDialog from "../dialogs/TaskDialog";
import Center from "../layouts/Center";

const getScheduleHTMLContent = (schedule: TaskSchedule) => {
  let out = [];
  if (schedule.timesPerDay > 1) {
    out.push(`${schedule.timesPerDay}x a day`);
  } else {
    out.push(`Once a day`);
  }

  const timesPerWeek = schedule.days.reduce(
    (acc, cur) => acc + (cur !== -1 ? 1 : 0),
    0
  );
  if (timesPerWeek > 1) {
    out.push(`${timesPerWeek} days a week`);
  } else {
    out.push(`every week`);
  }

  return out.join(" &bull; ");
};

export default function TaskList({
  goalId,
  tasks,
}: {
  goalId: number;
  tasks: UserTask[];
}) {
  if (!tasks.length) {
    return (
      <Callout.Root>
        <Callout.Icon>
          <MinusCircledIcon />
        </Callout.Icon>
        <Center align={"center"}>
          <Callout.Text>
            You can&apos;t reach your goals without any work
          </Callout.Text>
          <TaskDialog goalId={goalId}>
            <Button variant="outline" ml="3" size="1">
              <PlusIcon />
              Add Task
            </Button>
          </TaskDialog>
        </Center>
      </Callout.Root>
    );
  }

  return (
    <Container>
      <TaskDialog goalId={goalId}>
        <Button mb="3">
          <PlusIcon />
          Add Task
        </Button>
      </TaskDialog>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Mark</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Progress</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Schedule</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Notifications</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Updated at</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Created at</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {tasks.map((t) => (
            <Table.Row key={t.id}>
              <Table.RowHeaderCell>
                <TaskDialog goalId={goalId} initData={t}>
                  <Button variant="ghost">
                    <strong>{t.title}</strong>
                  </Button>
                </TaskDialog>
              </Table.RowHeaderCell>
              <Table.Cell>
                <MarkProgressDialog task={t}>
                  <IconButton
                    disabled={t.count === t.countToAchieve}
                    variant="soft"
                  >
                    <CheckIcon />
                  </IconButton>
                </MarkProgressDialog>
              </Table.Cell>
              <Table.Cell>
                {t.count === t.countToAchieve ? (
                  <Text>Done!</Text>
                ) : (
                  <Text>
                    {t.count} / {t.countToAchieve}
                  </Text>
                )}
              </Table.Cell>
              <Table.Cell
                dangerouslySetInnerHTML={{
                  __html: getScheduleHTMLContent(t.schedule),
                }}
              />
              <Table.Cell align="center">
                {t.shouldRemind ? <CheckIcon /> : <Cross2Icon />}
              </Table.Cell>
              <Table.Cell>{t.updatedAt?.toDateString()}</Table.Cell>
              <Table.Cell>{t.createdAt?.toDateString()}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Container>
  );
}
