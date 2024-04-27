import { CloudTasksClient } from "@google-cloud/tasks";
import { env } from "../env";
import { Result } from "./result";

const queueID = "guri";

export class Tasker {
  private static instance: Tasker;
  private client: CloudTasksClient;

  private constructor() {
    this.client = new CloudTasksClient({
      credentials: {
        type: "service_account",
        project_id: "sugo-guri",
        private_key_id: "bdf17d34ba90b35fcb994fc0f6f15fcc4302fda6",
        private_key: env.GCP_SERVACC_PKEY,
        client_email: "ct-man@sugo-guri.iam.gserviceaccount.com",
        client_id: "104857940545824184554",
        universe_domain: "googleapis.com",
      },
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
        parent: this.client.queuePath("sugo-guri", "asia-south1", "guri"),
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
