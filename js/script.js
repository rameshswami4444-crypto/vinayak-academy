const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const modal = document.getElementById("enquiryModal");
const modalPanel = document.getElementById("modalPanel");
const closeModalBtn = document.getElementById("closeModalBtn");
const enquiryForm = document.getElementById("enquiryForm");
const heroContent = document.getElementById("heroContent");
const revealElements = document.querySelectorAll(".section-reveal");
const heroSlides = document.querySelectorAll(".hero-slide");
const authShell = document.getElementById("authShell");
const authToggleButtons = document.querySelectorAll("[data-auth-target]");
const loginAuthForm = document.getElementById("loginAuthForm");
const authSliderTitle = document.getElementById("authSliderTitle");
const authSliderText = document.getElementById("authSliderText");
const authSliderButton = document.getElementById("authSliderButton");
const authRoleButtons = document.querySelectorAll("[data-role-target]");
const authModeButtons = document.querySelectorAll("[data-mode-target]");
const loginView = document.getElementById("loginView");
const registerView = document.getElementById("registerView");
const authRoleBadge = document.getElementById("authRoleBadge");
const authRoleMessage = document.getElementById("authRoleMessage");
const loginSubmitText = document.getElementById("loginSubmitText");
const adminAccessField = document.getElementById("adminAccessField");
const adminAccessCode = document.getElementById("adminAccessCode");
const registerPrompt = document.getElementById("registerPrompt");
const adminPrompt = document.getElementById("adminPrompt");
const registerAuthForm = document.getElementById("registerAuthForm");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const otpWrap = document.getElementById("otpWrap");
const otpActions = document.getElementById("otpActions");
const otpStatus = document.getElementById("otpStatus");
const registerOtp = document.getElementById("registerOtp");
const registerMobile = document.getElementById("registerMobile");
const enquirySubmitButton = enquiryForm?.querySelector('button[type="submit"]');
const loginSubmitButton = loginAuthForm?.querySelector('button[type="submit"]');
const registerSubmitButton = registerAuthForm?.querySelector('button[type="submit"]');
const dashboardShell = document.getElementById("dashboardShell");
const dashboardSidebarToggle = document.getElementById("dashboardSidebarToggle");
const dashboardOverlay = document.getElementById("dashboardOverlay");
const dashboardMenuButtons = document.querySelectorAll("[data-dashboard-target]");
const dashboardSections = document.querySelectorAll(".dashboard-section");
const dashboardLogoutBtn = document.getElementById("dashboardLogoutBtn");
const dashboardStudentName = document.getElementById("dashboardStudentName");
const dashboardStudentRole = document.getElementById("dashboardStudentRole");
const profileStudentName = document.getElementById("profileStudentName");
const profileStudentMobile = document.getElementById("profileStudentMobile");
const profileStudentEmail = document.getElementById("profileStudentEmail");
const profileStudentCourse = document.getElementById("profileStudentCourse");
const profileStudentFees = document.getElementById("profileStudentFees");
const dashboardProfileTrigger = document.getElementById("dashboardProfileTrigger");
const dashboardProfileMenu = document.getElementById("dashboardProfileMenu");
const dashboardProfileLogout = document.getElementById("dashboardProfileLogout");
const adminModalOpenButtons = document.querySelectorAll("[data-admin-modal-open]");
const adminModalCloseButtons = document.querySelectorAll("[data-admin-modal-close]");
const adminConfirmButtons = document.querySelectorAll("[data-admin-confirm]");
const slideshowDelay = 4000;
let currentSlideIndex = 0;
let currentAuthRole = "student";
let isOtpVerified = false;
let attendanceChartInstance;
let marksChartInstance;
let adminStudents = [];
let adminCourses = [];
let adminAttendance = [];
let adminMarks = [];
let adminFees = [];
let adminEnquiries = [];

function isAdminDashboardPage() {
  return window.location.pathname.endsWith("admin-dashboard.html");
}

function isStudentDashboardPage() {
  return window.location.pathname.endsWith("student-dashboard.html");
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function getAuthToken() {
  return localStorage.getItem("authToken");
}

async function apiRequest(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function formatCurrency(amount) {
  const numericAmount = Number(amount || 0);
  return `INR ${numericAmount.toLocaleString("en-IN")}`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toISOString().split("T")[0];
}

function calculateGrade(score) {
  const marks = Number(score);

  if (marks >= 90) {
    return "A+";
  }
  if (marks >= 80) {
    return "A";
  }
  if (marks >= 70) {
    return "B+";
  }
  if (marks >= 60) {
    return "B";
  }
  if (marks >= 50) {
    return "C";
  }

  return "D";
}

function getGradeClass(grade) {
  if (String(grade).startsWith("A")) {
    return "a-grade";
  }

  if (String(grade).startsWith("B")) {
    return "b-grade";
  }

  return "pending";
}

function updateTextContent(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function buildMonthlyLabels(items, dateSelector) {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
  });
  const buckets = new Map();

  items.forEach((item) => {
    const rawDate = dateSelector(item);
    const date = rawDate ? new Date(rawDate) : null;

    if (!date || Number.isNaN(date.getTime())) {
      return;
    }

    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        label: formatter.format(date),
        items: [],
      });
    }

    buckets.get(key).items.push(item);
  });

  return Array.from(buckets.values()).slice(-6);
}

