import GroupClient from "./GroupClient";

export default function GroupPage({ params }: { params: { code: string } }) {
  return <GroupClient code={params.code} />;
}
