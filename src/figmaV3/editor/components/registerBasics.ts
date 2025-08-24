import { registerComponent } from "@/figmaV3/core/registry";

import { BoxDef } from "./Box";
import { ButtonDef } from "./Button";
import { ImageDef } from "./Image";
import { TextDef } from "./Text";

/** 기본 컴포넌트들을 레지스트리에 등록 */
export function registerBasics(): void {
  registerComponent(BoxDef);
  registerComponent(ButtonDef);
  registerComponent(TextDef);
  registerComponent(ImageDef);
}