// Global type augmentations for React 19 JSX namespace
// @react-three/fiber's global JSX augmentation does not work with React 19's React.JSX transform.
// This file bridges the gap by importing ThreeElements from @react-three/fiber.

import type { ThreeElements } from "@react-three/fiber";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      "kicanvas-embed": React.HTMLAttributes<HTMLElement> & {
        src?: string;
        controls?: string;
      };
    }
  }
}
