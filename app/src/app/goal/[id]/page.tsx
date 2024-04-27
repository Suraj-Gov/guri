import ExceptionCallout from "@/components/callouts/Exception";
import GoalView from "@/components/sections/GoalView";
import Link from "next/link";

export default function GoalPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);

  if (isNaN(id)) {
    return (
      <ExceptionCallout>
        Invalid page. Go <Link href="/">home</Link>
      </ExceptionCallout>
    );
  }

  return <GoalView id={id} />;
}
