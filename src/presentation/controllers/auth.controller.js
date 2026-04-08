// auth.controller.js

import { authService } from "../../application/auth/auth.service.js";

export const authController = {
  async signup(req, res) {
    console.log("signup/post");
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  },

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
};


