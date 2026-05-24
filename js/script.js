const SUPABASE_URL = "https://bhfbrohojrcdjtbfklvr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_d7XoVH-u-Pr9N4SofYsbJg_pu26g3G7";
const USERS_TABLE = "users";
const ENQUIRY_STORAGE_KEY = "vinayak-academy-enquiries";
const DASHBOARD_STORAGE_KEY = "vinayak-academy-dashboard";

const DEFAULT_DASHBOARD_DATA = {
  courses: [
    { id: "course-1", title: "RS-CIT", duration: "3 Months", fees: 6500 },
    { id: "course-2", title: "Tally with GST", duration: "4 Months", fees: 12000 },
    { id: "course-3", title: "Digital Marketing", duration: "3 Months", fees: 15000 },
  ],
  students: [
    { id: "student-1", name: "Ankit Sharma", email: "ankit@example.com", mobile: "+91 98765 43210", courseId: "course-1", fees: 6500 },
    { id: "student-2", name: "Riya Verma", email: "riya@example.com", mobile: "+91 99887 66554", courseId: "course-2", fees: 12000 },
  ],
};

const DEFAULT_STUDENT_PROGRESS = [
  { subject: "Computer Basics", marks: 84, grade: "A" },
  { subject: "Internet Skills", marks: 89, grade: "A" },
  { subject: "MS Office", marks: 86, grade: "A" },
];

const supabase = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function $(id) {
  return document.getElementById(id);
}

function getPage() {
  return document.body.dataset.page || "";
}

function isLoginPage() {
  return getPage() === "login";
}

function isAdminDashboard() {
  return getPage() === "admin-dashboard";
}

function isStudentDashboard() {
  return getPage() === "student-dashboard";
}

function isProtectedPage() {
  return isAdminDashboard() || isStudentDashboard();
}

function isSupabaseReady() {
  return Boolean(supabase && SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== "REPLACE_WITH_ANON_PUBLIC_KEY");
}

function setMessage(targetId, message, type = "info") {
  const element = $(targetId);
  if (!element) {
    return;
  }

  const isInline = element.classList.contains("form-message-inline");
  element.textContent = message || "";
  element.className = `form-message ${message ? `form-message-${type}` : ""}`;
  if (isInline) {
    element.classList.add("form-message-inline");
  }
}

function getInitials(name) {
  return String(name || "VA")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function formatCurrency(value) {
  return `INR ${Number(value || 0).toLocaleString("en-IN")}`;
}

function setText(id, value) {
  const element = $(id);
  if (element) {
    element.textContent = value;
  }
}

function getDashboardStore() {
  try {
    const stored = JSON.parse(localStorage.getItem(DASHBOARD_STORAGE_KEY) || "null");
    if (stored && Array.isArray(stored.courses) && Array.isArray(stored.students)) {
      return stored;
    }
  } catch (error) {
    console.error("Unable to read dashboard store", error);
  }

  return JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_DATA));
}

function saveDashboardStore(store) {
  localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(store));
}

function getEnquiries() {
  try {
    return JSON.parse(localStorage.getItem(ENQUIRY_STORAGE_KEY) || "[]");
  } catch (error) {
    console.error("Unable to read enquiries", error);
    return [];
  }
}

function saveEnquiry(entry) {
  const enquiries = getEnquiries();
  enquiries.unshift({
    id: window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now()),
    ...entry,
  });
  localStorage.setItem(ENQUIRY_STORAGE_KEY, JSON.stringify(enquiries));
}

function getCourseNameById(store, courseId) {
  return store.courses.find((course) => course.id === courseId)?.title || "-";
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message || "Unable to load profile.");
  }

  return data || null;
}

async function upsertProfile(profile) {
  const { error } = await supabase
    .from(USERS_TABLE)
    .upsert([profile], { onConflict: "id" });

  if (error) {
    throw new Error(error.message || "Unable to save profile.");
  }
}

async function getSessionUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message || "Unable to load session.");
  }

  return data.session?.user || null;
}

