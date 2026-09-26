import { registerGymService, loginService, getMeService } from "../services/auth.service.js";

export async function registerGym(req, res, next) {
  try {
    const { gymName, phone, adminName, email, password } = req.body || {};

    if (!gymName || !phone || !adminName || !email || !password) {
      return res.status(400).json({
        error: "Los campos gymName, phone, adminName, email y password son obligatorios.",
      });
    }

    const result = await registerGymService({
      gymName,
      phone,
      adminName,
      email,
      password,
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: "Los campos email y password son obligatorios.",
      });
    }

    const result = await loginService(email, password);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const result = await getMeService(req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export default {
  registerGym,
  login,
  getMe,
};
