import { authService } from "../../application/auth/auth.service.js";

export const authController = {
  async login(req, res) {
    console.log("login/post");

    const result = await authService.login(req.body);
    res.json(result);
  },

  async refresh(req, res) {
    console.log("refresh/post");
    const result = await authService.refresh(req.body.refreshToken);
    res.json(result);
  },

  async me(req, res) {
    console.log("me/get");
    const user = await authService.me(req.userId);
    res.json(user);
  },

  async logout(req, res) {
    console.log("logout/post");

    await authService.logout(req.userId);
    res.status(204).send();
  },

  async companies(req, res) {
    const user = await authService.me(req.userId);

    const companies = user.companyName
      ? [{ id: user.companyId ?? null, name: user.companyName }]
      : [];

    // Normalize: if backend returns only name, omit id
    const normalizedCompanies = companies
      .filter((c) => !!c.name)
      .map((c) => ({ id: c.id ?? null, name: c.name }));

    res.json({ companies: normalizedCompanies.filter((c) => c.id) });
  },
};