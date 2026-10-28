export interface DistributorFaq {
  question: string;
  answer: string;
}

export default function DistributorFaqItem({
  question,
  answer,
}: DistributorFaq) {
  return (
    <div className="py-6 first:pt-0 last:pb-0">
      <h3 className="font-body text-lg leading-7 font-semibold tracking-normal text-primary-950">
        {question}
      </h3>
      <p className="mt-4">{answer}</p>
    </div>
  );
}