async function getCurrentUserContext() {
  const authUser = await getSessionUser();
  if (!authUser) {
    return null;
  }

  const profile = await fetchProfile(authUser.id);
  const resolvedProfile = {
    id: authUser.id,
    name: profile?.name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
    email: profile?.email || authUser.email || "",
    mobile: profile?.mobile || authUser.user_metadata?.mobile || "",
    role: profile?.role || authUser.user_metadata?.role || "student",
    course_title: profile?.course_title || authUser.user_metadata?.course_title || "RS-CIT",
    fees_status: profile?.fees_status || authUser.user_metadata?.fees_status || "Pending",
    total_fees: profile?.total_fees || authUser.user_metadata?.total_fees || 6500,
    fees_paid: profile?.fees_paid || authUser.user_metadata?.fees_paid || 3000,
  };

  return { authUser, profile: resolvedProfile };
}

function resolveDashboard(role) {
  return role === "admin" ? "admin-dashboard.html" : "student-dashboard.html";
}

async function loginUser(email, password, expectedRole) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message || "Unable to login.");
  }

  const profile = await fetchProfile(data.user.id);
  const actualRole = profile?.role || data.user.user_metadata?.role || "student";

  if (expectedRole === "admin" && actualRole !== "admin") {
    await supabase.auth.signOut();
    throw new Error("This account is not authorized for admin access.");
  }

  window.location.href = resolveDashboard(actualRole);
}

async function signupStudent(payload) {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        name: payload.name,
        mobile: payload.mobile,
        role: "student",
        course_title: payload.courseTitle,
        fees_status: "Pending",
      },
    },
  });

  if (error) {
    throw new Error(error.message || "Unable to create account.");
  }

  if (!data.user) {
    throw new Error("Signup completed but no user was returned.");
  }

  await upsertProfile({
    id: data.user.id,
    name: payload.name,
    email: payload.email,
    mobile: payload.mobile,
    role: "student",
  });
}

async function logoutUser() {
  await supabase.auth.signOut();
  window.location.href = "login.html";
}

