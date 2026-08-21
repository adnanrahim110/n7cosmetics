import { z } from "zod";

export const strongPasswordSchema = z.string().min(12, "Use at least 12 characters.").max(128).superRefine((value, context) => {
  if (!/[a-z]/.test(value)) context.addIssue({ code: "custom", message: "Add a lowercase letter." });
  if (!/[A-Z]/.test(value)) context.addIssue({ code: "custom", message: "Add an uppercase letter." });
  if (!/\d/.test(value)) context.addIssue({ code: "custom", message: "Add a number." });
  if (!/[^A-Za-z0-9]/.test(value)) context.addIssue({ code: "custom", message: "Add a symbol." });
});
