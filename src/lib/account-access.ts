export function canSignIn(user: {
  active: boolean;
  role: string;
  organization: { status: string } | null;
}) {
  return (
    user.active &&
    (user.role === "platform_owner" || user.organization?.status === "active")
  );
}

export function canAccessOrganization(
  user: {
    active: boolean;
    role: string;
    organizationId: string | null;
    organization: { status: string } | null;
  } | null,
  session: { role: string; organizationId: string },
) {
  return Boolean(
    user?.active &&
      user.role === session.role &&
      user.organizationId === session.organizationId &&
      user.organization?.status === "active",
  );
}

export function canManageStaff(role: string) {
  return role === "admin";
}

export function hasCurrentSessionVersion(
  userVersion: number,
  sessionVersion: number,
) {
  return userVersion === sessionVersion;
}
