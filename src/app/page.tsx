import { Deck } from "@/deck/Deck";
import { LangProvider } from "@/content/lang";

export default function Page() {
  return (
    <LangProvider>
      <Deck />
    </LangProvider>
  );
}
