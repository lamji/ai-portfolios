import { V1 } from "@/versions/v1";
import { V2 } from "@/versions/v2";

/**
 * Which version of the portfolio is live.
 *  "v1" — the cinematic 3D book
 *  "v2" — white editorial: huge type, scroll reveals, and a 3D laptop that travels through the page
 */
const SITE_VERSION: "v1" | "v2" = "v2";

export default function Home() {
  if (SITE_VERSION === "v1") {
    return <V1 />;
  } else {
    return <V2 />;
  }
}
