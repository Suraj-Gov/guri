"use client";
import { showToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc/client";
import {
  Box,
  Button,
  Dialog,
  Flex,
  Select,
  Slider,
  Tabs,
  Text,
  TextField,
} from "@radix-ui/themes";
import { FormEventHandler, useState } from "react";
import { TaskSchedule, UserTask } from "../../../../server/src/db/models";
import Center from "../layouts/Center";

const defaultTimes = {
  never: null,
  "7am": 7,
  "12pm": 12,
  "4pm": 16,
  "8pm": 20,
};

const tzHoursOffset = new Date().getTimezoneOffset() / 60;

const defaultSchedule = {
  days: [0, 1, 2, 3, 4, 5, 6],
  remindAtHours: [],
  timesPerDay: 1,
  tzHoursOffset,
};

export default function TaskDialog({
  goalId,
  initData,
  children,
}: {
  goalId: number;
  initData?: Pick<
    UserTask,
    "id" | "title" | "schedule" | "countToAchieve" | "shouldRemind"
  >;
  children: React.ReactNode;
}) {
  const [open, setIsOpen] = useState(false);
  const [schedule, setSchedule] = useState<TaskSchedule>(
    () => initData?.schedule ?? defaultSchedule
  );
  const qUtils = trpc.useUtils();
  const create = trpc.tasks.create.useMutation();
  const update = trpc.tasks.update.useMutation();

  const onOpenChange = (isOpen: boolean) => {
    if (create.isLoading || update.isLoading) {
      return;
    }
    setIsOpen(isOpen);
  };

  const toggleDays = (idx: number) => {
    setSchedule((prev) => {
      const item = prev.days[idx];
      const wasEnabled = item !== -1;
      const days = [...prev.days];
      days[idx] = wasEnabled ? -1 : idx;
      return {
        ...prev,
        days,
      };
    });
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as any);
    const title = formData.get("title") as string;
    const countToAchieve = Number(formData.get("countToAchieve"));
    const reminderTime = formData.get(
      "reminderTime"
    ) as keyof typeof defaultTimes;
    const shouldRemind = reminderTime !== "never";

    const payload = {
      title,
      countToAchieve,
      shouldRemind,
      schedule,
      goalId,
    };

    if (shouldRemind) {
      payload.schedule.remindAtHours = [defaultTimes[reminderTime]];
    }

    if (initData) {
      update.mutate(
        {
          ...payload,
          id: initData.id,
        },
        {
          onSuccess: () => {
            showToast("Task updated", "OK");
            setIsOpen(false);
            qUtils.tasks.get.invalidate({ goalId });
          },
          onError: ({ message }) => {
            showToast(message, "ERR");
          },
        }
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          showToast(
            shouldRemind ? `Reminding you at ${reminderTime}!` : `Good luck!`,
            "OK"
          );
          setIsOpen(false);
          qUtils.tasks.get.invalidate({ goalId });
        },

        onError: ({ message }) => {
          showToast(message, "ERR");
        },
      });
    }
  };

  const weeklyCount = schedule.days.filter((x) => x !== -1).length;
  const dailyCount = schedule.timesPerDay;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger>{children}</Dialog.Trigger>
      <Dialog.Content minWidth={"20rem"}>
        <Dialog.Title>Reach towards your goal</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex pt="2" direction="column" gap="2">
            <Flex gap="2">
              <TextField.Root
                className="grow"
                maxLength={30}
                minLength={3}
                name="title"
                placeholder="run 5km"
                defaultValue={initData?.title}
              >
                <TextField.Slot side="left">I will</TextField.Slot>
              </TextField.Root>
              <TextField.Root
                className="grow"
                max={300}
                min={3}
                type="number"
                name="countToAchieve"
                placeholder="53"
                defaultValue={initData?.countToAchieve}
              >
                <TextField.Slot side="left">for</TextField.Slot>
                <TextField.Slot side="right">times</TextField.Slot>
              </TextField.Root>
            </Flex>
            <Tabs.Root defaultValue="weekly">
              <Tabs.List justify={"center"}>
                <Tabs.Trigger value="weekly">Weekly</Tabs.Trigger>
                <Tabs.Trigger value="daily">Daily</Tabs.Trigger>
              </Tabs.List>
              <Box pt="4">
                <Tabs.Content value="daily">
                  <Flex
                    direction={"column"}
                    minHeight={"5rem"}
                    align={"center"}
                    gap="4"
                    py="4"
                    px="9"
                  >
                    <Slider
                      value={[dailyCount]}
                      onValueChange={([v]) =>
                        setSchedule((x) => ({ ...x, timesPerDay: v }))
                      }
                      min={1}
                      max={5}
                    />
                    <Text wrap={"nowrap"}>
                      {dailyCount < 2
                        ? "Once every day"
                        : `${dailyCount} times/day`}
                    </Text>
                  </Flex>
                </Tabs.Content>
                <Tabs.Content value="weekly">
                  <Flex
                    direction={"column"}
                    minHeight={"5rem"}
                    align={"center"}
                    gap="4"
                    pt="1"
                  >
                    <Center gap="2" align={"center"}>
                      {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                        (d, idx) => (
                          <Button
                            type="button"
                            size={"1"}
                            key={idx}
                            variant={
                              schedule.days[idx] !== -1 ? "solid" : "soft"
                            }
                            onClick={() => toggleDays(idx)}
                          >
                            {d}
                          </Button>
                        )
                      )}
                    </Center>
                    <Text>
                      {weeklyCount < 2
                        ? "Once every week"
                        : weeklyCount === 7
                        ? "Once every day"
                        : `${weeklyCount} times/week`}
                    </Text>
                  </Flex>
                </Tabs.Content>
              </Box>
            </Tabs.Root>

            <Flex wrap={"wrap"} mt="2" gap="6" align={"center"}>
              <Flex align={"center"} gap="2">
                <Text size="2">Notify at</Text>
                <Select.Root
                  name="reminderTime"
                  defaultValue={initData?.shouldRemind ? "7am" : "never"}
                >
                  <Select.Trigger />
                  <Select.Content>
                    {Object.keys(defaultTimes).map((k) => (
                      <Select.Item key={k} value={k}>
                        {k}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Flex>
              <Button
                style={{ flexGrow: 1 }}
                loading={create.isLoading || update.isLoading}
                type="submit"
              >
                {initData ? "Update" : "Create"} Task
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