function renderStudentOptions() {
  const studentSelectIds = ["attendanceStudent", "marksStudent", "feesStudent"];

  studentSelectIds.forEach((selectId) => {
    const select = document.getElementById(selectId);

    if (!select) {
      return;
    }

    if (!adminStudents.length) {
      select.innerHTML = "<option value=\"\">No students available</option>";
      return;
    }

    select.innerHTML = adminStudents
      .map((student) => `<option value="${student._id}">${student.name}</option>`)
      .join("");
  });
}

function renderCourseOptions() {
  const courseSelect = document.getElementById("studentCourse");

  if (!courseSelect) {
    return;
  }

  if (!adminCourses.length) {
    courseSelect.innerHTML = "<option value=\"\">No courses available</option>";
    return;
  }

  courseSelect.innerHTML = adminCourses
    .map((course) => `<option value="${course._id}">${course.title}</option>`)
    .join("");
}

function renderStudentsTable() {
  const tableBody = document.getElementById("studentsTableBody");
  const syncStatus = document.getElementById("studentsSyncStatus");

  if (!tableBody) {
    return;
  }

  if (syncStatus) {
    syncStatus.textContent = `${adminStudents.length} records synced`;
  }

  if (!adminStudents.length) {
    tableBody.innerHTML = "<tr><td colspan=\"5\">No students found.</td></tr>";
    return;
  }

  tableBody.innerHTML = adminStudents
    .map((student) => `
      <tr>
        <td>${student.name}</td>
        <td>${student.course?.title || "-"}</td>
        <td>${student.phone || "-"}</td>
        <td><span class="dashboard-status present">Active</span></td>
        <td>
          <div class="dashboard-table-actions">
            <button class="dashboard-mini-button" type="button">View</button>
            <button class="dashboard-mini-button warning" type="button">Active</button>
            <button class="dashboard-mini-button danger" type="button" data-delete-student="${student._id}">Delete</button>
          </div>
        </td>
      </tr>
    `)
    .join("");
}

function renderCoursesTable() {
  const tableBody = document.getElementById("coursesTableBody");

  if (!tableBody) {
    return;
  }

  if (!adminCourses.length) {
    tableBody.innerHTML = "<tr><td colspan=\"4\">No courses found.</td></tr>";
    return;
  }

  tableBody.innerHTML = adminCourses
    .map((course) => `
      <tr>
        <td>${course.title}</td>
        <td>${course.duration}</td>
        <td>${formatCurrency(course.fees)}</td>
        <td>
          <div class="dashboard-table-actions">
            <button class="dashboard-mini-button" type="button">Live</button>
            <button class="dashboard-mini-button" type="button">Catalog</button>
          </div>
        </td>
      </tr>
    `)
    .join("");
}

function renderAttendanceTable() {
  const tableBody = document.getElementById("attendanceTableBody");

  if (!tableBody) {
    return;
  }

  if (!adminAttendance.length) {
    tableBody.innerHTML = "<tr><td colspan=\"4\">No attendance records found.</td></tr>";
    return;
  }

  tableBody.innerHTML = adminAttendance
    .map((record) => `
      <tr>
        <td>${record.studentId?.name || "-"}</td>
        <td>${formatDate(record.date)}</td>
        <td><span class="dashboard-status ${record.status === "present" ? "present" : "absent"}">${record.status}</span></td>
        <td><button class="dashboard-mini-button" type="button">Saved</button></td>
      </tr>
    `)
    .join("");
}

function renderMarksTable() {
  const tableBody = document.getElementById("marksTableBody");

  if (!tableBody) {
    return;
  }

  if (!adminMarks.length) {
    tableBody.innerHTML = "<tr><td colspan=\"4\">No marks records found.</td></tr>";
    return;
  }

  tableBody.innerHTML = adminMarks
    .map((record) => {
      const grade = calculateGrade(record.marks);

      return `
        <tr>
          <td>${record.studentId?.name || "-"}</td>
          <td>${record.subject}</td>
          <td>${record.marks}</td>
          <td><span class="dashboard-status ${getGradeClass(grade)}">${grade}</span></td>
        </tr>
      `;
    })
    .join("");
}

function renderFeesTable() {
  const tableBody = document.getElementById("feesTableBody");
  const collectedValue = document.getElementById("feesCollectedValue");
  const pendingValue = document.getElementById("feesPendingValue");
  const receiptsValue = document.getElementById("feesReceiptsValue");

  if (tableBody) {
    if (!adminFees.length) {
      tableBody.innerHTML = "<tr><td colspan=\"3\">No fees records found.</td></tr>";
    } else {
      tableBody.innerHTML = adminFees
        .map((record) => `
          <tr>
            <td>${record.studentId?.name || "-"}</td>
            <td>${formatCurrency(record.amount)}</td>
            <td><span class="dashboard-status ${record.status === "paid" ? "present" : "pending"}">${record.status}</span></td>
          </tr>
        `)
        .join("");
    }
  }

  const totals = adminFees.reduce(
    (summary, record) => {
      const amount = Number(record.amount || 0);

      if (record.status === "paid") {
        summary.paid += amount;
      } else {
        summary.pending += amount;
      }

      summary.count += 1;
      return summary;
    },
    { paid: 0, pending: 0, count: 0 }
  );

  if (collectedValue) {
    collectedValue.textContent = formatCurrency(totals.paid);
  }

  if (pendingValue) {
    pendingValue.textContent = formatCurrency(totals.pending);
  }

  if (receiptsValue) {
    receiptsValue.textContent = String(totals.count);
  }
}

