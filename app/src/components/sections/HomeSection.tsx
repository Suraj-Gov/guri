"use client";
import { Container } from "@radix-ui/themes";
import { UserProfile } from "server/src/db/models";

export default function HomeSection({ user }: { user: UserProfile }) {
  return (
    <Container p="4" size={"2"}>
      TODO
    </Container>
  );
}
