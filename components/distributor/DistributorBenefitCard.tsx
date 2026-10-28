export interface DistributorBenefit {
  title: string;
  description: string;
}

export default function DistributorBenefitCard({
  title,
  description,
}: DistributorBenefit) {
  return (
    <li className="min-w-0 border border-primary-200 bg-white p-6">
      <h3 className="font-body text-lg leading-7 font-semibold tracking-normal text-primary-950">
        {title}
      </h3>
      <p className="mt-4 text-base leading-8 text-dark-700">{description}</p>
    </li>
  );
}
