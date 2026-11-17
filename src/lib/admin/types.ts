export interface MagicLinkState {
  status: "idle" | "sent" | "error";
  message?: string;
  /** Echoed back so the form can re-fill the address. */
  email?: string;
}

export interface FormState {
  status: "idle" | "success" | "error";
  message?: string;
}