function renderEnquiriesTable() {
  const tableBody = document.getElementById("enquiriesTableBody");

  if (!tableBody) {
    return;
  }

  if (!adminEnquiries.length) {
    tableBody.innerHTML = "<tr><td colspan=\"4\">No enquiries found.</td></tr>";
    return;
  }

  tableBody.innerHTML = adminEnquiries
    .map((enquiry) => `
      <tr>
        <td>${enquiry.name}</td>
        <td>${enquiry.phone}</td>
        <td>${enquiry.course}</td>
        <td><button class="dashboard-mini-button" type="button">Reviewed</button></td>
      </tr>
    `)
    .join("");
}

function closeModalById(modalId) {
  const modal = document.getElementById(modalId);

  if (modal) {
    closeAdminModal(modal);
  }
}

async function loadAdminData() {
  if (!isAdminDashboardPage()) {
    return;
  }

  const storedUser = localStorage.getItem("authUser");
  const token = getAuthToken();

  if (!token || !storedUser) {
    window.location.href = "login.html";
    return;
  }

  try {
    const user = JSON.parse(storedUser);

    if (user.role !== "admin") {
      window.location.href = "login.html";
      return;
    }
  } catch (error) {
    window.location.href = "login.html";
    return;
  }

  try {
    const [students, courses, attendance, marks, fees, enquiries] = await Promise.all([
      apiRequest("/api/students"),
      apiRequest("/api/courses"),
      apiRequest("/api/attendance"),
      apiRequest("/api/marks"),
      apiRequest("/api/fees"),
      apiRequest("/api/enquiry"),
    ]);

    adminStudents = students;
    adminCourses = courses;
    adminAttendance = attendance;
    adminMarks = marks;
    adminFees = fees;
    adminEnquiries = enquiries;

    renderCourseOptions();
    renderStudentOptions();
    renderStudentsTable();
    renderCoursesTable();
    renderAttendanceTable();
    renderMarksTable();
    renderFeesTable();
    renderEnquiriesTable();
  } catch (error) {
    window.alert(error.message || "Unable to load admin dashboard data.");
  }
}

function toggleMobileMenu() {
  if (!mobileMenu || !menuBtn) {
    return;
  }

  const isOpen = mobileMenu.classList.toggle("is-open");
  menuBtn.setAttribute("aria-expanded", String(isOpen));
  mobileMenu.setAttribute("aria-hidden", String(!isOpen));
}

function closeMobileMenu() {
  if (!mobileMenu || !menuBtn) {
    return;
  }

  mobileMenu.classList.remove("is-open");
  menuBtn.setAttribute("aria-expanded", "false");
  mobileMenu.setAttribute("aria-hidden", "true");
}

function openModal() {
  if (!modal) {
    return;
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  if (!modal) {
    return;
  }

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function showSlide(index) {
  heroSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === index);
  });
}

function startSlideshow() {
  if (heroSlides.length < 2) {
    return;
  }

  setInterval(() => {
    currentSlideIndex = (currentSlideIndex + 1) % heroSlides.length;
    showSlide(currentSlideIndex);
  }, slideshowDelay);
}

function setupRevealAnimation() {
  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function setAuthMode(mode) {
  if (loginView && registerView) {
    const isRegisterMode = mode === "register";
    loginView.classList.toggle("is-active", !isRegisterMode);
    registerView.classList.toggle("is-active", isRegisterMode);
  } else if (authShell) {
    const isSignupMode = mode === "signup";
    authShell.classList.toggle("is-signup-mode", isSignupMode);

    if (authSliderTitle && authSliderText && authSliderButton) {
      authSliderTitle.textContent = isSignupMode
        ? "Already with us? Step back into your dashboard."
        : "New here? Build your profile in minutes.";
      authSliderText.textContent = isSignupMode
        ? "Switch back to login and continue where you left off with your courses and account activity."
        : "Switch between login and signup with a smooth, app-like experience designed to feel polished on every screen.";
      authSliderButton.textContent = isSignupMode ? "Back to Login" : "Create Account";
      authSliderButton.dataset.authTarget = isSignupMode ? "login" : "signup";
    }

    authToggleButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.authTarget === mode));
    });
  }

  authModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.modeTarget === mode);
    button.setAttribute("aria-pressed", String(button.dataset.modeTarget === mode));
  });
}

function setupAuthToggle() {
  if (authModeButtons.length) {
    authModeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setAuthMode(button.dataset.modeTarget);
      });
    });

    setAuthMode("login");
  }

  if (!authShell || !authToggleButtons.length) {
    return;
  }

  authToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setAuthMode(button.dataset.authTarget);
    });
  });
}

