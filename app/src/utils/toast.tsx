import {
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import toast from "react-hot-toast";

export const showToast = (msg: string, type: "OK" | "WARN" | "ERR" = "OK") => {
  const duration = type === "OK" ? 3000 : 5000;
  const icon =
    type === "OK" ? (
      <InfoCircledIcon height={"16"} width={"16"} />
    ) : (
      <ExclamationTriangleIcon height={"16"} width={"16"} />
    );

  const props = {
    duration,
    icon,
  };
  switch (type) {
    case "OK":
      return toast(msg, props);
    case "WARN":
    case "ERR":
      return toast.error(msg, props);
  }
};
