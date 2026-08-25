export type AdminToastType = "success" | "warning" | "error";

export interface AdminToastFeedback {
  id: string;
  type: AdminToastType;
  title: string;
  description?: string;
  consume: string[];
}

interface ToastCopy {
  type: AdminToastType;
  title: string;
  description?: string;
}

const directFeedback: Record<string, ToastCopy> = {
  "product-created": { type: "success", title: "Product created", description: "The new product is now in your catalogue." },
  "product-updated": { type: "success", title: "Product updated", description: "Your latest product changes have been saved." },
  "product-archived": { type: "success", title: "Product archived", description: "It is hidden from the storefront and still available in admin." },
  "category-activated": { type: "success", title: "Category activated", description: "Customers can now see this category." },
  "category-hidden": { type: "warning", title: "Category hidden", description: "Customers can no longer see this category." },
  "collection-archived": { type: "warning", title: "Collection archived", description: "It is no longer available on the storefront." },
  "collection-restored": { type: "success", title: "Collection restored", description: "The collection is available as a draft." },
  "review-published": { type: "success", title: "Review published", description: "The review can now appear on the product page." },
  "review-rejected": { type: "warning", title: "Review rejected", description: "The review will not appear on the storefront." },
  "review-pending": { type: "success", title: "Review moved to pending", description: "It is ready for another moderation decision." },
};

