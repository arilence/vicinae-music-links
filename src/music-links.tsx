import { Action, ActionPanel, Detail, showToast } from "@vicinae/api";

const content = `# Hello world

Your extension is *working* successfully.

Now you can start making changes to this command source file and see it update live here.
`;

export default function SimpleDetail() {
    return (
        <Detail
            markdown={content}
            actions={
                <ActionPanel>
                    <Action
                        title="Say hello"
                        onAction={() => showToast({ title: "Hello!" })}
                    />
                </ActionPanel>
            }
        />
    );
}
