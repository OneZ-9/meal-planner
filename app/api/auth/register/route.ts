import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { validateRegistrationInput } from "@/lib/auth-validation";
import { connectDB } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

export const POST = async (request: Request): Promise<NextResponse> => {
  const requestBody: unknown = await request.json().catch(() => null);
  const validation = validateRegistrationInput(requestBody);

  if (!validation.success) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const { name, email, password } = validation.values;

  try {
    await connectDB();
    const existingUser = await UserModel.exists({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "An account already exists for this email." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await UserModel.create({ name, email, passwordHash });

    return NextResponse.json(
      { message: "Account created successfully." },
      { status: 201 },
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { message: "An account already exists for this email." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "We could not create your account. Please try again." },
      { status: 500 },
    );
  }
};
