import { projectRepository } from "../../infrastructure/repositories/project.repo.js";
import { userRepository } from "../../infrastructure/repositories/user.repo.js";
import { AppError } from "../../utils/AppError.js";

export const projectService = {
  async create({ userId, name }) {
    if (!name?.trim()) throw new AppError("Project name is required", 400);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    if (!user.company?.id) {
      throw new AppError("User is not linked to a company", 400);
    }

    const project = await projectRepository.create({
      name: name.trim(),
      companyId: user.company.id,
      userId: user.id,
      workflowStatus: "new",
    });

    return { project };
  },

async list(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (!user.company) {
    throw new AppError("User is not linked to a company", 400);
  }

  // ✅ Extract id safely
  const companyId = user.company.id || user.company._id;

  const projects = await projectRepository.findByCompanyId(companyId);

  return { projects };
}
};