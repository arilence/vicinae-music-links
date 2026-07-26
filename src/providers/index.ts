import { odesliProvider } from "./odesli";
import { songPortProvider } from "./songport";
import type { UniversalLinkProvider } from "./types";

export type {
    MusicMetadata,
    StreamingService,
    UniversalLinkProvider,
    UniversalLinkResult,
} from "./types";

export const universalLinkProviders = [
    songlinkProvider,
    songPortProvider,
] satisfies UniversalLinkProvider[];
