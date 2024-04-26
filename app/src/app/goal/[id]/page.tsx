import GoalView from "@/components/sections/GoalView";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Callout } from "@radix-ui/themes";
import Link from "next/link";

export default function GoalPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);

  if (isNaN(id)) {
    return (
      <Callout.Root color="amber">
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Callout.Text>
          Invalid page. Go <Link href="/">home</Link>
        </Callout.Text>
      </Callout.Root>
    );
  }

  return <GoalView id={id} />;
}
