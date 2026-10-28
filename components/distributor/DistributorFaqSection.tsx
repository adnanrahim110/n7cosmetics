import DistributorFaqItem, { type DistributorFaq } from "./DistributorFaqItem";
import DistributorSection from "./DistributorSection";

const questions: DistributorFaq[] = [
  {
    question: "Is N7 Cosmetics a legitimate UK business?",
    answer:
      "N7 Cosmetics Limited is an active UK-registered company, incorporated on 13 April 2024 under company number 15643763. Its registration details can be independently verified through Companies House.",
  },
  {
    question: "Is N7 Cosmetics an official Yusuf Bhai distributor?",
    answer:
      "Yes. N7 Cosmetics appears on the official Yusuf Bhai Fragrances authorised distributors page under London, United Kingdom.",
  },
  {
    question: "Where is N7 Cosmetics based?",
    answer:
      "N7 Cosmetics is a UK-based online fragrance business. Its registered office is in Edgware, England, and it serves customers through its ecommerce website.",
  },
  {
    question: "What is the official N7 Cosmetics website?",
    answer: "The official N7 Cosmetics website is https://n7cosmetics.co.uk.",
  },
  {
    question: "Is N7 Cosmetics connected to Boots No7?",
    answer:
      "No. N7 Cosmetics Limited is a separate fragrance business and should not be confused with the No7 skincare brand.",
  },
  {
    question: "How can I verify N7 Cosmetics before ordering?",
    answer:
      "You can check our company registration on GOV.UK, confirm our authorised distributor listing on Yusuf Bhai’s official website, review our store policies and contact our customer support team before placing an order.",
  },
];

export default function DistributorFaqSection() {
  return (
    <DistributorSection id="frequently-asked-questions" title="Frequently Asked Questions">
      <div className="divide-y divide-primary-200">
        {questions.map((question) => (
          <DistributorFaqItem key={question.question} {...question} />
        ))}
      </div>
    </DistributorSection>
  );
}
