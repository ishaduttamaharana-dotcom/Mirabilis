import { createFileRoute } from "@tanstack/react-router";
import { usePublicCollection } from "@/hooks/use-public-content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faqs")({
  component: FaqsPage,
});

function FaqsPage() {
  const { items: faqs, isLoading } = usePublicCollection<any>("faqs", [
    {
      id: "faq-1",
      question: "What is your typical production lead time?",
      answer:
        "Standard turnarounds are 5–7 business days for edited stills and 10–14 days for 4K color-graded films. Initial 24-hour preview selects are provided for press releases.",
    },
    {
      id: "faq-2",
      question: "Do you travel across India and internationally?",
      answer:
        "Yes. Our studio is based in Nagpur, giving us central travel access across India within hours. Travel logistics and equipment permits are managed end-to-end by our team.",
    },
    {
      id: "faq-3",
      question: "How are 700MB+ high-bitrate video masters delivered?",
      answer:
        "We deliver full-res ProRes and 4K MP4 masters through our secure studio media server with resumable chunked downloads, alongside streaming previews for web embeds.",
    },
    {
      id: "faq-4",
      question: "What equipment do you use for dusk and night passes?",
      answer:
        "We deploy Sony FX6 / Alpha cinema cameras with G-Master prime lenses, DJI Inspire 3 drones for twilight aerials, and Matterport Pro3 for 3D spatial capture.",
    },
  ]);

  return (
    <main className="min-h-screen bg-background pt-32 pb-24">
      <div className="shell max-w-4xl space-y-12">
        <div className="space-y-4">
          <p className="eyebrow text-primary">KNOWLEDGE & LOGISTICS</p>
          <h1 className="font-display text-4xl font-light text-foreground sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            Answers regarding production workflows, travel logistics, delivery formats, and
            licensing.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading FAQs…</p>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((item: any, idx: number) => (
              <AccordionItem
                key={item.id || idx}
                value={item.id || `faq-${idx}`}
                className="rounded-2xl border border-border/60 bg-card/60 px-6 py-2 shadow-lg"
              >
                <AccordionTrigger className="font-display text-xl font-medium text-foreground hover:no-underline text-left">
                  {item.question || item.title}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed font-light pt-2 pb-4">
                  {item.answer || item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </main>
  );
}
