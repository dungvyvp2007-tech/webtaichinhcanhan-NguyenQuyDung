document.addEventListener("DOMContentLoaded", () => {
  const updateAccountUI = () => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser"));
      const nameDisplay = document.getElementById("userNameDisplay");
      const emailDisplay = document.getElementById("userEmailDisplay");

      if (authUser && nameDisplay && emailDisplay) {
        nameDisplay.textContent = authUser.fullName || "Người dùng";
        emailDisplay.textContent = authUser.email || "";
      }
    } catch (e) {
      console.error("Lỗi cập nhật UI tài khoản:", e);
    }
  };

  // Gọi hàm ngay khi vừa vào trang
  updateAccountUI();
  // --- TOAST HỖ TRỢ THÔNG BÁO ---
  const showToast = (message, type = "success", duration = 1800) => {
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
  // --- KHAI BÁO BIẾN ---
  const monthPicker = document.getElementById("monthPicker");
  const categoryNameInput = document.getElementById("categoryNameInput");
  const categoryBudgetInput = document.getElementById("categoryBudgetInput");
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const categoryWarning = document.getElementById("categoryWarning");
  const categoryContainer = document.getElementById("categoryContainer");
  const moneyDisplay = document.getElementById("money");

  // Biến tạm để lưu ID khi đang sửa
  let editingCategoryId = null;

  // --- HÀM TẠO KEY RIÊNG BIỆT CHO TỪNG USER ---
  const getStorageKey = (key) => {
    const authUser = JSON.parse(localStorage.getItem("authUser"));
    const userId = authUser ? authUser.id : "guest";
    return `user_${userId}_${key}`;
  };

  // --- LOGIC TÀI KHOẢN (DROPDOWN & CONFIRM MODAL) ---
  const accountBtn = document.querySelector(".account-btn");
  const logoutMenu = document.getElementById("logoutMenu");
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutConfirmModal = document.getElementById("logoutConfirmModal");
  const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
  const confirmDialogMessage =
    logoutConfirmModal?.querySelector(".modal-body p");
  let currentConfirmAction = null;

  const openConfirmModal = (message, confirmText, action) => {
    if (!logoutConfirmModal || !confirmLogoutBtn) return;
    if (confirmDialogMessage) confirmDialogMessage.textContent = message;
    confirmLogoutBtn.textContent = confirmText;
    currentConfirmAction = action;
    logoutConfirmModal.style.display = "flex";
    logoutMenu?.classList.add("hidden");
  };

  if (accountBtn && logoutMenu) {
    accountBtn.onclick = (e) => {
      e.stopPropagation();

      // Cập nhật lại thông tin mỗi khi mở menu (để tránh dữ liệu cũ)
      updateAccountUI();

      logoutMenu.classList.toggle("hidden");
    };
    document.onclick = (e) => {
      if (!e.target.closest(".account-dropdown"))
        logoutMenu.classList.add("hidden");
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.stopPropagation();
      openConfirmModal(
        "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?",
        "Đăng xuất",
        () => {
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("authUser");
          showToast("⚠️ Đang đăng xuất ...");
          setTimeout(() => {
            window.location.href = "./login.html";
          }, 1000);
        },
      );
    };
  }

  if (confirmLogoutBtn) {
    confirmLogoutBtn.onclick = () => {
      if (currentConfirmAction) currentConfirmAction();
    };
  }

  window.onclick = (e) => {
    if (e.target === logoutConfirmModal) {
      logoutConfirmModal.style.display = "none";
    }
  };

  document.querySelectorAll(".btn-cancel").forEach((btn) => {
    btn.onclick = () => {
      if (logoutConfirmModal) logoutConfirmModal.style.display = "none";
      currentConfirmAction = null;
    };
  });

  // --- QUẢN LÝ DANH MỤC & TIỀN BẠC ---

  // Thiết lập tháng hiện tại mặc định (YYYY-MM)
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  if (!monthPicker.value) monthPicker.value = currentMonth;

  /*
   * Hàm cập nhật số tiền còn lại
   */
  const updateRemainingMoney = (month) => {
    if (!month) return;
    const monthKey = `${month}-30`;

    // 1. Lấy NGÂN SÁCH (Dạng mảng giống home.js)
    const allBudgets =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyBudgets"))) || [];

    // Tìm object ngân sách của tháng đang chọn
    const currentBudgetObj = allBudgets.find((item) => item.month === monthKey);
    const monthTotalBudget = currentBudgetObj
      ? parseFloat(currentBudgetObj.budget || 0)
      : 0;

    // 2. Lấy CHI TIÊU từ các danh mục (monthlyCategories)
    const monthlyData =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyCategories"))) ||
      [];
    const monthEntry = monthlyData.find((item) => item.month === monthKey);

    let totalAllocated = 0;
    if (monthEntry && monthEntry.categories) {
      totalAllocated = monthEntry.categories.reduce(
        (sum, cat) => sum + Number(cat.budget || 0),
        0,
      );
    }

    // 3. Tính toán và hiển thị
    const remaining = monthTotalBudget - totalAllocated;

    if (moneyDisplay) {
      moneyDisplay.textContent = `${remaining.toLocaleString("vi-VN")} VND`;
      // Màu đỏ nếu âm, màu xanh nếu dương
      moneyDisplay.style.color = remaining < 0 ? "#EF4444" : "#22C55E";
    }
  };

  /*
   * Hàm hiển thị danh mục (Render)
   */
  const renderCategories = (month) => {
    if (!month) return;
    const monthKey = `${month}-30`;

    // SỬA: Lấy dữ liệu theo Key của User
    const storageCategories =
      JSON.parse(localStorage.getItem(getStorageKey("categories"))) || [];
    const monthlyData =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyCategories"))) ||
      [];
    const monthEntry = monthlyData.find((item) => item.month === monthKey);

    categoryContainer.innerHTML = "";

    if (
      !monthEntry ||
      !monthEntry.categories ||
      monthEntry.categories.length === 0
    ) {
      categoryContainer.innerHTML =
        '<p style="text-align: center; color: #999; margin-top: 20px;">Chưa có danh mục nào!</p>';
      return;
    }

    monthEntry.categories.forEach((item) => {
      const catInfo = storageCategories.find((c) => c.id === item.categoryId);
      const categoryName = catInfo ? catInfo.name : "Không xác định";

      const card = document.createElement("div");
      card.className = "category-card";
      card.innerHTML = `
                <div class="card-icon"><img src="../assets/images/Frame 5.png" alt="icon"></div>
                <div class="card-text">
                    <h4>${categoryName}</h4>
                    <p>${Number(item.budget).toLocaleString("vi-VN")} VND</p>
                </div>
                <div class="card-action">
                    <span class="delete-btn" title="Xóa"><img src="../assets/images/Vector (11).png" alt="delete"></span>
                    <span class="edit-btn" title="Sửa"><img src="../assets/images/Vector (10).png" alt="edit"></span>
                </div>
            `;

      card.querySelector(".edit-btn").onclick = () => {
        categoryNameInput.value = categoryName;
        categoryBudgetInput.value = item.budget;
        editingCategoryId = item.id;
        addCategoryBtn.textContent = "Lưu thay đổi";
        categoryNameInput.focus();
      };

      card.querySelector(".delete-btn").onclick = () => {
        openConfirmModal("Bạn có chắc muốn xóa không?", "Xóa", () => {
          let allMonthlyData =
            JSON.parse(
              localStorage.getItem(getStorageKey("monthlyCategories")),
            ) || [];
          const mIndex = allMonthlyData.findIndex((m) => m.month === monthKey);

          if (mIndex !== -1) {
            allMonthlyData[mIndex].categories = allMonthlyData[
              mIndex
            ].categories.filter((c) => c.id !== item.id);
            localStorage.setItem(
              getStorageKey("monthlyCategories"),
              JSON.stringify(allMonthlyData),
            );

            renderCategories(month);
            updateRemainingMoney(month);
            showToast("✅ Xóa danh mục thành công!", "success");
          }
          if (logoutConfirmModal) logoutConfirmModal.style.display = "none";
          currentConfirmAction = null;
        });
      };

      categoryContainer.appendChild(card);
    });
  };

  /*
   * Sự kiện click nút Thêm / Lưu thay đổi
   */
  addCategoryBtn.onclick = () => {
    const name = categoryNameInput.value.trim();
    const budget = Number(categoryBudgetInput.value.trim());
    const month = monthPicker.value;
    const monthKey = `${month}-30`;
    const authUser = JSON.parse(localStorage.getItem("authUser"));

    if (!name || !budget || budget <= 0) {
      categoryWarning.style.display = "block";
      setTimeout(() => (categoryWarning.style.display = "none"), 3000);
      return;
    }

    // --- BƯỚC 1: XỬ LÝ BẢNG 'categories' (Lưu theo User Key) ---
    let storageCategories =
      JSON.parse(localStorage.getItem(getStorageKey("categories"))) || [];
    let existingCat = storageCategories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    let categoryId;

    if (!existingCat) {
      categoryId = Date.now();
      storageCategories.push({
        id: categoryId,
        name: name,
        imageUrl: "đường dẫn ảnh",
        status: true,
      });
      localStorage.setItem(
        getStorageKey("categories"),
        JSON.stringify(storageCategories),
      );
    } else {
      categoryId = existingCat.id;
    }

    // --- BƯỚC 2: XỬ LÝ BẢNG 'monthlyCategories' (Lưu theo User Key) ---
    let monthlyData =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyCategories"))) ||
      [];
    let monthEntry = monthlyData.find((item) => item.month === monthKey);

    if (!monthEntry) {
      monthEntry = {
        id: Date.now() + 1,
        month: monthKey,
        userId: authUser ? authUser.id : 1,
        categories: [],
      };
      monthlyData.push(monthEntry);
    }

    if (editingCategoryId !== null) {
      monthEntry.categories = monthEntry.categories.map((c) =>
        c.id === editingCategoryId
          ? { ...c, categoryId: categoryId, budget: budget }
          : c,
      );
      editingCategoryId = null;
      addCategoryBtn.textContent = "Thêm danh mục";
      showToast("✅ Cập nhật danh mục thành công!", "success");
    } else {
      monthEntry.categories.push({
        id: Date.now() + 2,
        categoryId: categoryId,
        budget: budget,
      });
      showToast("✅ Thêm danh mục mới thành công!", "success");
    }

    localStorage.setItem(
      getStorageKey("monthlyCategories"),
      JSON.stringify(monthlyData),
    );

    // --- BƯỚC 3: RESET & CẬP NHẬT ---
    categoryNameInput.value = "";
    categoryBudgetInput.value = "";
    renderCategories(month);
    updateRemainingMoney(month);
  };

  // Khi đổi tháng
  monthPicker.onchange = () => {
    renderCategories(monthPicker.value);
    updateRemainingMoney(monthPicker.value);
  };

  // Khởi tạo
  renderCategories(monthPicker.value);
  updateRemainingMoney(monthPicker.value);
});
