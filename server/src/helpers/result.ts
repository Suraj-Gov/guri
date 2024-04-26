import { TRPCError } from "@trpc/server";

type HTTPStatus = TRPCError["code"];

export class Result<T> {
  val: T;
  error?: string;
  readonly errorObject?: unknown;
  private readonly errStatusCode?: HTTPStatus;

  constructor(
    val: T,
    error?: string,
    errStatusCode?: HTTPStatus,
    errorData?: unknown
  ) {
    this.val = val;
    if (error) this.error = error;
    if (errStatusCode) this.errStatusCode = errStatusCode;
    if (errorData) this.errorObject = errorData;
  }

  static error(error: string, errStatusCode?: HTTPStatus, errorData?: unknown) {
    return new Result(null as any, error, errStatusCode, errorData);
  }

  public httpErrResponse = (statusCode?: HTTPStatus, cause?: string): T => {
    if (this.error) {
      throw new TRPCError({
        code: statusCode || this.errStatusCode || "INTERNAL_SERVER_ERROR",
        message: this.error,
        cause,
      });
    }

    return this.val;
  };
}
