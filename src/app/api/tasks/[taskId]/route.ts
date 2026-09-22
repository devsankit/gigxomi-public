import { NextResponse } from "next/server";

import { requireSessionRole } from "@/lib/api/require-session-role";
import { deleteMarketplaceTask } from "@/lib/gigxomi/app-task-flow-service";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  const authorization = await requireSessionRole(["SUPER_ADMIN", "ADMIN", "MANAGER"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  const { taskId } = await context.params;
  const decodedTaskId = decodeURIComponent(taskId || "").trim();
  if (!decodedTaskId) {
    return NextResponse.json({ ok: false, error: "Task ID is required." }, { status: 400 });
  }

  const result = await deleteMarketplaceTask(authorization.session, decodedTaskId);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    taskId: decodedTaskId,
  });
}
