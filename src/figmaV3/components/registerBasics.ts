import { getRegistry } from "@/figmaV3/core/registry";
import { Box } from "./Box";
import { Text } from "./Text";

export function registerBasics(): void {
    const reg = getRegistry();
    reg.register(Box);
    reg.register(Text);
}