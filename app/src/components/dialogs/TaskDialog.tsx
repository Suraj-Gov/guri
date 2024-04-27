"use client";
import { showToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import { BellIcon } from "@radix-ui/react-icons";
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  Slider,
  Switch,
  Tabs,
  Text,
  TextField,
} from "@radix-ui/themes";
import dayjs from "dayjs";
import { FormEventHandler, useState } from "react";
import { TaskSchedule, UserTask } from "../../../../server/src/db/models";
import Center from "../layouts/Center";

const tzHoursOffset = new Date().getTimezoneOffset() / 60;

const defaultSchedule = {
  days: [0, 1, 2, 3, 4, 5, 6],
  reminderTimestamps: [
    dayjs()
      .set("hour", 9 + tzHoursOffset)
      .toISOString(),
  ],
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
    const shouldRemind = formData.get("shouldRemind") === "on";

    const payload = {
      title,
      countToAchieve,
      shouldRemind,
      schedule,
      goalId,
    };

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
            setSchedule(defaultSchedule);
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
            shouldRemind ? "Reminding you at 9am!" : "Good luck!",
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
                          <Badge
                            key={idx}
                            variant={
                              schedule.days[idx] !== -1 ? "solid" : "soft"
                            }
                            onClick={() => toggleDays(idx)}
                            asChild
                          >
                            <button type="button">{d}</button>
                          </Badge>
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

            <Flex mt="2" gap="6" align={"center"}>
              <Flex gap="2">
                <Switch name="shouldRemind" />
                <Text size="2">
                  <Flex align={"center"} gap="1">
                    <BellIcon />
                    Notify?
                  </Flex>
                </Text>
              </Flex>
              <Button
                style={{ flexGrow: 1 }}
                loading={create.isLoading || update.isLoading}
                type="submit"
              >
                Create Task
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
