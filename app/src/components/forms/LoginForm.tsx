"use client";
import { showToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc/client";
import { EnvelopeClosedIcon, LockClosedIcon } from "@radix-ui/react-icons";
import { Button, Container, Flex, Heading, TextField } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { FormEventHandler, useEffect } from "react";

export default function LoginForm() {
  const user = trpc.user.getUser.useQuery();
  const login = trpc.user.login.useMutation();
  const router = useRouter();

  const navigateToHome = () => {
    router.replace("/");
    router.refresh();
  };

  useEffect(() => {
    if (user.isFetched && user.data?.name) {
      navigateToHome();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.data?.name]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as any);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          navigateToHome();
        },
        onError: (err) => {
          showToast(err.message, "ERR");
        },
      }
    );
  };

  return (
    <Flex flexGrow={"1"} align={"center"}>
      <Container size={"1"}>
        <Heading size="4">Log in</Heading>
        <form onSubmit={handleSubmit}>
          <Flex mt="4" direction={"column"} gap="4">
            <TextField.Root name="email" type="email" placeholder="Email">
              <TextField.Slot>
                <EnvelopeClosedIcon />
              </TextField.Slot>
            </TextField.Root>
            <TextField.Root
              name="password"
              minLength={8}
              type="password"
              placeholder="Password"
            >
              <TextField.Slot>
                <LockClosedIcon />
              </TextField.Slot>
            </TextField.Root>
            <Button loading={login.isLoading} type="submit">
              Log in
            </Button>
          </Flex>
        </form>
      </Container>
    </Flex>
  );
}
