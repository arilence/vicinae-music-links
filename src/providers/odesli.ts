import type {
  MusicMetadata,
  StreamingService,
  UniversalLinkProvider,
  UniversalLinkResult,
} from "./types";

const ODESLI_BASE_URL = "https://odesli.co/";

type OdesliLink = {
  displayName?: string;
  platform?: string;
  show?: boolean;
  url?: string;
};

type OdesliSection = {
  links?: OdesliLink[];
};

type OdesliEntityData = {
  albumName?: string;
  artistName?: string;
  title?: string;
  type?: string;
};

type OdesliPageData = {
  entityData?: OdesliEntityData;
  pageUrl?: string;
  sections?: OdesliSection[];
};

type OdesliNextData = {
  props?: {
    pageProps?: {
      pageData?: OdesliPageData;
    };
  };
};

function normalizeInputUrl(inputUrl: string): string {
  const trimmedUrl = inputUrl.trim();

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    throw new Error("Enter a valid music link");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("Music links must use HTTP or HTTPS");
  }

  return parsedUrl.toString();
}

function resolverUrlFor(inputUrl: string): string {
  return `${ODESLI_BASE_URL}${encodeURIComponent(normalizeInputUrl(inputUrl))}`;
}

function parsePageData(html: string): OdesliPageData {
  const nextDataMatch = html.match(
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/,
  );

  if (!nextDataMatch?.[1]) {
    throw new Error("Odesli returned an unsupported page");
  }

  let nextData: OdesliNextData;
  try {
    nextData = JSON.parse(nextDataMatch[1]) as OdesliNextData;
  } catch {
    throw new Error("Odesli returned invalid page data");
  }

  const pageData = nextData.props?.pageProps?.pageData;
  if (!pageData) {
    throw new Error("Odesli could not find this music link");
  }

  return pageData;
}

function displayType(type?: string): string {
  if (!type) {
    return "Music";
  }

  return type
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function musicMetadataFrom(pageData: OdesliPageData): MusicMetadata {
  const entity = pageData.entityData;

  if (!entity?.title) {
    throw new Error("Odesli returned incomplete music metadata");
  }

  return {
    title: entity.title,
    artist: entity.artistName,
    album: entity.albumName,
    type: displayType(entity.type),
  };
}

function servicesFrom(pageData: OdesliPageData): StreamingService[] {
  const services = new Map<string, StreamingService>();

  for (const section of pageData.sections ?? []) {
    for (const link of section.links ?? []) {
      if (link.show === false || !link.url) {
        continue;
      }

      const id = link.platform ?? link.displayName;
      if (!id) {
        continue;
      }

      services.set(id, {
        id,
        name: link.displayName ?? id,
      });
    }
  }

  return [...services.values()];
}

async function resolveOdesliLink(
  inputUrl: string,
  signal?: AbortSignal,
): Promise<UniversalLinkResult> {
  const response = await fetch(resolverUrlFor(inputUrl), {
    headers: { Accept: "text/html" },
    redirect: "follow",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Odesli request failed (${response.status})`);
  }

  const pageData = parsePageData(await response.text());
  const pageUrl = pageData.pageUrl ?? response.url;

  return {
    id: odesliProvider.id,
    provider: odesliProvider.name,
    pageUrl,
    music: musicMetadataFrom(pageData),
    services: servicesFrom(pageData),
  };
}

export const odesliProvider: UniversalLinkProvider = {
  id: "odesli",
  name: "Odesli",
  resolve: resolveOdesliLink,
};
