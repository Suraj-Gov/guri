import { showToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc/client";
import { Button, Dialog, Flex, Spinner, Text } from "@radix-ui/themes";
import React, { useState } from "react";
import { UserTask } from "../../../../server/src/db/models";
import Center from "../layouts/Center";

export default function MarkProgressDialog({
  children,
  task,
}: {
  task: UserTask;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const trpcUtils = trpc.useUtils();
  const markProgress = trpc.tasks.markProgress.useMutation({
    onSuccess: ({ message }) => {
      showToast(message, "OK");
      trpcUtils.tasks.get.invalidate({ goalId: task.goalId });
      setIsOpen(false);
    },
    onError: ({ message, data }) => {
      const is500Err = data?.code === "INTERNAL_SERVER_ERROR";
      if (is500Err) {
        showToast(message, "ERR");
      }
    },
  });

  const onMark = () => {
    markProgress.mutate({ goalId: task.goalId, id: task.id });
  };

  const onForceMark = () => {
    markProgress.mutate({ goalId: task.goalId, id: task.id, force: true });
  };

  return (
    <Dialog.Root
      open={isOpen || markProgress.isLoading}
      onOpenChange={setIsOpen}
    >
      <Dialog.Trigger onClick={onMark}>{children}</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title align={"center"}>
          One step closer to your goal!
        </Dialog.Title>
        <Dialog.Description align={"center"}>
          <Text
            dangerouslySetInnerHTML={{
              __html: markProgress.error?.message ?? "",
            }}
          />
        </Dialog.Description>
        {markProgress.isLoading && (
          <Center gap="4" mt="4">
            <Spinner size={"3"} />
            <Text>Marking your progress</Text>
          </Center>
        )}
        {markProgress.error?.data?.code === "BAD_REQUEST" && (
          <Flex mt="4" gap="4">
            <Button
              loading={markProgress.isLoading}
              onClick={onForceMark}
              style={{ flexGrow: 1 }}
              variant="soft"
            >
              Yes
            </Button>
            <Button
              disabled={markProgress.isLoading}
              onClick={() => setIsOpen(false)}
              style={{ flexGrow: 1 }}
              variant="soft"
              color="red"
            >
              No
            </Button>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
