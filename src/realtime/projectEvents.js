let ioInstance = null;

export function registerSocketServer(io) {
  ioInstance = io;
}

export function emitProjectChanged(project, reason = "project_changed") {
  if (!ioInstance || !project?._id) return;

  const payload = {
    projectId: String(project._id),
    syncVersion: Number(project.syncVersion || 1),
    updatedAt: project.updatedAt,
    changedAt: project.lastSyncedChangeAt || project.updatedAt,
    reason,
  };

  ioInstance.to(`project:${project._id}`).emit("project:changed", payload);
}