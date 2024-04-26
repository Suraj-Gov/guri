const get = (key: string) => process.env[key];

export const env = {
  PORT: Number(get("PORT")),
  POSTGRES_URI: get("POSTGRES_URI") as string,
  HOST: get("HOST") as string,
};
