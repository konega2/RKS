import { EventControlBoard } from "@/components/event-control-board";

import { getEventoSnapshot } from "./data";

export default async function EventoPage() {
  const snapshot = await getEventoSnapshot();

  return <EventControlBoard initialSnapshot={snapshot} />;
}