function sectionName(value: string): string {
  return value.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function item(pathname: string, param: string, value: string, copy: ToastCopy): AdminToastFeedback {
  return { id: `${pathname}:${param}:${value}`, consume: [param], ...copy };
}

export function resolveAdminToastFeedback(pathname: string, query: URLSearchParams): AdminToastFeedback[] {
  const feedback: AdminToastFeedback[] = [];
  const add = (param: string, copy: ToastCopy) => {
    const value = query.get(param);
    if (value) feedback.push(item(pathname, param, value, copy));
  };

  const direct = query.get("toast");
  if (direct && directFeedback[direct]) feedback.push(item(pathname, "toast", direct, directFeedback[direct]));

  if (pathname === "/admin/login") {
    const error = query.get("error");
    if (error === "rate-limited") {
      feedback.push(item(pathname, "error", error, { type: "warning", title: "Please wait before trying again", description: "There have been several unsuccessful sign-in attempts. Try again in 15 minutes." }));
    } else if (error) {
      feedback.push(item(pathname, "error", error, { type: "error", title: "We couldn’t sign you in", description: "Check your email and password, then try again." }));
    }
    if (query.has("reset")) feedback.push(item(pathname, "reset", query.get("reset") ?? "1", { type: "success", title: "Password updated", description: "Sign in with your new password." }));
    if (query.has("password-changed")) feedback.push(item(pathname, "password-changed", query.get("password-changed") ?? "1", { type: "success", title: "Password updated", description: "Sign in with your new password." }));
  }

  if (pathname === "/admin/forgot-password" && query.has("sent")) {
    feedback.push(item(pathname, "sent", query.get("sent") ?? "1", { type: "success", title: "Check your inbox", description: "If the account exists, a reset link has been sent. Check your spam folder too." }));
  }

  if (pathname === "/admin/reset-password") {
    const error = query.get("error");
    if (error === "invalid") {
      feedback.push(item(pathname, "error", error, { type: "error", title: "This reset link can’t be used", description: "It may be invalid, expired, or already used. Request a new link to continue." }));
    } else if (error) {
      feedback.push(item(pathname, "error", error, { type: "error", title: "Choose a stronger password", description: "Use matching passwords with at least 12 characters, including uppercase, lowercase, a number, and a symbol." }));
    }
  }

  if (pathname === "/admin/categories") {
    add("saved", { type: "success", title: "Category saved", description: "Your category changes are now available in admin." });
    const error = query.get("error");
    const errors: Record<string, ToastCopy> = {
      duplicate: { type: "error", title: "That category already exists", description: "Use a different name or web address, then try again." },
      media: { type: "error", title: "The category image couldn’t be saved", description: "Choose a supported image under 10 MB. No changes were made." },
      save: { type: "error", title: "The category couldn’t be saved", description: "Nothing was changed. Please try again." },
      invalid: { type: "error", title: "Some category details need attention", description: "Review the required fields and try again." },
    };
    if (error) feedback.push(item(pathname, "error", error, errors[error] ?? errors.invalid));
  }

  if (pathname === "/admin/collections") {
    add("saved", { type: "success", title: "Collection saved", description: "Your collection changes are now available in admin." });
    const error = query.get("error");
    const errors: Record<string, ToastCopy> = {
      duplicate: { type: "error", title: "That collection already exists", description: "Use a different name or web address, then try again." },
      media: { type: "error", title: "The collection image couldn’t be saved", description: "Choose a supported image under 10 MB. No changes were made." },
      save: { type: "error", title: "The collection couldn’t be saved", description: "Nothing was changed. Please try again." },
      invalid: { type: "error", title: "Some collection details need attention", description: "Review the required fields and try again." },
    };
    if (error) feedback.push(item(pathname, "error", error, errors[error] ?? errors.invalid));
  }

  if (pathname === "/admin/coupons") {
    add("saved", { type: "success", title: "Coupon saved", description: "The coupon settings have been updated." });
    const error = query.get("error");
    if (error) feedback.push(item(pathname, "error", error, error === "duplicate"
      ? { type: "error", title: "That coupon code is already in use", description: "Choose a different code and try again." }
      : { type: "error", title: "Some coupon details need attention", description: "Review the code, limits, and selected discount." }));
  }

  if (pathname === "/admin/delivery") {
    add("saved", { type: "success", title: "Delivery settings saved", description: "Your delivery options have been updated." });
    const error = query.get("error");
    if (error) feedback.push(item(pathname, "error", error, error === "zone"
      ? { type: "error", title: "The delivery zone needs attention", description: "Check its name and two-letter country codes." }
      : { type: "error", title: "The delivery method needs attention", description: "Check its price, delivery estimate, and free-delivery threshold." }));
  }

  if (pathname === "/admin/discounts") {
    add("saved", { type: "success", title: "Discount saved", description: "The promotion settings have been updated." });
    add("error", { type: "error", title: "Some discount details need attention", description: "Check the value, date range, and the products or collections it applies to." });
  }

  if (pathname === "/admin/homepage") {
    const saved = query.get("saved");
    if (saved) feedback.push(item(pathname, "saved", saved, { type: "success", title: `${sectionName(saved)} saved`, description: "The homepage has been updated." }));
    const error = query.get("error");
    if (error) feedback.push(item(pathname, "error", error, { type: "error", title: `${sectionName(error)} needs attention`, description: "Review the fields in this section and try again." }));
  }

  if (pathname === "/admin/settings") {
    add("saved", { type: "success", title: "Store settings saved", description: "Your global store preferences have been updated." });
    add("error", { type: "error", title: "Some store settings need attention", description: "Check the email address, text lengths, and inventory threshold." });
    add("social-saved", { type: "success", title: "Social profiles published", description: "The updated links are now available across the storefront." });
    add("social-error", { type: "error", title: "Some social links need attention", description: "Choose a supported platform and enter a complete web address for each profile." });
    add("smtp-saved", { type: "success", title: "Email delivery settings saved", description: "Your credentials were stored securely." });
    add("smtp-error", { type: "error", title: "Email delivery settings need attention", description: "Check the server details and sender email address." });
    const test = query.get("smtp-test");
    const tests: Record<string, ToastCopy> = {
      sent: { type: "success", title: "Test email sent", description: "Check your inbox to confirm delivery." },
      failed: { type: "error", title: "The test email wasn’t sent", description: "Check the email server, security mode, username, and password." },
      skipped: { type: "warning", title: "Email delivery isn’t ready yet", description: "Complete the email delivery settings before sending a test." },
    };
    if (test) feedback.push(item(pathname, "smtp-test", test, tests[test] ?? tests.failed));
  }

  if (pathname === "/admin/profile") {
    add("saved", { type: "success", title: "Profile updated", description: "Your administrator details have been saved." });
    const error = query.get("error");
    if (error) feedback.push(item(pathname, "error", error, error === "email"
      ? { type: "error", title: "That email address is already in use", description: "Enter a different administrator email address." }
      : { type: "error", title: "Your profile couldn’t be updated", description: "Check your name and email address, then try again." }));
    const passwordError = query.get("password-error");
    if (passwordError) feedback.push(item(pathname, "password-error", passwordError, passwordError === "current"
      ? { type: "error", title: "The current password is incorrect", description: "Re-enter your current password and try again." }
      : { type: "error", title: "Choose a stronger password", description: "Use matching passwords with at least 12 characters, including uppercase, lowercase, a number, and a symbol." }));
  }

  if (/^\/admin\/orders\/[1-9]\d*$/.test(pathname)) {
    add("saved", { type: "success", title: "Order updated", description: "The latest order status and notes have been saved." });
    const error = query.get("error");
    if (error) feedback.push(item(pathname, "error", error, error === "denied"
      ? { type: "warning", title: "That status change isn’t available", description: "This order has already moved further ahead in fulfilment." }
      : { type: "error", title: "The order couldn’t be updated", description: "Review the status and note, then try again." }));
  }

  if (/^\/admin\/pages\/[^/]+$/.test(pathname)) {
    const saved = query.get("saved");
    if (saved) feedback.push(item(pathname, "saved", saved, { type: "success", title: `${sectionName(saved)} section saved`, description: "The storefront page has been updated." }));
    const error = query.get("error");
    if (error) feedback.push(item(pathname, "error", error, { type: "error", title: `${sectionName(error)} section needs attention`, description: "Review its text and product selections, then try again." }));
  }

  if (/^\/admin\/products\/(?:new|[1-9]\d*)$/.test(pathname)) {
    add("saved", { type: "success", title: "Product saved", description: "Your latest product changes have been saved." });
    add("error", { type: "error", title: "Some product details need attention", description: "Review the required fields and try again." });
  }

  return feedback;
}
