"use client";
import { showToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import {
  EnvelopeClosedIcon,
  LockClosedIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { Button, Container, Flex, TextField } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { FormEventHandler } from "react";

export default function SignupForm() {
  const signup = trpc.user.signup.useMutation();
  const router = useRouter();

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as any);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    signup.mutate(
      { email, password, name },
      {
        onSuccess: () => {
          router.replace("/");
          router.refresh();
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
        <form onSubmit={handleSubmit}>
          <Flex direction={"column"} gap="4">
            <TextField.Root
              required
              minLength={2}
              name="name"
              type="text"
              placeholder="Your name"
            >
              <TextField.Slot>
                <PersonIcon />
              </TextField.Slot>
            </TextField.Root>
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
                <LockClosedIcon height={"8"} width={"8"} />
              </TextField.Slot>
            </TextField.Root>
            <Button loading={signup.isLoading} type="submit">
              Sign up
            </Button>
          </Flex>
        </form>
      </Container>
    </Flex>
  );
}
