import { Flex, FlexProps } from "@radix-ui/themes";
import { ElementRef, forwardRef } from "react";

type FlexElement = ElementRef<typeof Flex>;
const Center = forwardRef<FlexElement, FlexProps>((props, ref) => {
  return <Flex {...props} justify={props.justify ?? "center"} ref={ref} />;
});

Center.displayName = "Button";
export default Center;
