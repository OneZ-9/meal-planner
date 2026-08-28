export type RegistrationValues = {
  name: string;
  email: string;
  password: string;
};

export type RegistrationValidation =
  | { success: true; values: RegistrationValues }
  | { success: false; message: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

export const validateRegistrationInput = (
  input: unknown,
): RegistrationValidation => {
  if (!input || typeof input !== "object") {
    return { success: false, message: "Enter your account details." };
  }

  const candidate = input as Record<string, unknown>;
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  const email =
    typeof candidate.email === "string" ? normalizeEmail(candidate.email) : "";
  const password =
    typeof candidate.password === "string" ? candidate.password : "";

  if (name.length < 2 || name.length > 80) {
    return { success: false, message: "Name must be 2 to 80 characters." };
  }
  if (!emailPattern.test(email) || email.length > 254) {
    return { success: false, message: "Enter a valid email address." };
  }
  if (password.length < 8 || password.length > 128) {
    return { success: false, message: "Password must be 8 to 128 characters." };
  }

  return { success: true, values: { name, email, password } };
};
