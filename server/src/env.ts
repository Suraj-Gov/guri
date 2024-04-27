const get = (key: string) => process.env[key];

export const env = {
  PORT: Number(get("PORT")),
  POSTGRES_URI: get("POSTGRES_URI") as string,
  HOST: get("HOST") as string,
  GCP_SERVACC_PKEY: get("GCP_SERVACC") as string,
  SECRET: get("SECRET") as string,
  BASE_URL: get("BASE_URL") as string,
};