async function sendPasswordReset() {
  const email = $("loginIdentifier")?.value.trim();
  if (!email) {
    throw new Error("Enter your email first to receive a reset link.");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, "")}login.html`,
  });

  if (error) {
    throw new Error(error.message || "Unable to send reset email.");
  }
}

function setupMobileMenu() {
  const menuBtn = $("menuBtn");
  const mobileMenu = $("mobileMenu");

  if (!menuBtn || !mobileMenu) {
    return;
  }

  menuBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    mobileMenu.setAttribute("aria-hidden", String(!isOpen));
  });

  mobileMenu.querySelectorAll("a, button").forEach((item) => {
    item.addEventListener("click", () => {
      mobileMenu.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
    });
  });
}

function setupRevealAnimations() {
  const elements = document.querySelectorAll(".section-reveal");
  if (!elements.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach((element) => observer.observe(element));
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") {
        return;
      }

      const target = document.querySelector(href);
      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function setupEnquiryModal() {
  const modal = $("enquiryModal");
  const closeBtn = $("closeModalBtn");
  if (!modal) {
    return;
  }

  ["openModalBtn", "openModalBtnMobile", "heroEnquireBtn"].forEach((id) => {
    $(id)?.addEventListener("click", () => {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
    });
  });

  closeBtn?.addEventListener("click", () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }
  });
}

function setupEnquiryForm() {
  const form = $("enquiryForm");
  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      course: String(formData.get("course") || "").trim(),
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.course) {
      setMessage("enquiryMessage", "Please complete every field.", "error");
      return;
    }

    saveEnquiry(payload);
    form.reset();
    setMessage("enquiryMessage", "Enquiry submitted successfully.", "success");
  });
}

function setAuthRole(role) {
  document.querySelectorAll("[data-role-target]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.roleTarget === role);
  });

  const roleBadge = $("authRoleBadge");
  const roleMessage = $("authRoleMessage");
  const adminPrompt = $("adminPrompt");
  const registerView = $("registerView");
  const registerTab = document.querySelector('[data-mode-target="register"]');
  const loginSubmit = $("loginSubmitText");

  if (roleBadge) {
    roleBadge.textContent = role === "admin" ? "Admin Portal" : "Student Portal";
  }

  if (roleMessage) {
    roleMessage.textContent = role === "admin"
      ? "Admin users can manage operations, local dashboard data, and portal flows."
      : "Access your classes, profile, and progress in one polished workspace.";
  }

  if (adminPrompt) {
    adminPrompt.classList.toggle("is-hidden", role !== "admin");
  }

  if (loginSubmit) {
    loginSubmit.textContent = role === "admin" ? "Login as Admin" : "Login as Student";
  }

  if (registerTab) {
    registerTab.disabled = role === "admin";
    registerTab.classList.toggle("is-disabled", role === "admin");
  }

  if (role === "admin" && registerView?.classList.contains("is-active")) {
    setAuthMode("login");
  }

  document.body.dataset.authRole = role;
}

function setAuthMode(mode) {
  document.querySelectorAll("[data-mode-target]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.modeTarget === mode);
  });

  $("loginView")?.classList.toggle("is-active", mode === "login");
  $("registerView")?.classList.toggle("is-active", mode === "register");
  setMessage("authMessage", "");
}

function setupAuthUi() {
  document.querySelectorAll("[data-role-target]").forEach((button) => {
    button.addEventListener("click", () => setAuthRole(button.dataset.roleTarget));
  });

  document.querySelectorAll("[data-mode-target]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }
      setAuthMode(button.dataset.modeTarget);
    });
  });

  setAuthRole("student");
  setAuthMode("login");
}

async function setupAuthForms() {
  const loginForm = $("loginAuthForm");
  const registerForm = $("registerAuthForm");

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("authMessage", "");

    const role = document.body.dataset.authRole || "student";
    const email = $("loginIdentifier")?.value.trim() || "";
    const password = $("loginPassword")?.value || "";

    if (!email || !password) {
      setMessage("authMessage", "Enter both email and password.", "error");
      return;
    }

    const button = $("loginSubmitText");
    const originalText = button?.textContent || "Login";

    try {
      if (!isSupabaseReady()) {
        throw new Error("Supabase is not configured. Replace the anon public key before deploying.");
      }

      if (button) {
        button.disabled = true;
        button.textContent = "Signing in...";
      }

      await loginUser(email, password, role);
    } catch (error) {
      setMessage("authMessage", error.message || "Unable to login.", "error");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  });

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("authMessage", "");

    const payload = {
      name: $("registerName")?.value.trim() || "",
      email: $("registerEmail")?.value.trim() || "",
      mobile: $("registerMobile")?.value.trim() || "",
      courseTitle: $("registerCourse")?.value.trim() || "",
      password: $("registerPassword")?.value || "",
      confirmPassword: $("registerConfirmPassword")?.value || "",
    };

    if (payload.password !== payload.confirmPassword) {
      setMessage("authMessage", "Passwords do not match.", "error");
      return;
    }

    if (!payload.name || !payload.email || !payload.mobile || !payload.courseTitle || !payload.password) {
      setMessage("authMessage", "Please complete every signup field.", "error");
      return;
    }

    const button = $("registerSubmitButton");
    const originalText = button?.textContent || "Create Student Account";

    try {
      if (!isSupabaseReady()) {
        throw new Error("Supabase is not configured. Replace the anon public key before deploying.");
      }

      if (button) {
        button.disabled = true;
        button.textContent = "Creating account...";
      }

      await signupStudent(payload);
      setMessage("authMessage", "Account created successfully. You can now login.", "success");
      registerForm.reset();
      setAuthMode("login");
      if ($("loginIdentifier")) {
        $("loginIdentifier").value = payload.email;
      }
    } catch (error) {
      setMessage("authMessage", error.message || "Unable to create account.", "error");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  });

  $("forgotPasswordBtn")?.addEventListener("click", async () => {
    try {
      if (!isSupabaseReady()) {
        throw new Error("Supabase is not configured. Replace the anon public key before deploying.");
      }

      await sendPasswordReset();
      setMessage("authMessage", "Password reset email sent. Please check your inbox.", "success");
    } catch (error) {
      setMessage("authMessage", error.message || "Unable to send reset email.", "error");
    }
  });
}

async function redirectLoggedInUser() {
  if (!isLoginPage() || !isSupabaseReady()) {
    return;
  }

  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return;
    }

    const profile = await fetchProfile(sessionUser.id);
    const role = profile?.role || sessionUser.user_metadata?.role || "student";
    window.location.href = resolveDashboard(role);
  } catch (error) {
    setMessage("authMessage", error.message || "Unable to check session.", "error");
  }
}

function setupDashboardNav() {
  const overlay = $("dashboardOverlay");
  const sidebar = $("dashboardSidebar");

  $("dashboardSidebarToggle")?.addEventListener("click", () => {
    sidebar?.classList.toggle("is-open");
    overlay?.classList.toggle("is-open");
  });

  overlay?.addEventListener("click", () => {
    sidebar?.classList.remove("is-open");
    overlay?.classList.remove("is-open");
  });

  document.querySelectorAll("[data-dashboard-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.dashboardTarget;

      document.querySelectorAll("[data-dashboard-target]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });

      document.querySelectorAll(".dashboard-section").forEach((section) => {
        section.classList.toggle("is-active", section.id === targetId);
      });

      sidebar?.classList.remove("is-open");
      overlay?.classList.remove("is-open");
    });
  });

  $("dashboardLogoutBtn")?.addEventListener("click", async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error(error);
    }
  });
}

function renderAdminCourses(store) {
  const body = $("coursesTableBody");
  if (!body) {
    return;
  }

  body.innerHTML = store.courses.map((course) => `
    <tr>
      <td>${course.title}</td>
      <td>${course.duration}</td>
      <td>${formatCurrency(course.fees)}</td>
    </tr>
  `).join("");

  setText("adminCourseCount", String(store.courses.length));
}

function renderAdminStudents(store) {
  const body = $("studentsTableBody");
  const select = $("studentCourse");

  if (select) {
    select.innerHTML = store.courses.map((course) => `<option value="${course.id}">${course.title}</option>`).join("");
  }

  if (!body) {
    return;
  }

  body.innerHTML = store.students.map((student) => `
    <tr>
      <td>${student.name}</td>
      <td>${student.email}</td>
      <td>${student.mobile}</td>
      <td>${getCourseNameById(store, student.courseId)}</td>
    </tr>
  `).join("");

  setText("adminStudentCount", String(store.students.length));
}

function renderAdminEnquiries() {
  const body = $("enquiriesTableBody");
  if (!body) {
    return;
  }

  const enquiries = getEnquiries();
  body.innerHTML = enquiries.length
    ? enquiries.map((enquiry) => `
      <tr>
        <td>${enquiry.name}</td>
        <td>${enquiry.email}</td>
        <td>${enquiry.phone}</td>
        <td>${enquiry.course}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4">No enquiries captured yet.</td></tr>`;

  setText("adminEnquiryCount", String(enquiries.length));
}

