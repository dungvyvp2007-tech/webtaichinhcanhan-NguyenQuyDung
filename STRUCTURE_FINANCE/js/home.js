const updateAccountUI = () => {
  try {
    const authUser = JSON.parse(localStorage.getItem("authUser"));
    const nameDisplay = document.getElementById("userNameDisplay");
    const emailDisplay = document.getElementById("userEmailDisplay");

    // CHỈ CHẠY KHI CÓ ĐỦ CẢ 3 THỨ
    if (authUser && nameDisplay && emailDisplay) {
      nameDisplay.textContent = authUser.fullName || "Người dùng";
      emailDisplay.textContent = authUser.email || "";
    }
  } catch (e) {
    console.error("Lỗi cập nhật UI tài khoản:", e);
  }
};
// --- 1. CÁC HÀM HỖ TRỢ DÙNG CHUNG ---
const getStorageKey = (key) => {
  const authUser = JSON.parse(localStorage.getItem("authUser"));
  const userId = authUser ? authUser.id : "guest";
  return `user_${userId}_${key}`;
};

const getAuthUser = () => JSON.parse(localStorage.getItem("authUser"));
const getAllUsers = () => JSON.parse(localStorage.getItem("users")) || [];

// --- TOAST HỖ TRỢ THÔNG BÁO ---
const showToast = (message, type = "success", duration = 3000) => {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.classList.remove("hidden");
  toast.classList.remove("success", "error");
  toast.classList.add("show", type);
  toast.textContent = message;

  setTimeout(() => {
    toast.classList.remove("show", type);
    toast.classList.add("hidden");
  }, duration);
};

// --- 2. HÀM TÍNH TOÁN VÀ HIỂN THỊ TIỀN ---
function updateFinancialStatus() {
  const monthPicker = document.getElementById("monthPicker");
  const moneyDisplay = document.getElementById("money");
  const budgetInput = document.getElementById("budgetInput");

  if (!monthPicker || !moneyDisplay) return;

  const selectedMonth = monthPicker.value;
  if (!selectedMonth) return;

  const allBudgets =
    JSON.parse(localStorage.getItem(getStorageKey("monthlyBudgets"))) || [];
  const monthKey = `${selectedMonth}-30`;

  const currentBudgetObj = allBudgets.find((item) => item.month === monthKey);
  const totalBudget = currentBudgetObj
    ? parseFloat(currentBudgetObj.budget || 0)
    : 0;

  if (budgetInput) budgetInput.value = totalBudget > 0 ? totalBudget : "";

  const allMonthlyCategories =
    JSON.parse(localStorage.getItem(getStorageKey("monthlyCategories"))) || [];
  const monthEntry = allMonthlyCategories.find(
    (item) => item.month === monthKey,
  );

  let totalSpent = 0;
  if (monthEntry && monthEntry.categories) {
    totalSpent = monthEntry.categories.reduce(
      (sum, item) => sum + parseFloat(item.budget || 0),
      0,
    );
  }

  const remaining = totalBudget - totalSpent;
  moneyDisplay.textContent = remaining.toLocaleString("vi-VN") + " VND";
  moneyDisplay.style.color = remaining < 0 ? "#ef4444" : "#22C55E";
}

