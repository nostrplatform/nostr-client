import { 
  Accordion,
  AccordionContent, 
  AccordionItem,
  AccordionTrigger
} from '@/shared/components/ui/accordion';
import { HelpCircleIcon } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export const ProjectFAQ = ({ faq }: { faq?: FAQItem[] }) => {
  if (!faq?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <HelpCircleIcon className="h-12 w-12 mb-4 opacity-20" />
        <p>No FAQ available</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {faq.map((item, idx) => (
        <AccordionItem key={idx} value={`item-${idx}`}>
          <AccordionTrigger className="text-left">
            {item.question}
          </AccordionTrigger>
          <AccordionContent>
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
