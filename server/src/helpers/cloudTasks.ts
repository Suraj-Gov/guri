import { v2 } from "@google-cloud/tasks";
import { env } from "../env";
import { Result } from "./result";

// prettier-ignore
const serviceAccountJSON = `{"type":"service_account","project_id":"sugo-guri","private_key_id":"bdf17d34ba90b35fcb994fc0f6f15fcc4302fda6","private_key":"${env.GCP_SERVACC_PKEY}","client_email":"ct-man@sugo-guri.iam.gserviceaccount.com","client_id":"104857940545824184554","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/ct-man%40sugo-guri.iam.gserviceaccount.com","universe_domain":"googleapis.com"}`

export class Tasker {
  private static instance: Tasker;
  private client: v2.CloudTasksClient;

  private constructor() {
    this.client = new v2.CloudTasksClient({
      credentials: JSON.parse(serviceAccountJSON),
    });
  }

  static getInstance = () => {
    if (!this.instance) {
      this.instance = new Tasker();
    }
    return this.instance;
  };

  public enqueueTask = async ({
    payload,
    time,
    url,
  }: {
    payload: Record<string, unknown>;
    url: string;
    time: Date;
  }): Promise<Result<string>> => {
    try {
      const res = await this.client.createTask({
        task: {
          scheduleTime: {
            seconds: Math.round(time.getTime() / 1000),
          },
          httpRequest: {
            httpMethod: "POST",
            body: Buffer.from(JSON.stringify(payload)).toString("base64"),
            headers: {
              "Content-Type": "application/json",
              ["x-guri-secret"]: env.SECRET,
            },
            url,
          },
        },
        parent: this.client.queuePath(
          env.GCP_PROJECT_ID,
          env.GCP_CT_REGION,
          env.GCP_CT_Q_ID
        ),
      });
      const identifier = res[0].name;
      if (!identifier) {
        return Result.error("Could not receive task identifier after enqueue");
      }
      return new Result(identifier);
    } catch (err) {
      console.error(err);
      console.error("could not enqueue task", payload);
      return Result.error("Could not enqueue task");
    }
  };
}