function setupAdminForms(profile) {
  const store = getDashboardStore();
  renderAdminCourses(store);
  renderAdminStudents(store);
  renderAdminEnquiries();

  setText("dashboardStudentName", profile.name || "Admin User");
  setText("dashboardStudentRole", "Administrator");
  setText("adminAvatar", getInitials(profile.name || "Admin User"));

  $("saveCourseBtn")?.addEventListener("click", () => {
    const title = $("courseName")?.value.trim() || "";
    const duration = $("courseDuration")?.value.trim() || "";
    const fees = Number($("courseFees")?.value || 0);

    if (!title || !duration || !fees) {
      window.alert("Please complete all course fields.");
      return;
    }

    store.courses.unshift({
      id: window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now()),
      title,
      duration,
      fees,
    });

    saveDashboardStore(store);
    $("courseForm")?.reset();
    renderAdminCourses(store);
    renderAdminStudents(store);
  });

  $("saveStudentBtn")?.addEventListener("click", () => {
    const name = $("studentName")?.value.trim() || "";
    const email = $("studentEmail")?.value.trim() || "";
    const mobile = $("studentMobile")?.value.trim() || "";
    const courseId = $("studentCourse")?.value || "";
    const fees = Number($("studentFees")?.value || 0);

    if (!name || !email || !mobile || !courseId || !fees) {
      window.alert("Please complete all student fields.");
      return;
    }

    store.students.unshift({
      id: window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now()),
      name,
      email,
      mobile,
      courseId,
      fees,
    });

    saveDashboardStore(store);
    $("studentForm")?.reset();
    renderAdminStudents(store);
  });
}

