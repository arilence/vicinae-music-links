export type StreamingService = {
  id: string;
  name: string;
};

export type MusicMetadata = {
  title: string;
  artist?: string;
  album?: string;
  type: string;
};

export type UniversalLinkResult = {
  id: string;
  provider: string;
  pageUrl: string;
  music: MusicMetadata;
  services: StreamingService[];
};

export type UniversalLinkProvider = {
  id: string;
  name: string;
  resolve: (
    inputUrl: string,
    signal?: AbortSignal,
  ) => Promise<UniversalLinkResult>;
};
