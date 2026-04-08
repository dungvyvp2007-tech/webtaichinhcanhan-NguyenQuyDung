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
      console.error("Lỗi cập nhật thông tin tài khoản:", e);
    }
  };

  // Gọi ngay khi load trang
  updateAccountUI();
  // --- HÀM HỖ TRỢ (UTILITIES) ---
  const getStorageKey = (key) => {
    const authUser = JSON.parse(localStorage.getItem("authUser"));
    const userId = authUser ? authUser.id : "guest";
    return `user_${userId}_${key}`;
  };

  const showToast = (message, duration = 3000) => {
    const toast = document.getElementById("toast");
    if (!toast) return;

    // Thêm icon tùy theo nội dung message
    let icon = "⚠️"; // Mặc định là cảnh báo
    if (message.includes("thành công")) icon = "✅";
    if (message.includes("Vượt hạn mức")) icon = "🚫";

    toast.innerHTML = `<span>${icon}</span> ${message}`; // Dùng innerHTML để hiện icon

    toast.classList.remove("hidden");
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.classList.add("hidden"), 300);
    }, duration);
  };

  const formatMoney = (value) => Number(value).toLocaleString("vi-VN") + " VND";

  const getCategoryById = (id) => {
    const categories =
      JSON.parse(localStorage.getItem(getStorageKey("categories"))) || [];
    return (
      categories.find((c) => c.id == id) || { name: "Không xác định", id: 0 }
    );
  };

  // --- DOM ELEMENTS ---
  const monthPicker = document.getElementById("monthPicker");
  const moneyDisplay = document.getElementById("money");
  const categorySelect = document.getElementById("categorySelect");
  const amountInput = document.getElementById("amountInput");
  const noteInput = document.getElementById("noteInput");
  const addTransactionBtn = document.getElementById("addTransactionBtn");
  const historyTableBody = document.getElementById("historyTableBody");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const sortSelect = document.getElementById("sortSelect");
  const logoutBtn = document.getElementById("logoutBtn");
  const accountBtn = document.querySelector(".account-btn");
  const logoutMenu = document.getElementById("logoutMenu");
  const logoutConfirmModal = document.getElementById("logoutConfirmModal");
  const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
  const confirmDialogMessage =
    logoutConfirmModal?.querySelector(".modal-body p");
  let currentConfirmAction = null;
  const statsTableBody = document.getElementById("statsTableBody");
  const paginationContainer = document.getElementById("pagination");
  const monthStatusFilter = document.getElementById("monthStatusFilter");

  const openConfirmModal = (message, confirmText, action) => {
    if (!logoutConfirmModal || !confirmLogoutBtn) return;
    if (confirmDialogMessage) confirmDialogMessage.textContent = message;
    confirmLogoutBtn.textContent = confirmText;
    currentConfirmAction = action;
    logoutConfirmModal.style.display = "flex";
    logoutMenu?.classList.add("hidden");
  };

  // --- TRẠNG THÁI (STATE) ---
  let state = {
    currentPage: 1,
    rowsPerPage: 5,
    searchTerm: "",
    sortDirection: "none",
  };

  if (!monthPicker.value) {
    monthPicker.value = new Date().toISOString().slice(0, 7);
  }

  // --- LOGIC GIAO DỊCH ---
  const getTransactionsByMonth = (month) => {
    const monthKey = `${month}-30`;
    const monthlyData =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyTransactions"))) ||
      [];
    const monthEntry = monthlyData.find((item) => item.month === monthKey);
    return monthEntry ? monthEntry.transactions || [] : [];
  };

  const saveTransactions = (month, transactions) => {
    const monthKey = `${month}-30`;
    const storageKey = getStorageKey("monthlyTransactions");
    let monthlyData = JSON.parse(localStorage.getItem(storageKey)) || [];

    const index = monthlyData.findIndex((item) => item.month === monthKey);
    if (index !== -1) {
      monthlyData[index].transactions = transactions;
    } else {
      monthlyData.push({ month: monthKey, transactions });
    }
    localStorage.setItem(storageKey, JSON.stringify(monthlyData));
  };

  const updateFinancialStatus = () => {
    const month = monthPicker.value;
    const monthKey = `${month}-30`;

    // 1. Lấy NGÂN SÁCH (Dạng mảng giống home.js)
    const allBudgets =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyBudgets"))) || [];

    // Tìm object ngân sách của tháng đang chọn
    const currentBudgetObj = allBudgets.find((item) => item.month === monthKey);
    const totalBudget = currentBudgetObj
      ? parseFloat(currentBudgetObj.budget || 0)
      : 0;

    // 2. Tính TỔNG CHI TIÊU từ giao dịch
    const transactions = getTransactionsByMonth(month);
    const totalSpent = transactions.reduce(
      (sum, t) => sum + Number(t.total || 0),
      0,
    );

    // 3. Tính CÒN LẠI
    const remaining = totalBudget - totalSpent;

    if (moneyDisplay) {
      moneyDisplay.textContent = formatMoney(remaining);
      moneyDisplay.style.color = remaining < 0 ? "#EF4444" : "#22C55E";
    }
  };

  // --- RENDER ---
  const renderHistoryTable = () => {
    const month = monthPicker.value;
    let transactions = getTransactionsByMonth(month);

    let filtered = transactions.filter((t) => {
      const categoryName = getCategoryById(t.categoryId).name.toLowerCase();
      const note = (t.description || "").toLowerCase();
      const search = state.searchTerm.toLowerCase();
      return categoryName.includes(search) || note.includes(search);
    });

    if (state.sortDirection === "asc") {
      filtered.sort((a, b) => a.total - b.total);
    } else if (state.sortDirection === "desc") {
      filtered.sort((a, b) => b.total - a.total);
    }

    const totalRows = filtered.length;
    const maxPage = Math.ceil(totalRows / state.rowsPerPage) || 1;
    if (state.currentPage > maxPage) state.currentPage = maxPage;

    const startIndex = (state.currentPage - 1) * state.rowsPerPage;
    const visibleRows = filtered.slice(
      startIndex,
      startIndex + state.rowsPerPage,
    );

    historyTableBody.innerHTML = "";
    if (visibleRows.length === 0) {
      historyTableBody.innerHTML = `<tr><td colspan="5" class="text-center">Không có giao dịch phù hợp.</td></tr>`;
    } else {
      visibleRows.forEach((t, index) => {
        const category = getCategoryById(t.categoryId);
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="text-center">${startIndex + index + 1}</td>
            <td>${category.name}</td>
            <td>${formatMoney(t.total)}</td>
            <td>${t.description || ""}</td>
          <td class="text-center">
            <button class="btn-icon btn-delete" data-id="${t.id}"><img src="../assets/icons/Vector (13).png" alt=""></button>
          </td>
        `;
        historyTableBody.appendChild(row);
      });
    }
    renderPagination(totalRows);
    renderStatsTable();
    updateFinancialStatus();
  };

  const renderCategoryOptions = () => {
    const categories =
      JSON.parse(localStorage.getItem(getStorageKey("categories"))) || [];
    categorySelect.innerHTML = "<option value=''>Danh mục chi tiêu</option>";
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  };
  // --- HÀM RENDER PHÂN TRANG ---
  const renderPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / state.rowsPerPage) || 1;
    if (!paginationContainer) return;

    paginationContainer.innerHTML = "";

    // Nút Quay lại (Back)
    const prevBtn = document.createElement("button");
    prevBtn.className = "page-item";
    prevBtn.innerHTML = `<img src="../assets/images/arrow left.png" alt="">`;
    prevBtn.disabled = state.currentPage === 1;
    prevBtn.onclick = () => {
      state.currentPage--;
      renderHistoryTable();
    };
    paginationContainer.appendChild(prevBtn);

    // Các số trang
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.className = `page-item ${state.currentPage === i ? "active" : ""}`;
      pageBtn.textContent = i;
      pageBtn.onclick = () => {
        state.currentPage = i;
        renderHistoryTable();
      };
      paginationContainer.appendChild(pageBtn);
    }

    // Nút Tiếp theo (Next)
    const nextBtn = document.createElement("button");
    nextBtn.className = "page-item";
    nextBtn.innerHTML = `<img src="../assets/images/arrow right.png" alt="">`;
    nextBtn.disabled = state.currentPage === totalPages;
    nextBtn.onclick = () => {
      state.currentPage++;
      renderHistoryTable();
    };
    paginationContainer.appendChild(nextBtn);
  };

  // --- HÀM RENDER BẢNG THỐNG KÊ CHI TIÊU ---
  const renderStatsTable = () => {
    // Đọc ngân sách dạng Mảng
    const allBudgets =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyBudgets"))) || [];
    const monthlyTransactionsData =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyTransactions"))) ||
      [];
    const filterValue = monthStatusFilter ? monthStatusFilter.value : "all";

    // Lấy danh sách các tháng (Key dạng YYYY-MM)
    const allMonths = [
      ...new Set([
        ...allBudgets.map((b) => b.month.replace("-30", "")),
        ...monthlyTransactionsData.map((d) => d.month.replace("-30", "")),
      ]),
    ];

    statsTableBody.innerHTML = "";

    allMonths
      .sort()
      .reverse()
      .forEach((m) => {
        const monthKey = `${m}-30`;

        // Tìm budget trong mảng budgets
        const budgetObj = allBudgets.find((b) => b.month === monthKey);
        const budget = budgetObj ? parseFloat(budgetObj.budget || 0) : 0;

        const transactions = getTransactionsByMonth(m);
        const totalSpent = transactions.reduce(
          (sum, t) => sum + Number(t.total),
          0,
        );

        const isAchieved = totalSpent <= budget && budget > 0;
        const statusText = isAchieved ? "Đạt" : "Không đạt";
        const statusClass = isAchieved
          ? "badge-achieved"
          : "badge-not-achieved";

        if (filterValue === "achieved" && !isAchieved) return;
        if (filterValue === "notAchieved" && isAchieved) return;

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${m}</td>
          <td>${formatMoney(budget)}</td>
          <td>${formatMoney(totalSpent)}</td>
          <td class="text-center">
            <span class="status-badge ${statusClass}">${statusText}</span>
          </td>
        `;
        statsTableBody.appendChild(row);
      });
  };

  // --- XỬ LÝ SỰ KIỆN (EVENTS) ---

  // 1. Thêm giao dịch (CÓ KIỂM TRA HẠN MỨC DANH MỤC)
  addTransactionBtn.onclick = () => {
    const amount = parseFloat(amountInput.value);
    const categoryId = categorySelect.value;
    const note = noteInput.value.trim();
    const month = monthPicker.value;
    const monthKey = `${month}-30`;

    // Lấy thông tin user đang đăng nhập
    const authUser = JSON.parse(localStorage.getItem("authUser"));

    if (!amount || amount <= 0 || !categoryId) {
      showToast("Vui lòng nhập đủ số tiền và chọn danh mục!");
      return;
    }

    // 1. Tìm bảng monthlyCategories để lấy hạn mức và monthlyCategoryId
    const monthlyCategories =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyCategories"))) ||
      [];
    const currentMonthCatEntry = monthlyCategories.find(
      (item) => item.month === monthKey,
    );

    if (!currentMonthCatEntry) {
      showToast("Vui lòng thiết lập danh mục chi tiêu cho tháng này trước!");
      return;
    }

    // 2. Tìm danh mục cụ thể trong tháng đó
    const catConfig = currentMonthCatEntry.categories.find(
      (c) => c.categoryId == categoryId,
    );
    if (!catConfig) {
      showToast("Danh mục này chưa được cấp ngân sách trong tháng!");
      return;
    }

    const limit = parseFloat(catConfig.budget);
    let transactions = getTransactionsByMonth(month);

    // 3. Kiểm tra hạn mức còn lại của danh mục
    const alreadySpent = transactions
      .filter((t) => t.categoryId == categoryId)
      .reduce((sum, t) => sum + Number(t.total), 0);

    if (alreadySpent + amount > limit) {
      const remaining = limit - alreadySpent;
      showToast(
        `Vượt hạn mức! Chỉ còn được chi thêm ${formatMoney(remaining)}.`,
      );
      amountInput.focus();
      return;
    }

    // 4. TẠO OBJECT GIAO DỊCH MỚI (Đúng cấu trúc ảnh mẫu)
    const newTransaction = {
      id: Date.now(), // Tạo ID duy nhất bằng timestamp
      userId: authUser ? authUser.id : 1,
      createdDate: new Date().toISOString().split("T")[0], // Kết quả: "2026-04-06"
      total: amount,
      description: note,
      categoryId: Number(categoryId),
      monthlyCategoryId: currentMonthCatEntry.id, // Liên kết với ID của bảng monthlyCategories
    };

    // 5. Lưu vào mảng và cập nhật LocalStorage
    transactions.push(newTransaction);
    saveTransactions(month, transactions);

    // 6. Reset form và cập nhật giao diện
    amountInput.value = "";
    noteInput.value = "";
    showToast("Đã thêm giao dịch thành công!");
    renderHistoryTable();
  };

  // 2. Xóa giao dịch
  historyTableBody.onclick = (e) => {
    if (e.target.closest(".btn-delete")) {
      const id = e.target.closest(".btn-delete").dataset.id;
      const month = monthPicker.value;

      openConfirmModal("Bạn có chắc muốn xóa giao dịch không?", "Xóa", () => {
        let transactions = getTransactionsByMonth(month);
        transactions = transactions.filter((t) => t.id != id);
        saveTransactions(month, transactions);
        renderHistoryTable();
        showToast(" Đã xóa giao dịch thành công!");
        if (logoutConfirmModal) logoutConfirmModal.style.display = "none";
        currentConfirmAction = null;
      });
    }
  };

  // 3. Các sự kiện Filter/Search
  searchInput.oninput = (e) => {
    state.searchTerm = e.target.value.trim();
    state.currentPage = 1; // Luôn quay về trang 1 khi tìm kiếm
    renderHistoryTable();
  };

  sortSelect.onchange = (e) => {
    state.sortDirection = e.target.value;
    renderHistoryTable();
  };

  monthPicker.onchange = () => {
    state.currentPage = 1;
    renderHistoryTable();
  };

  // 4. Logout logic
  if (accountBtn) {
    accountBtn.onclick = (e) => {
      e.stopPropagation();

      // Luôn cập nhật lại thông tin mới nhất khi mở menu
      updateAccountUI();

      logoutMenu.classList.toggle("hidden");
    };
  }
  document.addEventListener("click", () => logoutMenu?.classList.add("hidden"));

  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.stopPropagation();
      openConfirmModal(
        "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?",
        "Đăng xuất",
        () => {
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("authUser");
          showToast(" Đang đăng xuất ...");
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

  window.addEventListener("click", (e) => {
    if (e.target === logoutConfirmModal) {
      logoutConfirmModal.style.display = "none";
      currentConfirmAction = null;
    }
  });

  document.querySelectorAll(".btn-cancel").forEach((btn) => {
    btn.onclick = () => {
      if (logoutConfirmModal) logoutConfirmModal.style.display = "none";
      currentConfirmAction = null;
    };
  });

  renderCategoryOptions();
  renderHistoryTable();
  // --- SỰ KIỆN LỌC TRẠNG THÁI THỐNG KÊ ---
  if (monthStatusFilter) {
    monthStatusFilter.onchange = renderStatsTable;
  }
});
