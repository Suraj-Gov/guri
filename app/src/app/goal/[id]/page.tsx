import ExceptionCallout from "@/components/callouts/Exception";
import GoalView from "@/components/sections/GoalView";
import { trpcProxy } from "@/utils/trpc/server";
import Link from "next/link";

export default async function GoalPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);

  if (isNaN(id)) {
    return (
      <ExceptionCallout>
        Invalid page. Go <Link href="/">home</Link>
      </ExceptionCallout>
    );
  }

  const goal = await trpcProxy.goals.get
    .query({ id })
    .then((g) => g)
    .catch();
  const tasks = await trpcProxy.tasks.get
    .query({ goalId: id })
    .then((t) => t)
    .catch();

  return <GoalView id={id} goal={goal?.[0]} tasks={tasks} />;
}
