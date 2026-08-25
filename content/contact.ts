export const contactTopics = [
  { value: "ORDER_SUPPORT", label: "Order support" },
  { value: "DELIVERY_RETURN", label: "Delivery or return" },
  { value: "PRODUCT_ADVICE", label: "Product advice" },
  { value: "BUSINESS_ENQUIRY", label: "Business enquiry" },
  { value: "OTHER", label: "Something else" },
] as const;

export type ContactTopic = (typeof contactTopics)[number]["value"];

export function contactTopicLabel(topic: ContactTopic): string {
  return contactTopics.find((option) => option.value === topic)?.label ?? "General enquiry";
}
