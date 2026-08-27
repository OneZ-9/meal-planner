import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { CalendarEntryModel } from "@/lib/models/calendarEntry";

type RouteContext = { params: Promise<{ id: string }> };

// Removes a single calendar assignment (the meal chip's "Remove" action).
// Scoped to the authenticated user only, same 404-for-not-mine pattern as
// recipes (a calendar entry is exactly as private as the recipe it
// references).
export const DELETE = async (
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Assignment not found." }, { status: 404 });
  }

  await connectDB();
  const deleted = await CalendarEntryModel.findOneAndDelete({
    _id: id,
    userId: session.user.id,
  });
  if (!deleted) {
    return NextResponse.json({ message: "Assignment not found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
};
