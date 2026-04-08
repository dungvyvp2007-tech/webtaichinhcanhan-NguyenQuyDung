document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submit");
  const h1 = document.querySelector("h1");

  const successMsg = document.createElement("p");
  successMsg.id = "successMessage";
  successMsg.textContent = "Sign Up Successfully";
  h1.insertAdjacentElement("afterend", successMsg);

  const emailField = document.getElementById("emailSignUp");
  const passField = document.getElementById("inputPass");
  const confirmField = document.getElementById("confirmPass");
  const errorEmail = document.getElementById("errorEmail");
  const errorPass = document.getElementById("errorPass");
  const errorRePass = document.getElementById("errorRePass");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function showError(el, msgEl, message) {
    el.classList.add("invalid");
    msgEl.textContent = message;
    msgEl.classList.add("show");
  }

  function clearError(el, msgEl) {
    el.classList.remove("invalid");
    msgEl.classList.remove("show");
  }

  function getUsers() {
    const raw = localStorage.getItem("users");
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
  }

  submitBtn.addEventListener("click", () => {
    let valid = true;
    clearError(emailField, errorEmail);
    clearError(passField, errorPass);
    clearError(confirmField, errorRePass);
    successMsg.style.display = "none";

    const email = emailField.value.trim();
    const pass = passField.value;
    const confirm = confirmField.value;

    if (!email) {
      showError(emailField, errorEmail, "Please enter your email...");
      valid = false;
    } else if (!emailRegex.test(email)) {
      showError(emailField, errorEmail, "Please enter a valid email...");
      valid = false;
    }

    if (!pass) {
      showError(passField, errorPass, "Please enter your password...");
      valid = false;
    } else if (pass.length < 6) {
      showError(
        passField,
        errorPass,
        "Password must be at least 6 characters...",
      );
      valid = false;
    }

    if (!confirm) {
      showError(
        confirmField,
        errorRePass,
        "Please enter your confirm password...",
      );
      valid = false;
    } else if (pass !== confirm) {
      showError(confirmField, errorRePass, "Passwords do not match...");
      valid = false;
    }

    if (!valid) return;

    const users = getUsers();
    const emailExists = users.some((u) => u.email === email);
    if (emailExists) {
      showError(
        emailField,
        errorEmail,
        "Email đã tồn tại. Vui lòng dùng email khác.",
      );
      return;
    }

    const newUser = {
      id: Date.now(),
      email,
      password: pass,
      fullName: "",
      phone: "",
      gender: null,
    };

    users.push(newUser);
    saveUsers(users);

    // Tự động set authUser để chuyển sang trạng thái đăng nhập cho user này (nếu cần)
    localStorage.setItem("authUser", JSON.stringify(newUser));

    successMsg.style.display = "block";

    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1000);
  });

  [emailField, passField, confirmField].forEach((field) => {
    field.addEventListener("input", () => {
      if (field === emailField) clearError(field, errorEmail);
      if (field === passField) clearError(field, errorPass);
      if (field === confirmField) clearError(field, errorRePass);
      successMsg.style.display = "none";
    });
  });
});