function setAuthRole(role) {
  currentAuthRole = role;

  authRoleButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.roleTarget === role);
    button.setAttribute("aria-pressed", String(button.dataset.roleTarget === role));
  });

  if (authRoleBadge) {
    authRoleBadge.textContent = role === "admin" ? "Admin Portal" : "Student Portal";
  }

  if (authRoleMessage) {
    authRoleMessage.textContent = role === "admin"
      ? "Sign in with your admin credentials to manage students, courses, and operations."
      : "Access student courses, notes, and progress from one secure place.";
  }

  if (loginSubmitText) {
    loginSubmitText.textContent = role === "admin" ? "Login as Admin" : "Login as Student";
  }

  if (adminAccessField && adminAccessCode) {
    const showAdminField = role === "admin";
    adminAccessField.classList.toggle("auth-v2-hidden", !showAdminField);
    adminAccessCode.toggleAttribute("required", showAdminField);
  }

  registerPrompt?.classList.toggle("auth-v2-hidden", role === "admin");
  adminPrompt?.classList.toggle("auth-v2-hidden", role !== "admin");

  if (role === "admin") {
    setAuthMode("login");
  }
}

function setupAuthRoleSwitch() {
  if (!authRoleButtons.length) {
    return;
  }

  authRoleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setAuthRole(button.dataset.roleTarget);
    });
  });

  setAuthRole("student");
}

function setupAuthForms() {
  loginAuthForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const identifierInput = document.getElementById("loginIdentifier");
    const passwordInput = document.getElementById("loginPassword");
    const accessCodeInput = document.getElementById("adminAccessCode");
    const originalButtonText = loginSubmitButton?.textContent;

    const payload = {
      identifier: identifierInput?.value.trim() || "",
      password: passwordInput?.value || "",
      role: currentAuthRole,
      accessCode: accessCodeInput?.value.trim() || "",
    };

    if (!payload.identifier || !payload.password) {
      window.alert("Please enter your login credentials.");
      return;
    }

    if (loginSubmitButton) {
      loginSubmitButton.disabled = true;
      loginSubmitButton.textContent = "Logging in...";
    }

    postJson("/api/auth/login", payload)
      .then((data) => {
        localStorage.setItem("authToken", data.token);
        const authUser = data.user || {
          email: payload.identifier,
          role: currentAuthRole,
        };
        localStorage.setItem("authUser", JSON.stringify(authUser));
        const successMessage = data.message || "Login successful.";
        loginAuthForm.reset();
        if (adminAccessField) {
          adminAccessField.classList.toggle("auth-v2-hidden", currentAuthRole !== "admin");
        }
        window.alert(successMessage);
        const resolvedRole = data.user?.role || currentAuthRole;
        if (resolvedRole === "student") {
          window.location.href = "student-dashboard.html";
          return;
        }
        if (resolvedRole === "admin") {
          window.location.href = "admin-dashboard.html";
        }
      })
      .catch((error) => {
        window.alert(error.message || "Unable to login right now.");
      })
      .finally(() => {
        if (loginSubmitButton) {
          loginSubmitButton.disabled = false;
          loginSubmitButton.textContent = originalButtonText || "Login";
        }
      });
  });

  sendOtpBtn?.addEventListener("click", () => {
    if (!registerMobile?.value.trim()) {
      window.alert("Enter your mobile number first.");
      registerMobile?.focus();
      return;
    }

    otpWrap?.classList.remove("auth-v2-hidden");
    otpActions?.classList.remove("auth-v2-hidden");
    if (otpStatus) {
      otpStatus.textContent = "Demo OTP sent. Use 123456 to verify.";
    }
    isOtpVerified = false;
  });

  verifyOtpBtn?.addEventListener("click", () => {
    if (!registerOtp) {
      return;
    }

    if (registerOtp.value.trim() !== "123456") {
      isOtpVerified = false;
      if (otpStatus) {
        otpStatus.textContent = "Invalid OTP. Please enter 123456.";
      }
      registerOtp.focus();
      return;
    }

    isOtpVerified = true;
    if (otpStatus) {
      otpStatus.textContent = "Mobile number verified successfully.";
    }
  });

  registerAuthForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const password = registerAuthForm.querySelector('input[name="register-password"]');
    const confirmPassword = registerAuthForm.querySelector('input[name="register-confirm-password"]');
    const originalButtonText = registerSubmitButton?.textContent;

    if (!isOtpVerified) {
      window.alert("Please verify your mobile number with OTP first.");
      sendOtpBtn?.focus();
      return;
    }

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      window.alert("Passwords do not match. Please try again.");
      confirmPassword.focus();
      return;
    }

    const payload = {
      fullName: String(document.getElementById("registerName")?.value || "").trim(),
      email: String(document.getElementById("registerEmail")?.value || "").trim(),
      mobile: String(document.getElementById("registerMobile")?.value || "").trim(),
      password: password?.value || "",
    };

    if (!payload.fullName || !payload.email || !payload.mobile || !payload.password) {
      window.alert("Please fill in all registration details.");
      return;
    }

    if (registerSubmitButton) {
      registerSubmitButton.disabled = true;
      registerSubmitButton.textContent = "Creating Account...";
    }

    postJson("/api/auth/register", payload)
      .then((data) => {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("authUser", JSON.stringify(data.user));
        window.alert(data.message || "Registration completed successfully.");
        registerAuthForm.reset();
        otpWrap?.classList.add("auth-v2-hidden");
        otpActions?.classList.add("auth-v2-hidden");
        if (otpStatus) {
          otpStatus.textContent = "OTP sent to your mobile number.";
        }
        isOtpVerified = false;
        setAuthMode("login");
      })
      .catch((error) => {
        window.alert(error.message || "Unable to create account right now.");
      })
      .finally(() => {
        if (registerSubmitButton) {
          registerSubmitButton.disabled = false;
          registerSubmitButton.textContent = originalButtonText || "Create Account";
        }
      });
  });
}

