export const env = {
  SERVER_BASE_URL: process.env["NEXT_PUBLIC_SERVER_BASE_URL"] as string,
};

export const getTRPCBaseUrl = () => {
  return `${env.SERVER_BASE_URL}/trpc`;
};
