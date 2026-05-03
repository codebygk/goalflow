import { db } from "@/lib/db"
import { tasks } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(tasks).where(eq(tasks.id, params.id))

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete permanently" },
      { status: 500 }
    )
  }
}