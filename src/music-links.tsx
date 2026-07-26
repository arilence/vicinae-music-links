import {
    Action,
    ActionPanel,
    Clipboard,
    Color,
    Icon,
    List,
    PopToRootType,
    showHUD,
} from "@vicinae/api";

type StreamingService = {
    name: string;
    color: Color;
};

type MusicMetadata = {
    title: string;
    artist: string;
    album: string;
    type: "Song" | "Album";
};

type UniversalLinkResult = {
    id: string;
    provider: string;
    pageUrl: string;
    music: MusicMetadata;
    services: StreamingService[];
};

const mockMusic: MusicMetadata = {
    title: "Song Title",
    artist: "Artist",
    album: "Album Title",
    type: "Song",
};

const mockResults: UniversalLinkResult[] = [
    {
        id: "odesli",
        provider: "Odesli",
        pageUrl: "https://album.link",
        music: mockMusic,
        services: [
            { name: "Spotify", color: Color.Green },
            { name: "Apple Music", color: Color.Red },
            { name: "Tidal", color: Color.Blue },
            { name: "YouTube Music", color: Color.Red },
            { name: "Deezer", color: Color.Magenta },
            { name: "SoundCloud", color: Color.Orange },
        ],
    },
];

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
                    <List.Item.Detail.Metadata.Label
                        title="Artist"
                        text={result.music.artist}
                        icon={Icon.Person}
                    />
                    <List.Item.Detail.Metadata.Label
                        title="Album"
                        text={result.music.album}
                    />
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
                                key={service.name}
                                text={service.name}
                                color={service.color}
                            />
                        ))}
                    </List.Item.Detail.Metadata.TagList>
                    <List.Item.Detail.Metadata.Separator />
                    <List.Item.Detail.Metadata.Link
                        title={"Universal Link"}
                        text={result.pageUrl}
                        target={result.pageUrl}
                    />
                    <List.Item.Detail.Metadata.Label
                        title="Provider"
                        text={result.provider}
                    />
                </List.Item.Detail.Metadata>
            }
        />
    );
}

export default function Command() {
    async function copyUniversalLink(result: UniversalLinkResult) {
        await Clipboard.copy(result.pageUrl);
        await showHUD(`${result.provider} link copied`, {
            clearRootSearch: true,
            popToRootType: PopToRootType.Immediate,
        });
    }

    return (
        <List
            navigationTitle="Universal Music Links"
            searchBarPlaceholder="Filter compatible link services..."
            isShowingDetail
        >
            <List.Section
                title="Compatible Services"
                subtitle={`${mockResults.length} found`}
            >
                {mockResults.map((result) => {
                    return (
                        <List.Item
                            key={result.id}
                            id={result.id}
                            title={result.provider}
                            icon={Icon.Link}
                            keywords={[
                                result.music.title,
                                result.music.artist,
                                ...result.services.map(
                                    (service) => service.name,
                                ),
                            ]}
                            accessories={[
                                {
                                    text: `${result.services.length} services`,
                                },
                            ]}
                            detail={<MusicLinkMetadata result={result} />}
                            actions={
                                <ActionPanel>
                                    <Action
                                        title={`Copy ${result.provider} Link`}
                                        icon={Icon.CopyClipboard}
                                        shortcut="copy"
                                        autoFocus
                                        onAction={() =>
                                            copyUniversalLink(result)
                                        }
                                    />
                                    <Action.OpenInBrowser
                                        title={`Open ${result.provider} Link`}
                                        icon={Icon.Globe01}
                                        url={result.pageUrl}
                                    />
                                </ActionPanel>
                            }
                        />
                    );
                })}
            </List.Section>
        </List>
    );
}
