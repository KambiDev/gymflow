import {
  createGymManualService,
  getAllGymsService,
  registerSubscriptionPaymentService,
  updateGymStatusService,
} from "../services/superadmin.service.js";

export async function getGyms(req, res, next) {
  try {
    const gyms = await getAllGymsService();
    return res.status(200).json({ gyms });
  } catch (error) {
    next(error);
  }
}

export async function createGymManual(req, res, next) {
  try {
    const { gymName, phone, adminName, email, password, initialPayment } =
      req.body || {};

    if (!gymName || !phone || !adminName || !email || !password) {
      return res.status(400).json({
        error:
          "Los campos gymName, phone, adminName, email y password son obligatorios.",
      });
    }

    const result = await createGymManualService({
      gymName,
      phone,
      adminName,
      email,
      password,
      initialPayment,
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateGymStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isSuspended, reason } = req.body || {};

    const result = await updateGymStatusService(id, {
      isSuspended,
      reason,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function registerSubscriptionPayment(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, method, durationDays, notes } = req.body || {};

    if (amount == null || durationDays == null) {
      return res.status(400).json({
        error: "Los campos amount y durationDays son obligatorios.",
      });
    }

    const result = await registerSubscriptionPaymentService(id, {
      amount,
      method,
      durationDays,
      notes,
      registeredByUserId: req.user.id,
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export default {
  getGyms,
  createGymManual,
  updateGymStatus,
  registerSubscriptionPayment,
};