function renderStudentDashboard(profile) {
  const totalFees = profile.total_fees || 6500;
  const feesPaid = profile.fees_paid || 3000;
  const feesPending = Math.max(totalFees - feesPaid, 0);
  const progressAverage = Math.round(DEFAULT_STUDENT_PROGRESS.reduce((sum, item) => sum + item.marks, 0) / DEFAULT_STUDENT_PROGRESS.length);

  setText("dashboardHeading", `Welcome back, ${profile.name || "Student"}`);
  setText("dashboardStudentName", profile.name || "Student");
  setText("dashboardStudentRole", `${profile.course_title || "RS-CIT"} Student`);
  setText("studentAvatar", getInitials(profile.name || "Student"));

  setText("studentCourseTitle", profile.course_title || "RS-CIT");
  setText("studentCourseSubtitle", "Your current learning path");
  setText("studentAttendancePercentValue", "88%");
  setText("studentAverageMarksValue", String(progressAverage));
  setText("studentFeesStatusValue", profile.fees_status || (feesPending > 0 ? "Pending" : "Paid"));
  setText("studentFeesPendingValue", `${formatCurrency(feesPending)} pending`);

  setText("profileStudentName", profile.name || "Student");
  setText("profileStudentEmail", profile.email || "-");
  setText("profileStudentMobile", profile.mobile || "-");
  setText("profileStudentCourse", profile.course_title || "RS-CIT");
  setText("profileStudentFees", profile.fees_status || "Pending");
  setText("studentFeesTotalValue", formatCurrency(totalFees));
  setText("studentFeesPaidValue", formatCurrency(feesPaid));
  setText("studentFeesPendingDetailValue", formatCurrency(feesPending));

  const resultsBody = $("studentResultsTableBody");
  if (resultsBody) {
    resultsBody.innerHTML = DEFAULT_STUDENT_PROGRESS.map((item) => `
      <tr>
        <td>${item.subject}</td>
        <td>${item.marks}</td>
        <td>${item.grade}</td>
      </tr>
    `).join("");
  }
}

async function protectCurrentPage() {
  if (!isProtectedPage()) {
    return;
  }

  if (!isSupabaseReady()) {
    window.location.href = "login.html";
    return;
  }

  try {
    const context = await getCurrentUserContext();
    if (!context) {
      window.location.href = "login.html";
      return;
    }

    const role = context.profile.role || "student";

    if (isAdminDashboard() && role !== "admin") {
      window.location.href = resolveDashboard(role);
      return;
    }

    if (isStudentDashboard() && role !== "student") {
      window.location.href = resolveDashboard(role);
      return;
    }

    setupDashboardNav();

    if (isAdminDashboard()) {
      setupAdminForms(context.profile);
    } else {
      renderStudentDashboard(context.profile);
    }
  } catch (error) {
    console.error(error);
    window.location.href = "login.html";
  }
}

function setupAuthStateListener() {
  if (!isSupabaseReady()) {
    return;
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" && isProtectedPage()) {
      window.location.href = "login.html";
      return;
    }

    if (event === "SIGNED_IN" && isLoginPage() && session?.user) {
      window.setTimeout(() => {
        redirectLoggedInUser();
      }, 0);
    }
  });
}

window.addEventListener("load", async () => {
  setupMobileMenu();
  setupSmoothScroll();
  setupRevealAnimations();
  setupEnquiryModal();
  setupEnquiryForm();
  setupAuthStateListener();

  if (isLoginPage()) {
    setupAuthUi();
    await setupAuthForms();
    await redirectLoggedInUser();
    return;
  }

  await protectCurrentPage();
});
