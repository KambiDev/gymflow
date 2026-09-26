import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/db.js";
import {
  countActiveClientsByTenant,
  countClientsByTenant,
  createTenant,
  ensureUniqueSlug,
  findAllTenants,
  findTenantById,
  updateTenantStatus,
  updateTenantSubscriptionEnd,
} from "../models/tenant.model.js";
import {
  createUser,
  findUserByEmail,
} from "../models/user.model.js";
import { createSubscriptionPayment } from "../models/subscription.model.js";
import { generateSlug } from "../utils/slug.utils.js";
import { getTenantSubscriptionStatus } from "../utils/tenant.utils.js";

function createHttpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function addDays(baseDate, days) {
  const result = new Date(baseDate);
  result.setDate(result.getDate() + Number(days));
  return result;
}

export async function getAllGymsService() {
  const tenants = await findAllTenants();

  const gyms = await Promise.all(
    tenants.map(async (tenant) => {
      const statusInfo = getTenantSubscriptionStatus(tenant);
      const totalClientsCount = await countClientsByTenant(tenant.id);
      const activeClientsCount = await countActiveClientsByTenant(tenant.id);

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        phone: tenant.phone,
        createdAt: tenant.created_at,
        status: statusInfo.status,
        statusLabel: statusInfo.label,
        daysRemaining: statusInfo.daysRemaining,
        subscriptionEndsAt: tenant.subscription_ends_at,
        trialEndsAt: tenant.trial_ends_at,
        isSuspended: Boolean(tenant.is_suspended),
        suspendedReason: tenant.suspended_reason,
        totalClientsCount,
        activeClientsCount,
      };
    }),
  );

  return gyms;
}

export async function createGymManualService({
  gymName,
  phone,
  adminName,
  email,
  password,
  initialPayment,
}) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw createHttpError(
      "El correo electrónico ya se encuentra registrado.",
      409,
    );
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const tenantId = uuidv4();
    const userId = uuidv4();
    const baseSlug = generateSlug(gymName);
    const slug = await ensureUniqueSlug(connection, baseSlug);

    const trialEndsAt = addDays(new Date(), 7);
    const passwordHash = await bcrypt.hash(password, 10);
    const role = "admin";

    await createTenant(connection, {
      id: tenantId,
      name: gymName,
      slug,
      phone,
      trialEndsAt,
    });

    await createUser(connection, {
      id: userId,
      tenantId,
      email,
      passwordHash,
      fullName: adminName,
      role,
    });

    let subscriptionEndsAt = null;

    if (
      initialPayment &&
      initialPayment.amount != null &&
      initialPayment.durationDays != null
    ) {
      const periodStart = new Date();
      const periodEnd = addDays(periodStart, initialPayment.durationDays);

      await createSubscriptionPayment(connection, {
        id: uuidv4(),
        tenantId,
        periodStart,
        periodEnd,
        amount: initialPayment.amount,
        method: initialPayment.method || "cash",
        notes: initialPayment.notes,
        registeredByUserId: initialPayment.registeredByUserId || userId,
      });

      await updateTenantSubscriptionEnd(tenantId, periodEnd, connection);
      subscriptionEndsAt = periodEnd;
    }

    await connection.commit();

    const createdTenant = await findTenantById(tenantId);
    const statusInfo = getTenantSubscriptionStatus(createdTenant);

    return {
      id: tenantId,
      name: gymName,
      slug,
      phone,
      adminId: userId,
      trialEndsAt,
      subscriptionEndsAt,
      status: statusInfo.status,
      statusLabel: statusInfo.label,
      daysRemaining: statusInfo.daysRemaining,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateGymStatusService(
  tenantId,
  { isSuspended, reason },
) {
  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    throw createHttpError("Gimnasio no encontrado.", 404);
  }

  await updateTenantStatus(tenantId, {
    isSuspended,
    suspendedReason: reason,
  });

  return {
    message: isSuspended
      ? "Gimnasio suspendido correctamente."
      : "Gimnasio reactivado correctamente.",
    isSuspended: Boolean(isSuspended),
    suspendedReason: reason ?? null,
  };
}

export async function registerSubscriptionPaymentService(
  tenantId,
  { amount, method, durationDays, notes, registeredByUserId },
) {
  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    throw createHttpError("Gimnasio no encontrado.", 404);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const now = new Date();
    const currentEnd = tenant.subscription_ends_at
      ? new Date(tenant.subscription_ends_at)
      : null;

    const periodStart = currentEnd && currentEnd > now ? currentEnd : now;
    const newEnd = addDays(periodStart, durationDays);

    await createSubscriptionPayment(connection, {
      id: uuidv4(),
      tenantId,
      periodStart,
      periodEnd: newEnd,
      amount,
      method: method || "cash",
      notes,
      registeredByUserId,
    });

    await updateTenantSubscriptionEnd(tenantId, newEnd, connection);

    if (tenant.is_suspended) {
      await updateTenantStatus(
        tenantId,
        { isSuspended: false, suspendedReason: null },
        connection,
      );
    }

    await connection.commit();

    return {
      message: "Pago de suscripción registrado correctamente.",
      subscriptionEndsAt: newEnd,
      status: "active",
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default {
  getAllGymsService,
  createGymManualService,
  updateGymStatusService,
  registerSubscriptionPaymentService,
};
