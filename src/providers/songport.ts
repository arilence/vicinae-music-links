import type {
  MusicMetadata,
  StreamingService,
  UniversalLinkProvider,
  UniversalLinkResult,
} from "./types";

const SONGPORT_BASE_URL = "https://songport.link/";

const platformNames: Record<string, string> = {
  appleMusic: "Apple Music",
  deezer: "Deezer",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
  tidal: "TIDAL",
  youtubeMusic: "YouTube Music",
};

type SongPortError = {
  error?: string;
  limitReached?: boolean;
};

type SongPortConversion = SongPortError & {
  artist?: string;
  id?: string;
  slug?: string;
  thumbnail?: string;
  title?: string;
};

type SongPortPlatformLink = {
  disabled?: boolean;
  isSearchFallback?: boolean;
  url?: string;
};

type SongPortTrack = SongPortError & {
  artist?: string;
  id?: string;
  platformOrder?: string[] | null;
  platforms?: Record<string, SongPortPlatformLink>;
  slug?: string;
  thumbnail?: string;
  title?: string;
};

function normalizeInputUrl(inputUrl: string): string {
  const trimmedUrl = inputUrl.trim();

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    throw new Error("Enter a valid music link");
  }

  if (
    parsedUrl.protocol !== "https:" &&
    parsedUrl.protocol !== "http:" &&
    parsedUrl.protocol !== "spotify:"
  ) {
    throw new Error("SongPort does not support this kind of music link");
  }

  return parsedUrl.toString();
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.text();

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(`SongPort returned invalid data (${response.status})`);
  }
}

function conversionError(response: Response, result: SongPortError): Error {
  if (response.status === 429 || result.limitReached) {
    return new Error(result.error ?? "SongPort daily conversion limit reached");
  }

  if (response.status === 503) {
    return new Error(
      result.error ?? "SongPort conversions are temporarily unavailable",
    );
  }

  return new Error(
    result.error ?? `SongPort request failed (${response.status})`,
  );
}

function orderedPlatforms(
  track: SongPortTrack,
): [string, SongPortPlatformLink][] {
  const platforms = track.platforms ?? {};
  const orderedIds = [
    ...(track.platformOrder ?? []),
    ...Object.keys(platforms),
  ];
  const seenIds = new Set<string>();

  return orderedIds.flatMap((id) => {
    const link = platforms[id];
    if (seenIds.has(id) || !link) {
      return [];
    }

    seenIds.add(id);
    return [[id, link]];
  });
}

function servicesFrom(track: SongPortTrack): StreamingService[] {
  return orderedPlatforms(track).flatMap(([id, link]) => {
    if (link.disabled || !link.url) {
      return [];
    }

    return [
      {
        id,
        name: platformNames[id] ?? id,
      },
    ];
  });
}

function musicType(track: SongPortTrack): string {
  for (const [id, link] of orderedPlatforms(track)) {
    if (
      link.isSearchFallback ||
      !link.url ||
      (id !== "spotify" && id !== "deezer" && id !== "tidal")
    ) {
      continue;
    }

    try {
      const path = new URL(link.url).pathname.toLowerCase();
      if (path.includes("/album/")) {
        return "Album";
      }
      if (path.includes("/track/")) {
        return "Song";
      }
    } catch {
      // Ignore malformed optional platform links.
    }
  }

  return "Song";
}

function musicMetadataFrom(
  conversion: SongPortConversion,
  track: SongPortTrack,
): MusicMetadata {
  const title = track.title ?? conversion.title;
  if (!title) {
    throw new Error("SongPort returned incomplete music metadata");
  }

  return {
    title,
    artist: track.artist ?? conversion.artist,
    type: musicType(track),
  };
}

async function resolveSongPort(
  inputUrl: string,
  signal?: AbortSignal,
): Promise<UniversalLinkResult> {
  const conversionResponse = await fetch(
    new URL("api/convert", SONGPORT_BASE_URL),
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: normalizeInputUrl(inputUrl) }),
      signal,
    },
  );
  const conversion = await readJson<SongPortConversion>(conversionResponse);

  if (!conversionResponse.ok || conversion.limitReached) {
    throw conversionError(conversionResponse, conversion);
  }

  if (!conversion.id) {
    throw new Error("SongPort conversion did not return a track ID");
  }

  const trackResponse = await fetch(
    new URL(
      `api/track/${encodeURIComponent(conversion.id)}`,
      SONGPORT_BASE_URL,
    ),
    {
      headers: { Accept: "application/json" },
      signal,
    },
  );
  const track = await readJson<SongPortTrack>(trackResponse);

  if (!trackResponse.ok) {
    throw conversionError(trackResponse, track);
  }

  const slug = conversion.slug ?? track.slug ?? conversion.id;

  return {
    id: songPortProvider.id,
    provider: songPortProvider.name,
    pageUrl: new URL(
      `t/${encodeURIComponent(slug)}`,
      SONGPORT_BASE_URL,
    ).toString(),
    music: musicMetadataFrom(conversion, track),
    services: servicesFrom(track),
  };
}

export const songPortProvider: UniversalLinkProvider = {
  id: "songport",
  name: "SongPort",
  resolve: resolveSongPort,
};
