import { Project } from "../../models/Project.js";
import { emitProjectChanged } from "../../realtime/projectEvents.js";



export async function touchProjectSync(projectId, reason = "project_changed") {
  if (!projectId) return null;

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    {
      $inc: { syncVersion: 1 },
      $currentDate: {
        updatedAt: true,
        lastSyncedChangeAt: true,
      },
    },
    {
      new: true,
      select: "_id syncVersion updatedAt lastSyncedChangeAt",
    }
  ).lean();

  if (updatedProject) {
    emitProjectChanged(updatedProject, reason);
  }

  return updatedProject;
}