document.addEventListener("DOMContentLoaded", () => {
  // 1. Cập nhật UI tài khoản ngay khi load
  updateAccountUI();

  // 2. KHAI BÁO BIẾN (Thêm kiểm tra tồn tại để tránh crash)
  const infoModal = document.getElementById("infoModal");
  const passModal = document.getElementById("passModal");
  const logoutConfirmModal = document.getElementById("logoutConfirmModal");

  // 3. KHỞI TẠO THÔNG TIN NGƯỜI DÙNG (An toàn hơn)
  const authUser = getAuthUser();
  if (authUser) {
    const mainName = document.getElementById("mainName");
    const mainEmail = document.getElementById("mainEmail");
    const mainPhone = document.getElementById("mainPhone");
    const mainGender = document.getElementById("mainGender");

    if (mainName) mainName.value = authUser.fullName || "";
    if (mainEmail) mainEmail.value = authUser.email || "";
    if (mainPhone) mainPhone.value = authUser.phone || "";
    if (mainGender) mainGender.value = authUser.gender ? "Male" : "Female";
  }

  // --- KHỞI TẠO THÁNG VÀ TIỀN ---
  const monthPicker = document.getElementById("monthPicker");
  if (monthPicker && !monthPicker.value) {
    monthPicker.value = new Date().toISOString().slice(0, 7);
  }
  updateFinancialStatus();

  // --- XỬ LÝ MENU TÀI KHOẢN & DROPDOWN ---
  const accountBtn = document.querySelector(".account-btn");
  const logoutMenu = document.getElementById("logoutMenu");
  if (accountBtn && logoutMenu) {
    accountBtn.onclick = (e) => {
      e.stopPropagation();

      updateAccountUI(); // <--- GỌI LẠI Ở ĐÂY LẦN NỮA KHI CLICK

      logoutMenu.classList.toggle("hidden");
    };
    document.addEventListener("click", () =>
      logoutMenu.classList.add("hidden"),
    );
  }

  // --- XỬ LÝ LOGOUT VỚI CUSTOM MODAL ---
  const logoutBtn = document.getElementById("logoutBtn");
  const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.stopPropagation();
      logoutConfirmModal.style.display = "flex"; // Hiện modal logout
      if (logoutMenu) logoutMenu.classList.add("hidden");
    };
  }

  if (confirmLogoutBtn) {
    confirmLogoutBtn.onclick = () => {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("authUser");
      showToast("⚠️ Đang đăng xuất ...");
      setTimeout(() => {
        window.location.href = "./login.html";
      }, 1000);
    };
  }

  // --- XỬ LÝ NGÂN SÁCH ---
  const saveBudgetBtn = document.getElementById("saveBudgetBtn");
  if (saveBudgetBtn) {
    saveBudgetBtn.onclick = () => {
      const amount = document.getElementById("budgetInput").value;
      const monthKey = `${monthPicker.value}-30`;

      if (!amount || amount <= 0) {
        document.getElementById("budgetWarning").style.display = "block";
        return;
      }

      document.getElementById("budgetWarning").style.display = "none";
      let allBudgets =
        JSON.parse(localStorage.getItem(getStorageKey("monthlyBudgets"))) || [];
      const existingIndex = allBudgets.findIndex(
        (item) => item.month === monthKey,
      );

      if (existingIndex !== -1) {
        allBudgets[existingIndex].budget = amount;
      } else {
        allBudgets.push({
          categories: [],
          id: Date.now(),
          month: monthKey,
          userId: authUser ? authUser.id : null,
          budget: amount,
        });
      }

      localStorage.setItem(
        getStorageKey("monthlyBudgets"),
        JSON.stringify(allBudgets),
      );
      document.getElementById("budgetSuccess").style.display = "block";
      setTimeout(() => {
        document.getElementById("budgetSuccess").style.display = "none";
      }, 2000);
      updateFinancialStatus();
    };
  }

  if (monthPicker) {
    monthPicker.onchange = () => updateFinancialStatus();
  }

  // --- CHỈNH SỬA THÔNG TIN ---
  if (editInfoForm) {
    editInfoForm.onsubmit = (e) => {
      e.preventDefault();
      const auth = getAuthUser();
      const users = getAllUsers();

      // Lấy giá trị email mới từ form
      const newEmail = document.getElementById("editEmail").value.trim();

      // 1. Kiểm tra email đã tồn tại ở tài khoản khác chưa
      const isEmailExists = users.some(
        (u) =>
          u.email.toLowerCase() === newEmail.toLowerCase() && u.id !== auth.id,
      );

      if (isEmailExists) {
        showToast(
          "⚠️ Email này đã được sử dụng bởi một tài khoản khác!",
          "error",
        );
        return; // Dừng thực thi, không cho lưu
      }

      // 2. Nếu không trùng thì tiến hành cập nhật dữ liệu
      const updatedData = {
        fullName: document.getElementById("editName").value.trim(),
        email: newEmail,
        phone: document.getElementById("editPhone").value.trim(),
        gender: document.getElementById("editGender").value === "Male",
      };

      // Cập nhật localStorage cho authUser
      localStorage.setItem(
        "authUser",
        JSON.stringify({ ...auth, ...updatedData }),
      );

      // Cập nhật trong danh sách users
      const userIndex = users.findIndex((u) => u.id === auth.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedData };
        localStorage.setItem("users", JSON.stringify(users));
      }

      showToast("✅ Cập nhật thông tin thành công!", "success");
      infoModal.style.display = "none";
      setTimeout(() => location.reload(), 1000);
    };
  }

  // --- ĐỔI MẬT KHẨU ---
  if (editPassForm) {
    editPassForm.onsubmit = (e) => {
      e.preventDefault();
      const auth = getAuthUser();
      const users = getAllUsers();
      const userIndex = users.findIndex((u) => u.id === auth.id);

      const currentPassInput = document.getElementById("currentPass").value;
      const newPass = document.getElementById("newPass").value;
      const confirmPass = document.getElementById("confirmPass").value;

      if (currentPassInput !== users[userIndex].password) {
        showToast("⚠️ Mật khẩu cũ không chính xác!", "error");
        return;
      }
      if (newPass !== confirmPass) {
        showToast("⚠️ Mật khẩu xác nhận không khớp!", "error");
        return;
      }
      if (newPass.length < 6) {
        showToast("⚠️ Mật khẩu phải từ 6 ký tự!", "error");
        return;
      }

      // Nếu mọi thứ hợp lệ
      users[userIndex].password = newPass;
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("authUser");

      showToast(
        "✅ Đổi mật khẩu thành công! Vui lòng đăng nhập lại.",
        "success",
      );
      setTimeout(() => {
        window.location.href = "./login.html";
      }, 1500);
    };
  }

  // --- ĐÓNG/MỞ MODAL ---
  const openInfoBtn = document.getElementById("openInfoModal");
  const openPassBtn = document.getElementById("openPassModal");

  if (openInfoBtn) {
    openInfoBtn.onclick = () => {
      const auth = getAuthUser();
      document.getElementById("editName").value = auth.fullName || "";
      document.getElementById("editEmail").value = auth.email || "";
      document.getElementById("editPhone").value = auth.phone || "";
      document.getElementById("editGender").value = auth.gender
        ? "Male"
        : "Female";
      infoModal.style.display = "block";
    };
  }

  if (openPassBtn) {
    openPassBtn.onclick = () => {
      editPassForm.reset();
      passModal.style.display = "block";
    };
  }

  // Đóng Modal khi nhấn nút X hoặc nút Cancel (Áp dụng cho cả Logout Modal)
  document.querySelectorAll(".close-btn, .btn-cancel").forEach((btn) => {
    btn.onclick = () => {
      if (infoModal) infoModal.style.display = "none";
      if (passModal) passModal.style.display = "none";
      if (logoutConfirmModal) logoutConfirmModal.style.display = "none";
    };
  });

  // Đóng khi nhấn ra ngoài vùng Modal
  window.onclick = (e) => {
    if (e.target === infoModal) infoModal.style.display = "none";
    if (e.target === passModal) passModal.style.display = "none";
    if (e.target === logoutConfirmModal)
      logoutConfirmModal.style.display = "none";
  };

  // Cập nhật tài chính realtime khi storage thay đổi
  window.addEventListener("storage", (e) => {
    if (
      e.key.includes("monthlyCategories") ||
      e.key.includes("monthlyBudgets")
    ) {
      updateFinancialStatus();
    }
  });
});
