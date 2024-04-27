import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Callout } from "@radix-ui/themes";

export default function ExceptionCallout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Callout.Root color="amber">
      <Callout.Icon>
        <ExclamationTriangleIcon />
      </Callout.Icon>
      <Callout.Text>{children}</Callout.Text>
    </Callout.Root>
  );
}
