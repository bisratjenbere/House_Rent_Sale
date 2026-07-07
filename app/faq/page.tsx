import { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ - HouseHub",
  description: "Frequently asked questions about HouseHub and using our platform.",
};

const FAQ_ITEMS = [
  {
    question: "How do I list my property on HouseHub?",
    answer:
      "First, create an account and verify your email. Then navigate to your dashboard and click 'Add Property'. Fill in the property details, upload images, and submit for review. Once approved by our team, your listing will go live.",
  },
  {
    question: "Is HouseHub free to use?",
    answer:
      "Yes, browsing properties and creating an account is completely free. Listing your property is also free. We may introduce premium features for property owners and agents in the future.",
  },
  {
    question: "How do I contact a property owner or agent?",
    answer:
      "On any property detail page, you'll find contact options including a message form. You must be logged in to send messages. The owner/agent will receive your inquiry and can respond through our messaging system.",
  },
  {
    question: "What areas does HouseHub cover?",
    answer:
      "HouseHub covers properties across Ethiopia, including major cities like Addis Ababa, Bahir Dar, Hawassa, Mekelle, Gondar, and many others. You can search by city or browse our Popular Cities section.",
  },
  {
    question: "How long does it take for my listing to be approved?",
    answer:
      "Our team typically reviews new listings within 24-48 hours. You'll receive an email notification once your property is approved or if any changes are needed.",
  },
  {
    question: "Can I edit my property listing after it's published?",
    answer:
      "Yes, you can edit your listing at any time from your dashboard. Note that editing a published property will reset its status to 'pending review' and it will be hidden until re-approved by our team.",
  },
  {
    question: "What types of properties can I list?",
    answer:
      "You can list houses, apartments, villas, studios, land, and commercial units. Each listing can be marked as either for rent or for sale.",
  },
  {
    question: "How do I save properties I'm interested in?",
    answer:
      "Click the heart icon on any property card to add it to your favorites. You can view all your saved properties in your dashboard under 'Favorites'.",
  },
  {
    question: "Can I list multiple properties?",
    answer:
      "Yes, there's no limit to the number of properties you can list. Each property will need to go through our approval process.",
  },
  {
    question: "How do I report a problem or get support?",
    answer:
      "You can reach us through our Contact page. Fill out the form with your question or concern, and our support team will respond via email.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "Currently, HouseHub is a listing platform that connects buyers/renters with property owners. Payment arrangements are made directly between parties. We do not process payments through the platform at this time.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "You can request account deletion from your Settings page. Note that deleting your account will also remove all your property listings and cannot be undone.",
  },
];

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="font-display text-4xl font-semibold text-foreground md:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Find answers to common questions about using HouseHub
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Still Have Questions */}
      <div className="max-w-3xl mx-auto mt-16 text-center">
        <div className="rounded-lg border border-border bg-muted/20 p-8">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
            Still have questions?
          </h2>
          <p className="text-muted-foreground mb-6">
            Can't find the answer you're looking for? Get in touch with our support
            team.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
