export interface StorefrontPageFormState {
  status?: "success" | "error";
  message?: string;
  revision?: string;
}

export type StorefrontPageFormAction = (
  previousState: StorefrontPageFormState,
  formData: FormData,
) => Promise<StorefrontPageFormState>;
