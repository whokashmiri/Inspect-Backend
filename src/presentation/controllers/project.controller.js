import { projectService } from "../../application/project/project.service.js";

export const projectController = {
  async create(req, res) {
    const result = await projectService.create({
      userId: req.userId,
      name: req.body.name,
    });

    return res.status(201).json(result);
  },

  async updateWorkflow(req, res) {
    const result = await projectService.updateWorkflow({
      userId: req.userId,
      projectId: req.params.projectId,
      workflowStatus: req.body.workflowStatus,
      isFavorite: req.body.isFavorite,
    });

    return res.status(200).json(result);
  },

  async list(req, res) {
    const result = await projectService.list(req.userId, {
      companyId: req.query.companyId,
    });

    return res.status(200).json(result);
  },

  async offlineManifest(req, res) {
    const result = await projectService.offlineManifest({
      userId: req.userId,
      projectId: req.params.projectId,
    });

    return res.status(200).json(result);
  },

  async offlineChanges(req, res) {
    const result = await projectService.offlineChanges({
      userId: req.userId,
      projectId: req.params.projectId,
      sinceVersion: Number(req.query.sinceVersion || 0),
    });

    return res.status(200).json(result);
  },

  async listInspectorFiles(req, res) {
    const result = await projectService.listInspectorFiles({
      userId: req.userId,
      projectId: req.params.projectId,
    });

    return res.status(200).json(result);
  },

  async listLocations(req, res) {
    const result = await projectService.listLocations({
      userId: req.userId,
      projectId: req.params.projectId,
    });

    return res.status(200).json(result);
  },

  async getInspectorFile(req, res) {
    const result = await projectService.getInspectorFile({
      userId: req.userId,
      projectId: req.params.projectId,
      fileId: req.params.fileId,
    });

    return res.status(200).json(result);
  },

  async updateInspectionDetails(req, res) {
  const result = await projectService.updateInspectionDetails({
    userId: req.userId,
    projectId: req.params.projectId,
    inspectionLocation: req.body.inspectionLocation,
    inspectionMapUrl: req.body.inspectionMapUrl,
    inspectionDate: req.body.inspectionDate,
  });

  return res.status(200).json(result);
},

  async addProjectVideo(req, res) {
    const result = await projectService.addProjectVideo({
      userId: req.userId,
      projectId: req.params.projectId,
      publicId: req.body.publicId,
      name: req.body.name,
      locationIds: req.body.locationIds,
    });

    return res.status(201).json(result);
  },


  async downloadInspectorFile(req, res) {
    const result = await projectService.getInspectorFileDownloadUrl({
      userId: req.userId,
      projectId: req.params.projectId,
      fileId: req.params.fileId,
    });

    return res.status(200).json(result);
  },
};