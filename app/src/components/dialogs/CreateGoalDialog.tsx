"use client";
import { showToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import { Button, Dialog, Flex, TextField } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { FormEventHandler, useState } from "react";
import { DayPicker } from "react-day-picker";
import Center from "../layouts/Center";

export default function CreateGoalDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const create = trpc.goals.create.useMutation();
  const [achieveTill, setAchieveTill] = useState<Date | undefined>();

  const router = useRouter();

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as any);
    const title = formData.get("title") as string;
    if (!achieveTill) {
      showToast("You need to select an end date to achieve your goal", "ERR");
      return;
    }
    create.mutate(
      { title, achieveTill },
      {
        onSuccess: (newGoal) => {
          router.push(`/goal/${newGoal.id}`);
        },

        onError: ({ message }) => {
          showToast(message, "ERR");
        },
      }
    );
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger>{children}</Dialog.Trigger>
      <Dialog.Content width={"fit-content"}>
        <Dialog.Title>What&apos;s your goal?</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <TextField.Root name="title" placeholder="I want to...">
              {achieveTill && (
                <TextField.Slot side="right">
                  by {achieveTill.toLocaleDateString()}
                </TextField.Slot>
              )}
            </TextField.Root>
            <Center>
              <DayPicker
                mode="single"
                selected={achieveTill}
                onSelect={setAchieveTill}
                disabled={[{ from: new Date(0), to: new Date() }]}
              />
            </Center>
            <Button
              disabled={!achieveTill}
              loading={create.isLoading}
              type="submit"
            >
              Create Goal
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
