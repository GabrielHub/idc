import { CupidOperationsDashboard } from "../components/cupid-operations-dashboard";

export function meta() {
  return [
    { title: "IDC | Cupid Operations" },
    {
      name: "description",
      content: "A local-first relationship operations dashboard for Cupid.",
    },
  ];
}

export default function Home() {
  return <CupidOperationsDashboard />;
}
