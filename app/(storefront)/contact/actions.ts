"use server";

import type { RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import {
  contactTopicLabel,
  contactTopics,
  type ContactTopic,
} from "@/content/contact";
import { getRequestMetadata } from "@/lib/auth/request";
import { getPublicSiteSettings } from "@/lib/commerce/settings";
import { buildContactEmail } from "@/lib/contact/email";
import { executeMutation, selectOne } from "@/lib/db/query";
import { sendProjectEmail } from "@/lib/email/service";
import { hasDatabaseConfig } from "@/lib/env";

interface AttemptCountRow extends RowDataPacket {
  attempt_count: number | string;
}

type ContactField = "name" | "email" | "phone" | "topic" | "message" | "consent";

export interface ContactFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<ContactField, string>>;
}

const topicValues = contactTopics.map((option) => option.value) as [
  ContactTopic,
  ...ContactTopic[],
];

const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120, "Name is too long."),
  email: z.email("Enter a valid email address.").max(190, "Email is too long.").transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(50, "Phone number is too long.").transform((value) => value || undefined),
  topic: z.enum(topicValues, { error: "Choose what you need help with." }),
  message: z.string().trim().min(20, "Please provide at least 20 characters.").max(5000, "Message must be 5,000 characters or fewer."),
  consent: z.literal("on", { error: "Confirm that you have read the privacy policy." }),
});

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function validationErrors(error: z.ZodError): ContactFormState["fieldErrors"] {
  const flattened = error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;
  return Object.fromEntries(
    Object.entries(flattened)
      .filter((entry): entry is [ContactField, string[]] =>
        Boolean(entry[1]?.length),
      )
      .map(([field, messages]) => [field, messages[0]]),
  );
}

async function recordAttempt(ipAddress: string, succeeded: boolean): Promise<void> {
  await executeMutation(
    "INSERT INTO contact_form_attempts (ip_address, succeeded) VALUES (?, ?)",
    [ipAddress, succeeded],
  );
}

export async function submitContactAction(
  previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  void previousState;

  // A filled honeypot is treated as successful so automated senders receive no signal.
  if (formValue(formData, "companyWebsite")) {
    return {
      status: "success",
      message: "Thank you. Your message has been received.",
    };
  }

  if (!hasDatabaseConfig()) {
    return {
      status: "error",
      message: "The contact form is temporarily unavailable. Please try again later.",
    };
  }

  const metadata = await getRequestMetadata();

  try {
    const recentAttempts = await selectOne<AttemptCountRow>(
      "SELECT COUNT(*) AS attempt_count FROM contact_form_attempts WHERE ip_address = ? AND attempted_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 30 MINUTE)",
      [metadata.ipAddress],
    );

    if (Number(recentAttempts?.attempt_count ?? 0) >= 5) {
      return {
        status: "error",
        message: "Too many messages have been sent from this connection. Please try again later.",
      };
    }

    const parsed = contactFormSchema.safeParse({
      name: formValue(formData, "name"),
      email: formValue(formData, "email"),
      phone: formValue(formData, "phone"),
      topic: formValue(formData, "topic"),
      message: formValue(formData, "message"),
      consent: formValue(formData, "consent"),
    });

    if (!parsed.success) {
      await recordAttempt(metadata.ipAddress, false);
      return {
        status: "error",
        message: "Check the highlighted fields and try again.",
        fieldErrors: validationErrors(parsed.error),
      };
    }

    const settings = await getPublicSiteSettings();
    const recipient = z.email().max(190).safeParse(settings.email);
    if (!recipient.success) {
      await recordAttempt(metadata.ipAddress, false);
      return {
        status: "error",
        message: "The contact email has not been configured. Please try again later.",
      };
    }

    const topic = contactTopicLabel(parsed.data.topic);
    const email = buildContactEmail({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      topic,
      message: parsed.data.message,
    });
    const result = await sendProjectEmail({
      to: recipient.data,
      replyTo: parsed.data.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
      templateKey: "storefront-contact",
    });

    await recordAttempt(metadata.ipAddress, result.status === "SENT");

    if (result.status !== "SENT") {
      return {
        status: "error",
        message: "We could not send your message right now. Please try again later.",
      };
    }

    return {
      status: "success",
      message: "Thank you. Your message has been sent to the N7 Cosmetics team.",
    };
  } catch (error) {
    console.error("Contact form submission failed", error);
    return {
      status: "error",
      message: "We could not send your message right now. Please try again later.",
    };
  }
}
