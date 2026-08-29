import {
  Action,
  ActionPanel,
  Clipboard,
  Color,
  Detail,
  Icon,
  List,
  type LaunchProps,
  PopToRootType,
  showHUD,
} from "@vicinae/api";
import { useEffect, useRef, useState } from "react";
import {
  type StreamingService,
  type UniversalLinkResult,
  universalLinkProviders,
} from "./providers";

type CommandArguments = {
  link: string;
};

type ProviderState =
  | { status: "loading" }
  | { status: "success"; result: UniversalLinkResult }
  | { status: "error"; message: string };

const serviceColors: Record<string, Color> = {
  amazonMusic: Color.Orange,
  amazonStore: Color.Orange,
  appleMusic: Color.Red,
  deezer: Color.Magenta,
  napster: Color.Blue,
  pandora: Color.Blue,
  soundcloud: Color.Orange,
  spotify: Color.Green,
  tidal: Color.Blue,
  youtube: Color.Red,
  youtubeMusic: Color.Red,
  yandex: Color.Yellow,
};

function initialProviderStates(): Record<string, ProviderState> {
  return Object.fromEntries(
    universalLinkProviders.map((provider) => [
      provider.id,
      { status: "loading" },
    ]),
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown provider error";
}

function serviceColor(service: StreamingService): Color {
  return serviceColors[service.id] ?? Color.Purple;
}

function MusicLinkMetadata({ result }: { result: UniversalLinkResult }) {
  return (
    <List.Item.Detail
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label
            title="Title"
            text={result.music.title}
            icon={Icon.Music}
          />
          {result.music.artist ? (
            <List.Item.Detail.Metadata.Label
              title="Artist"
              text={result.music.artist}
              icon={Icon.Person}
            />
          ) : null}
          {result.music.album ? (
            <List.Item.Detail.Metadata.Label
              title="Album"
              text={result.music.album}
            />
          ) : null}
          <List.Item.Detail.Metadata.Label
            title="Type"
            text={result.music.type}
          />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.TagList
            title={`Links available (${result.services.length})`}
          >
            {result.services.map((service) => (
              <List.Item.Detail.Metadata.TagList.Item
                key={service.id}
                text={service.name}
                color={serviceColor(service)}
              />
            ))}
          </List.Item.Detail.Metadata.TagList>
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Link
            title="Universal Link"
            text={result.pageUrl}
            target={result.pageUrl}
          />
          <List.Item.Detail.Metadata.Label
            title="Provider"
            text={`Powered by ${result.provider}`}
          />
        </List.Item.Detail.Metadata>
      }
    />
  );
}

export default function Command({
  arguments: { link },
}: LaunchProps<{ arguments: CommandArguments }>) {
  const [providerStates, setProviderStates] = useState<
    Record<string, ProviderState>
  >(initialProviderStates);
  const [selectedProviderId, setSelectedProviderId] = useState(
    universalLinkProviders[0]?.id,
  );
  const [isRefreshingSelectedDetail, setIsRefreshingSelectedDetail] =
    useState(false);
  const previousSelection = useRef<{
    id?: string;
    status?: ProviderState["status"];
  }>({});

  useEffect(() => {
    const abortController = new AbortController();
    setProviderStates(initialProviderStates());

    for (const provider of universalLinkProviders) {
      void provider
        .resolve(link, abortController.signal)
        .then((result) => {
          setProviderStates((currentStates) => ({
            ...currentStates,
            [provider.id]: { status: "success", result },
          }));
        })
        .catch((error: unknown) => {
          if (abortController.signal.aborted) {
            return;
          }

          setProviderStates((currentStates) => ({
            ...currentStates,
            [provider.id]: {
              status: "error",
              message: errorMessage(error),
            },
          }));
        });
    }

    return () => abortController.abort();
  }, [link]);

  const states = Object.values(providerStates);
  const readyProviderCount = states.filter(
    (state) => state.status === "success",
  ).length;
  const failedProviderCount = states.filter(
    (state) => state.status === "error",
  ).length;
  const isLoading = states.some((state) => state.status === "loading");
  const selectedProviderState = selectedProviderId
    ? providerStates[selectedProviderId]
    : undefined;
  const isSelectedProviderReady = selectedProviderState?.status === "success";

  useEffect(() => {
    const selectedStatus = selectedProviderState?.status;
    const becameReady =
      previousSelection.current.id === selectedProviderId &&
      previousSelection.current.status !== "success" &&
      selectedStatus === "success";

    previousSelection.current = {
      id: selectedProviderId,
      status: selectedStatus,
    };

    if (!becameReady) {
      return;
    }

    setIsRefreshingSelectedDetail(true);
    const timer = setTimeout(() => setIsRefreshingSelectedDetail(false), 50);

    return () => clearTimeout(timer);
  }, [selectedProviderId, selectedProviderState?.status]);

  async function copyUniversalLink(result: UniversalLinkResult) {
    await Clipboard.copy(result.pageUrl);
    await showHUD(`${result.provider} link copied`, {
      clearRootSearch: true,
      popToRootType: PopToRootType.Immediate,
    });
  }

  const sectionSubtitle = isLoading
    ? `${readyProviderCount}/${universalLinkProviders.length} ready`
    : failedProviderCount > 0
      ? `${readyProviderCount} found, ${failedProviderCount} failed`
      : `${readyProviderCount} found`;

  if (isRefreshingSelectedDetail) {
    return <Detail navigationTitle="Universal Music Links" markdown="" />;
  }

  return (
    <List
      navigationTitle="Universal Music Links"
      searchBarPlaceholder="Filter universal link providers..."
      isShowingDetail={isSelectedProviderReady}
      isLoading={isLoading}
      onSelectionChange={setSelectedProviderId}
    >
      <List.Section title="Providers" subtitle={sectionSubtitle}>
        {universalLinkProviders.map((provider) => {
          const state = providerStates[provider.id] ?? {
            status: "loading",
          };
          const result = state.status === "success" ? state.result : undefined;

          return (
            <List.Item
              key={provider.id}
              id={provider.id}
              title={provider.name}
              subtitle={state.status === "error" ? state.message : undefined}
              icon={
                state.status === "success"
                  ? Icon.CheckCircle
                  : state.status === "error"
                    ? Icon.XMarkCircle
                    : Icon.CircleProgress
              }
              keywords={
                result
                  ? [
                      result.music.title,
                      result.music.artist ?? "",
                      ...result.services.map((service) => service.name),
                    ]
                  : []
              }
              accessories={[
                state.status === "success"
                  ? {
                      tag: {
                        value: `${state.result.services.length} services`,
                        color: Color.Green,
                      },
                    }
                  : state.status === "error"
                    ? {
                        tag: {
                          value: "Failed",
                          color: Color.Red,
                        },
                      }
                    : {
                        tag: {
                          value: "Loading",
                          color: Color.Blue,
                        },
                      },
              ]}
              detail={
                result ? <MusicLinkMetadata result={result} /> : undefined
              }
              actions={
                result ? (
                  <ActionPanel>
                    <Action
                      title={`Copy ${result.provider} Link`}
                      icon={Icon.CopyClipboard}
                      shortcut="copy"
                      autoFocus
                      onAction={() => copyUniversalLink(result)}
                    />
                    <Action.OpenInBrowser
                      title={`Open ${result.provider} Link`}
                      icon={Icon.Globe01}
                      url={result.pageUrl}
                    />
                  </ActionPanel>
                ) : undefined
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}
