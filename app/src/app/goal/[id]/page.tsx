import ExceptionCallout from "@/components/callouts/Exception";
import GoalView from "@/components/sections/GoalView";
import { trpcProxy } from "@/utils/trpc/server";
import Link from "next/link";

const getData = async (goalId: number) => {
  try {
    const goal = await trpcProxy.goals.get.query({ id: goalId });
    const tasks = await trpcProxy.tasks.get.query({ goalId });

    return { goal, tasks };
  } catch (err) {
    return {};
  }
};

export default async function GoalPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);

  if (isNaN(id)) {
    return (
      <ExceptionCallout>
        Invalid page. Go <Link href="/">home</Link>
      </ExceptionCallout>
    );
  }

  const { goal, tasks } = await getData(id);

  return <GoalView id={id} goal={goal?.[0]} tasks={tasks} />;
}
