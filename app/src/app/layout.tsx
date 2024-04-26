import Navbar from "@/components/main/Navbar";
import Provider from "@/components/main/Provider";
import { Flex, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "react-day-picker/dist/style.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Guri",
  description: "Build a pipeline for life",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Theme>
          <Provider>
            <Flex direction={"column"} minHeight={"100svh"}>
              <Navbar />
              {children}
            </Flex>
          </Provider>
        </Theme>
      </body>
    </html>
  );
}
