import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Project Manager" },
    { name: "description", content: "Organize and manage your projects." },
  ];
}

export default function Home() {
  return <div />;
}
