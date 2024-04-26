import { Button, Flex } from "@radix-ui/themes";
import Link from "next/link";

export default function HomeAnonUser() {
  return (
    <Flex flexGrow={"1"} justify={"center"} align={"center"}>
      <Flex align={"stretch"} direction="column" gap={"4"}>
        <Button asChild>
          <Link href={"/signup"}>Create Account</Link>
        </Button>

        <Button asChild style={{ width: "100%" }} variant="soft">
          <Link href={"/login"}>Login</Link>
        </Button>
      </Flex>
    </Flex>
  );
}