function openDashboardSidebar() {
  dashboardShell?.classList.add("is-sidebar-open");
}

function closeDashboardSidebar() {
  dashboardShell?.classList.remove("is-sidebar-open");
}

function setDashboardSection(sectionId) {
  if (!dashboardSections.length || !dashboardMenuButtons.length) {
    return;
  }

  dashboardSections.forEach((section) => {
    section.classList.toggle("is-active", section.id === sectionId);
  });

  dashboardMenuButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.dashboardTarget === sectionId);
  });

  if (window.innerWidth <= 1080) {
    closeDashboardSidebar();
  }
}

function setupDashboardNavigation() {
  if (!dashboardShell) {
    return;
  }

  dashboardSidebarToggle?.addEventListener("click", () => {
    dashboardShell.classList.contains("is-sidebar-open")
      ? closeDashboardSidebar()
      : openDashboardSidebar();
  });

  dashboardOverlay?.addEventListener("click", closeDashboardSidebar);

  dashboardMenuButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setDashboardSection(button.dataset.dashboardTarget);
    });
  });

  dashboardLogoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    window.location.href = "login.html";
  });
}

function setupDashboardProfile() {
  if (!dashboardShell) {
    return;
  }

  const storedUser = localStorage.getItem("authUser");
  if (!storedUser) {
    return;
  }

  try {
    const user = JSON.parse(storedUser);
    const displayName = user.fullName || "Student";
    const roleText = user.role === "admin" ? "Admin User" : "Student";
    const mobileText = user.mobile || "+91 00000 00000";
    const emailText = user.email || "student@example.com";

    if (dashboardStudentName) {
      dashboardStudentName.textContent = displayName;
    }

    if (dashboardStudentRole) {
      dashboardStudentRole.textContent = roleText;
    }

    if (profileStudentName) {
      profileStudentName.textContent = displayName;
    }

    if (profileStudentMobile) {
      profileStudentMobile.textContent = mobileText;
    }

    if (profileStudentEmail) {
      profileStudentEmail.textContent = emailText;
    }
  } catch (error) {
    console.error("Unable to load dashboard profile:", error);
  }
}

