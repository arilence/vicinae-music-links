import { songlinkProvider } from "./songlink";
import type { UniversalLinkProvider } from "./types";

export type {
    MusicMetadata,
    StreamingService,
    UniversalLinkProvider,
    UniversalLinkResult,
} from "./types";

export const universalLinkProviders = [
    songlinkProvider,
] satisfies UniversalLinkProvider[];
