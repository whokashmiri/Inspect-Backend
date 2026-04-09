
// project.controller.js
import { projectService } from "../../application/project/project.service.js";

export const projectController = {
  async create(req, res) {
    console.log("project/post");
    
    const result = await projectService.create({
      userId: req.userId,
      name: req.body.name,
    });

    return res.status(201).json(result);
  },

  async list(req, res) {
    console.log("project/get");
    const result = await projectService.list(req.userId);
    return res.status(200).json(result);
  },
};