function renderStudentCharts(attendanceRecords = [], marksRecords = []) {
  if (typeof Chart === "undefined" || !isStudentDashboardPage()) {
    return;
  }

  const attendanceCanvas = document.getElementById("attendanceChart");
  const marksCanvas = document.getElementById("marksChart");
  const attendanceBuckets = buildMonthlyLabels(attendanceRecords, (record) => record.date);
  const marksLabels = marksRecords
    .slice(0, 6)
    .reverse()
    .map((record, index) => record.subject || `Test ${index + 1}`);
  const marksValues = marksRecords
    .slice(0, 6)
    .reverse()
    .map((record) => Number(record.marks || 0));

  const attendanceLabels = attendanceBuckets.length
    ? attendanceBuckets.map((bucket) => bucket.label)
    : ["No Data"];
  const attendanceValues = attendanceBuckets.length
    ? attendanceBuckets.map((bucket) => {
        const presentCount = bucket.items.filter((record) => record.status === "present").length;
        return Math.round((presentCount / bucket.items.length) * 100);
      })
    : [0];

  if (attendanceCanvas && !attendanceChartInstance) {
    attendanceChartInstance = new Chart(attendanceCanvas, {
      type: "bar",
      data: {
        labels: attendanceLabels,
        datasets: [
          {
            label: "Attendance %",
            data: attendanceValues,
            backgroundColor: "rgba(29, 78, 216, 0.75)",
            borderRadius: 14,
            maxBarThickness: 34,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: "rgba(23, 32, 51, 0.08)",
            },
            ticks: {
              callback: (value) => `${value}%`,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  } else if (attendanceChartInstance) {
    attendanceChartInstance.data.labels = attendanceLabels;
    attendanceChartInstance.data.datasets[0].data = attendanceValues;
    attendanceChartInstance.update();
  }

  if (marksCanvas && !marksChartInstance) {
    marksChartInstance = new Chart(marksCanvas, {
      type: "line",
      data: {
        labels: marksLabels.length ? marksLabels : ["No Data"],
        datasets: [
          {
            label: "Marks",
            data: marksValues.length ? marksValues : [0],
            borderColor: "#1d4ed8",
            backgroundColor: "rgba(29, 78, 216, 0.12)",
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBackgroundColor: "#1d4ed8",
            tension: 0.38,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: "rgba(23, 32, 51, 0.08)",
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  } else if (marksChartInstance) {
    marksChartInstance.data.labels = marksLabels.length ? marksLabels : ["No Data"];
    marksChartInstance.data.datasets[0].data = marksValues.length ? marksValues : [0];
    marksChartInstance.update();
  }
}

function setupDashboardCharts() {
  if (typeof Chart === "undefined") {
    return;
  }

  if (isStudentDashboardPage()) {
    renderStudentCharts();
  }
}

function setupAdminCharts() {
  if (typeof Chart === "undefined" || !isAdminDashboardPage()) {
    return;
  }

  attendanceChartInstance?.destroy();
  marksChartInstance?.destroy();
  attendanceChartInstance = null;
  marksChartInstance = null;

  const growthCanvas = document.getElementById("attendanceChart");
  const revenueCanvas = document.getElementById("marksChart");

  if (growthCanvas) {
    attendanceChartInstance = new Chart(growthCanvas, {
      type: "line",
      data: {
        labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
        datasets: [
          {
            label: "Students",
            data: [420, 488, 560, 635, 712, 842],
            borderColor: "#1d4ed8",
            backgroundColor: "rgba(29, 78, 216, 0.12)",
            fill: true,
            tension: 0.38,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: "#1d4ed8",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(23, 32, 51, 0.08)",
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }

  if (revenueCanvas) {
    marksChartInstance = new Chart(revenueCanvas, {
      type: "bar",
      data: {
        labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
        datasets: [
          {
            label: "Revenue",
            data: [120000, 145000, 186000, 214000, 258000, 301000],
            backgroundColor: [
              "rgba(29, 78, 216, 0.8)",
              "rgba(29, 78, 216, 0.72)",
              "rgba(59, 130, 246, 0.76)",
              "rgba(14, 165, 233, 0.72)",
              "rgba(37, 99, 235, 0.8)",
              "rgba(30, 64, 175, 0.82)",
            ],
            borderRadius: 14,
            maxBarThickness: 36,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(23, 32, 51, 0.08)",
            },
            ticks: {
              callback: (value) => `₹${value / 1000}k`,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }
}

function openAdminModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) {
    return;
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeAdminModal(modal) {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function setupAdminInteractions() {
  if (!isAdminDashboardPage()) {
    return;
  }

  dashboardProfileTrigger?.addEventListener("click", () => {
    dashboardProfileMenu?.classList.toggle("is-open");
  });

  dashboardProfileLogout?.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    window.location.href = "login.html";
  });

  adminModalOpenButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openAdminModal(button.dataset.adminModalOpen);
    });
  });

  adminModalCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".dashboard-modal");
      if (modal) {
        closeAdminModal(modal);
      }
    });
  });

  document.querySelectorAll(".dashboard-modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeAdminModal(modal);
      }
    });
  });

  adminConfirmButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const message = button.dataset.adminConfirm || "Are you sure?";
      const confirmed = window.confirm(message);
      if (confirmed) {
        window.alert("Demo action confirmed.");
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!dashboardProfileTrigger || !dashboardProfileMenu) {
      return;
    }

    const clickedInsideMenu = dashboardProfileMenu.contains(event.target);
    const clickedTrigger = dashboardProfileTrigger.contains(event.target);
    if (!clickedInsideMenu && !clickedTrigger) {
      dashboardProfileMenu.classList.remove("is-open");
    }
  });

  document.getElementById("studentsTableBody")?.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-delete-student]");

    if (!deleteButton) {
      return;
    }

    const studentId = deleteButton.dataset.deleteStudent;
    const confirmed = window.confirm("Delete this student record?");

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(`/api/students/${studentId}`, {
        method: "DELETE",
      });

      adminStudents = adminStudents.filter((student) => student._id !== studentId);
      adminAttendance = adminAttendance.filter((record) => record.studentId?._id !== studentId);
      adminMarks = adminMarks.filter((record) => record.studentId?._id !== studentId);
      adminFees = adminFees.filter((record) => record.studentId?._id !== studentId);
      renderStudentOptions();
      renderStudentsTable();
      renderAttendanceTable();
      renderMarksTable();
      renderFeesTable();
    } catch (error) {
      window.alert(error.message || "Unable to delete student.");
    }
  });
}

