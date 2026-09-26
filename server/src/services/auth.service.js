import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/db.js";
import {
  createTenant,
  ensureUniqueSlug,
  findTenantById,
} from "../models/tenant.model.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../models/user.model.js";
import { generateSlug } from "../utils/slug.utils.js";
import { getTenantSubscriptionStatus } from "../utils/tenant.utils.js";

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id || user.tenantId || null,
      fullName: user.full_name || user.fullName,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export async function registerGymService({
  gymName,
  phone,
  adminName,
  email,
  password,
}) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    const error = new Error(
      "El correo electrónico ya se encuentra registrado.",
    );
    error.status = 409;
    throw error;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const tenantId = uuidv4();
    const userId = uuidv4();
    const baseSlug = generateSlug(gymName);
    const slug = await ensureUniqueSlug(connection, baseSlug);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

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

    await connection.commit();

    const token = signToken({
      id: userId,
      email,
      role,
      tenantId,
      fullName: adminName,
    });

    const tenantStatus = getTenantSubscriptionStatus({
      trial_ends_at: trialEndsAt,
    });

    return {
      token,
      user: {
        id: userId,
        email,
        role,
        fullName: adminName,
        tenantId,
      },
      tenant: {
        id: tenantId,
        name: gymName,
        slug,
        phone,
        trialEndsAt,
        status: tenantStatus.status,
        statusLabel: tenantStatus.label,
        trialDaysRemaining: tenantStatus.daysRemaining,
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function loginService(email, password) {
  const user = await findUserByEmail(email);
  if (!user || !user.is_active) {
    const error = new Error("Credenciales inválidas.");
    error.status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error("Credenciales inválidas.");
    error.status = 401;
    throw error;
  }

  let tenantData = null;
  if (user.tenant_id) {
    const tenant = await findTenantById(user.tenant_id);
    if (tenant) {
      const statusInfo = getTenantSubscriptionStatus(tenant);
      tenantData = {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        phone: tenant.phone,
        status: statusInfo.status,
        statusLabel: statusInfo.label,
        daysRemaining: statusInfo.daysRemaining,
        subscriptionEndsAt: tenant.subscription_ends_at,
        trialEndsAt: tenant.trial_ends_at,
      };
    }
  }

  const token = signToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      tenantId: user.tenant_id,
    },
    tenant: tenantData,
  };
}

export async function getMeService(userId) {
  const user = await findUserById(userId);
  if (!user || !user.is_active) {
    const error = new Error("Usuario no encontrado o inactivo.");
    error.status = 404;
    throw error;
  }

  let tenantData = null;
  if (user.tenant_id) {
    const tenant = await findTenantById(user.tenant_id);
    if (tenant) {
      const statusInfo = getTenantSubscriptionStatus(tenant);
      tenantData = {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        phone: tenant.phone,
        status: statusInfo.status,
        statusLabel: statusInfo.label,
        daysRemaining: statusInfo.daysRemaining,
        subscriptionEndsAt: tenant.subscription_ends_at,
        trialEndsAt: tenant.trial_ends_at,
      };
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      tenantId: user.tenant_id,
    },
    tenant: tenantData,
  };
}

export default {
  registerGymService,
  loginService,
  getMeService,
};
