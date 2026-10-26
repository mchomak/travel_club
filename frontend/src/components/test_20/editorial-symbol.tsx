import { ArrowUpRight, Compass, MapPin, NotebookPen, Route, Luggage, UsersRound } from "lucide-react";

const icons = { route: Route, ready: Luggage, companions: UsersRound, direction: Compass, waypoint: MapPin, note: NotebookPen, onward: ArrowUpRight };

export function EditorialSymbol({ name, className }: { name: keyof typeof icons; className?: string }) {
  const Icon = icons[name];
  return <Icon className={className} size={24} strokeWidth={1.5} aria-hidden="true" focusable="false" />;
}