function setupAdminDataForms() {
  if (!isAdminDashboardPage()) {
    return;
  }

  document.getElementById("saveCourseBtn")?.addEventListener("click", async () => {
    const title = String(document.getElementById("courseName")?.value || "").trim();
    const duration = String(document.getElementById("courseDuration")?.value || "").trim();
    const fees = Number(document.getElementById("courseFees")?.value || 0);

    if (!title || !duration || !fees) {
      window.alert("Please fill in all course details.");
      return;
    }

    try {
      const course = await apiRequest("/api/courses", {
        method: "POST",
        body: JSON.stringify({ title, duration, fees }),
      });

      adminCourses = [course, ...adminCourses];
      renderCourseOptions();
      renderCoursesTable();
      document.getElementById("courseForm")?.reset();
      closeModalById("courseModal");
    } catch (error) {
      window.alert(error.message || "Unable to create course.");
    }
  });

  document.getElementById("saveStudentBtn")?.addEventListener("click", async () => {
    const name = String(document.getElementById("studentName")?.value || "").trim();
    const course = String(document.getElementById("studentCourse")?.value || "").trim();
    const phone = String(document.getElementById("studentMobile")?.value || "").trim();
    const email = String(document.getElementById("studentEmail")?.value || "").trim();
    const fees = Number(document.getElementById("studentFees")?.value || 0);
    const password = String(document.getElementById("studentPassword")?.value || "").trim();

    if (!name || !course || !phone || !email || !fees || !password) {
      window.alert("Please fill in all student details.");
      return;
    }

    try {
      const student = await apiRequest("/api/students", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          course,
          fees,
        }),
      });

      adminStudents = [student, ...adminStudents];
      renderStudentOptions();
      renderStudentsTable();
      document.getElementById("studentForm")?.reset();
      closeModalById("studentModal");
    } catch (error) {
      window.alert(error.message || "Unable to create student.");
    }
  });

  document.getElementById("saveAttendanceBtn")?.addEventListener("click", async () => {
    const studentId = String(document.getElementById("attendanceStudent")?.value || "").trim();
    const date = String(document.getElementById("attendanceDate")?.value || "").trim();
    const status = String(document.getElementById("attendanceStatus")?.value || "").trim().toLowerCase();

    if (!studentId || !date || !status) {
      window.alert("Please complete the attendance form.");
      return;
    }

    try {
      const attendance = await apiRequest("/api/attendance", {
        method: "POST",
        body: JSON.stringify({
          studentId,
          date,
          status,
        }),
      });

      adminAttendance = [attendance, ...adminAttendance];
      renderAttendanceTable();
      document.getElementById("attendanceForm")?.reset();
      closeModalById("attendanceModal");
    } catch (error) {
      window.alert(error.message || "Unable to save attendance.");
    }
  });

  document.getElementById("saveMarksBtn")?.addEventListener("click", async () => {
    const studentId = String(document.getElementById("marksStudent")?.value || "").trim();
    const subject = String(document.getElementById("marksSubject")?.value || "").trim();
    const marks = Number(document.getElementById("marksScore")?.value || 0);

    if (!studentId || !subject || Number.isNaN(marks)) {
      window.alert("Please complete the marks form.");
      return;
    }

    try {
      const marksRecord = await apiRequest("/api/marks", {
        method: "POST",
        body: JSON.stringify({
          studentId,
          subject,
          marks,
        }),
      });

      adminMarks = [marksRecord, ...adminMarks];
      renderMarksTable();
      document.getElementById("marksForm")?.reset();
      closeModalById("resultsModal");
    } catch (error) {
      window.alert(error.message || "Unable to save marks.");
    }
  });

  document.getElementById("saveFeesBtn")?.addEventListener("click", async () => {
    const studentId = String(document.getElementById("feesStudent")?.value || "").trim();
    const amount = Number(document.getElementById("feesAmount")?.value || 0);
    const status = String(document.getElementById("feesStatus")?.value || "").trim().toLowerCase();

    if (!studentId || !amount || !status) {
      window.alert("Please complete the fees form.");
      return;
    }

    try {
      const feesRecord = await apiRequest("/api/fees", {
        method: "POST",
        body: JSON.stringify({
          studentId,
          amount,
          status,
        }),
      });

      adminFees = [feesRecord, ...adminFees];
      renderFeesTable();
      document.getElementById("feesForm")?.reset();
      closeModalById("feesModal");
    } catch (error) {
      window.alert(error.message || "Unable to save fees.");
    }
  });
}

