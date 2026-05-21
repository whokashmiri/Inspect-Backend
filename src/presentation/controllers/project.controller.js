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
    const result = await projectService.list(req.userId);
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

  async downloadInspectorFile(req, res) {
    const result = await projectService.getInspectorFileDownloadUrl({
      userId: req.userId,
      projectId: req.params.projectId,
      fileId: req.params.fileId,
    });

    return res.status(200).json(result);
  },
};