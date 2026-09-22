import { createPublicRedirect, sanitizePublicAuthError } from "@/lib/auth/public-redirect";
import { SUPER_ADMIN_HOME_ROUTE, SUPER_ADMIN_LOGIN_ROUTE } from "@/lib/auth/super-admin-config";
import { authenticatePassword, findUserByIdentifier } from "@/lib/auth/store";
import { applySessionCookie, getDashboardPathForIdentity, getDefaultDashboardPath, getSafeRedirectPath } from "@/lib/auth/session";
import { ensureFreelancerOnboarding, isFreelancerOnboardingEnabled } from "@/lib/gigxomi/freelancer-onboarding-service";
import { getSalesAgentAccess } from "@/lib/gigxomi/sales-store";

export async function POST(request: Request) {
  const formData = await request.formData();
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  const rawLoginScope = String(formData.get("loginScope") ?? "").trim();
  const loginScope = rawLoginScope === "super-admin" || rawLoginScope === "manager" || rawLoginScope === "sales" ? rawLoginScope : "public";
  const loginPath = loginScope === "super-admin" ? SUPER_ADMIN_LOGIN_ROUTE : loginScope === "manager" ? "/manager-login" : loginScope === "sales" ? "/sales/login" : "/login";

  if (!identifier || !password) {
    return createPublicRedirect(loginPath, { error: "Identifier and password are required." });
  }

  const resolvedUser = await findUserByIdentifier(identifier);
  if (resolvedUser?.role === "SUPER_ADMIN" && loginScope !== "super-admin") {
    return createPublicRedirect(SUPER_ADMIN_LOGIN_ROUTE, {
      identifier,
      message: "Use the dedicated super-admin login page for the owner account.",
    });
  }

  if (loginScope === "super-admin" && resolvedUser?.role !== "SUPER_ADMIN") {
    return createPublicRedirect(SUPER_ADMIN_LOGIN_ROUTE, { error: "Only the authorized super-admin account can sign in here." });
  }

  if (loginScope === "manager" && resolvedUser?.role !== "MANAGER") {
    return createPublicRedirect("/manager-login", { error: "Only manager accounts can sign in from the manager login page." });
  }

  if (loginScope === "sales" && resolvedUser?.role !== "SALES_AGENT") {
    return createPublicRedirect("/sales/login", { error: "Only approved sales accounts can sign in here." });
  }

  try {
    const user = await authenticatePassword(identifier, password);
    if (!user) {
      return createPublicRedirect(loginPath, { error: "Password login failed. Check your credentials and try again." });
    }
    if (loginScope === "sales") {
      const access = await getSalesAgentAccess(user.id);
      if (!access.ok) {
        return createPublicRedirect("/sales/login", {
          error:
            access.reason === "PENDING"
              ? "Your sales account is waiting for super-admin approval."
              : access.reason === "SUSPENDED"
                ? "Your sales account is suspended. Contact Gigxomi support."
                : "Your sales profile was not found. Request sales access again or contact super-admin.",
        });
      }
    }

    const freelancerOnboardingRequired = user.role === "FREELANCER" && isFreelancerOnboardingEnabled()
      ? !(await ensureFreelancerOnboarding({
          userId: user.id,
          role: user.role,
          displayName: user.displayName,
          email: user.email,
          phone: user.phone,
        })).completed
      : false;
    const destination = freelancerOnboardingRequired
      ? "/freelancer/onboarding"
      : loginScope === "super-admin"
        ? redirectTo.trim()
          ? getSafeRedirectPath(redirectTo, user.role)
          : SUPER_ADMIN_HOME_ROUTE
        : loginScope === "manager"
          ? redirectTo.trim()
            ? getSafeRedirectPath(redirectTo, user.role)
            : "/manager/chat"
        : loginScope === "sales"
          ? redirectTo.trim()
            ? getSafeRedirectPath(redirectTo, user.role)
            : "/sales"
        : redirectTo.trim()
          ? getSafeRedirectPath(redirectTo, user.role)
          : getDashboardPathForIdentity({
              role: user.role,
              packageAudience: user.packageAudience,
              workspaceMode: user.workspaceMode,
            });
    const response = createPublicRedirect(destination || getDefaultDashboardPath(user.role));

    await applySessionCookie(response, {
      userId: user.id,
      role: user.role,
      assignedRole: user.assignedRole,
      tenantId: user.tenantId,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      packageId: user.packageId,
      packageName: user.packageName,
      packageAudience: user.packageAudience,
      packageStatus: user.packageStatus,
      packageExpiresAt: user.packageExpiresAt,
      workspaceMode: user.workspaceMode,
    });

    return response;
  } catch (error) {
    console.error("Password login failed", error);
    return createPublicRedirect(loginPath, {
      error: sanitizePublicAuthError(error, "We could not sign you in right now. Please try again in a moment."),
    });
  }
}