async function loadStudentDashboard() {
  if (!isStudentDashboardPage()) {
    return;
  }

  const storedUser = localStorage.getItem("authUser");
  const token = getAuthToken();

  if (!token || !storedUser) {
    window.location.href = "login.html";
    return;
  }

  try {
    const user = JSON.parse(storedUser);

    if (user.role !== "student") {
      window.location.href = user.role === "admin" ? "admin-dashboard.html" : "login.html";
      return;
    }
  } catch (error) {
    window.location.href = "login.html";
    return;
  }

  try {
    const data = await apiRequest("/api/student/dashboard");
    const student = data.student || {};
    const course = student.course || {};
    const attendance = Array.isArray(data.attendance) ? data.attendance : [];
    const marks = Array.isArray(data.marks) ? data.marks : [];
    const fees = Array.isArray(data.fees) ? data.fees : [];
    const totalClasses = attendance.length;
    const attendedClasses = attendance.filter((record) => record.status === "present").length;
    const absentClasses = totalClasses - attendedClasses;
    const attendancePercent = totalClasses ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    const courseFees = Number(student.fees || course.fees || 0);
    const paidAmount = fees
      .filter((record) => record.status === "paid")
      .reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const pendingRecordsTotal = fees
      .filter((record) => record.status === "pending")
      .reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const pendingAmount = Math.max(courseFees - paidAmount, pendingRecordsTotal, 0);
    const latestFeeStatus = fees[0]?.status || (pendingAmount > 0 ? "pending" : "paid");

    if (dashboardStudentName) {
      dashboardStudentName.textContent = student.name || "Student";
    }

    if (dashboardStudentRole) {
      dashboardStudentRole.textContent = course.title ? `${course.title} Student` : "Student";
    }

    if (profileStudentName) {
      profileStudentName.textContent = student.name || "-";
    }

    if (profileStudentMobile) {
      profileStudentMobile.textContent = student.phone || "-";
    }

    if (profileStudentEmail) {
      profileStudentEmail.textContent = student.email || "-";
    }

    if (profileStudentCourse) {
      profileStudentCourse.textContent = course.title || "-";
    }

    if (profileStudentFees) {
      profileStudentFees.textContent = latestFeeStatus;
    }

    updateTextContent("studentCourseTitle", course.title || "Course not assigned");
    updateTextContent("studentCourseSubtitle", course.title ? `${course.title} learning track` : "Course details will appear here");
    updateTextContent("studentCourseDuration", course.duration || "-");
    updateTextContent("studentTotalClassesValue", String(totalClasses));
    updateTextContent("studentAttendedClassesValue", String(attendedClasses));
    updateTextContent("studentAttendancePercentValue", `${attendancePercent}%`);
    updateTextContent("studentAttendanceTotalValue", String(totalClasses));
    updateTextContent("studentAttendancePresentValue", String(attendedClasses));
    updateTextContent("studentAttendanceAbsentValue", String(absentClasses));
    updateTextContent("studentAttendanceMonthlyValue", `${attendancePercent}%`);
    updateTextContent("studentFeesTotalValue", formatCurrency(courseFees));
    updateTextContent("studentFeesPaidValue", formatCurrency(paidAmount));
    updateTextContent("studentFeesPendingValue", formatCurrency(pendingAmount));
    updateTextContent("studentFeesStatusValue", latestFeeStatus);

    const attendanceTableBody = document.getElementById("studentAttendanceTableBody");
    if (attendanceTableBody) {
      attendanceTableBody.innerHTML = attendance.length
        ? attendance
            .map(
              (record) => `
                <tr>
                  <td>${formatDate(record.date)}</td>
                  <td><span class="dashboard-status ${record.status === "present" ? "present" : "absent"}">${record.status}</span></td>
                  <td>${course.title || "Class Session"}</td>
                </tr>
              `
            )
            .join("")
        : "<tr><td colspan=\"3\">No attendance records found.</td></tr>";
    }

    const resultsTableBody = document.getElementById("studentResultsTableBody");
    if (resultsTableBody) {
      resultsTableBody.innerHTML = marks.length
        ? marks
            .map((record) => {
              const grade = calculateGrade(record.marks);

              return `
                <tr>
                  <td>${record.subject || "-"}</td>
                  <td>${record.marks ?? "-"}</td>
                  <td><span class="dashboard-status ${getGradeClass(grade)}">${grade}</span></td>
                </tr>
              `;
            })
            .join("")
        : "<tr><td colspan=\"3\">No marks uploaded yet.</td></tr>";
    }

    const feesTableBody = document.getElementById("studentFeesTableBody");
    if (feesTableBody) {
      feesTableBody.innerHTML = fees.length
        ? fees
            .map(
              (record) => `
                <tr>
                  <td>${formatDate(record.createdAt)}</td>
                  <td>${formatCurrency(record.amount)}</td>
                  <td><span class="dashboard-status ${record.status === "paid" ? "present" : "pending"}">${record.status}</span></td>
                </tr>
              `
            )
            .join("")
        : "<tr><td colspan=\"3\">No fee entries found.</td></tr>";
    }

    renderStudentCharts(attendance, marks);
  } catch (error) {
    window.alert(error.message || "Unable to load student dashboard data.");
  }
}

menuBtn?.addEventListener("click", toggleMobileMenu);

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

["openModalBtn", "openModalBtnMobile", "heroEnquireBtn", "ctaEnquireBtn"].forEach((id) => {
  const trigger = document.getElementById(id);

  trigger?.addEventListener("click", openModal);
});

closeModalBtn?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal?.classList.contains("is-open")) {
    closeModal();
  }
});

enquiryForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(enquiryForm);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    course: String(formData.get("course") || "").trim(),
  };

  if (!payload.name || !payload.email || !payload.phone || !payload.course) {
    window.alert("Please fill in all enquiry details.");
    return;
  }

  const originalButtonText = enquirySubmitButton?.textContent;

  if (enquirySubmitButton) {
    enquirySubmitButton.disabled = true;
    enquirySubmitButton.textContent = "Submitting...";
  }

  fetch("/api/enquiry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit enquiry.");
      }

      closeModal();
      enquiryForm.reset();
      window.alert(data.message || "Enquiry submitted successfully.");
    })
    .catch((error) => {
      window.alert(error.message || "Unable to submit enquiry right now.");
    })
    .finally(() => {
      if (enquirySubmitButton) {
        enquirySubmitButton.disabled = false;
        enquirySubmitButton.textContent = originalButtonText || "Submit Enquiry";
      }
    });
});

window.addEventListener("load", () => {
  heroContent?.classList.add("is-visible");
  showSlide(currentSlideIndex);
  startSlideshow();
  setupRevealAnimation();
  setupAuthToggle();
  setupAuthRoleSwitch();
  setupAuthForms();
  setupDashboardNavigation();
  setupDashboardProfile();
  setupDashboardCharts();
  setupAdminCharts();
  setupAdminInteractions();
  setupAdminDataForms();
  loadAdminData();
  loadStudentDashboard();
});

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

  const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running"));