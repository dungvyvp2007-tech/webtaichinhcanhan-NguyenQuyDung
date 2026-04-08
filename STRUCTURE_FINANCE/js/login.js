document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("emailLogin");
  const passwordInput = document.getElementById("passwordLogin");
  const loginBtn = document.getElementById("loginBtn");
  const errorEmail = document.getElementById("errorEmail");
  const errorPassword = document.getElementById("errorPassword");
  const successMessage = document.getElementById("successMessage");

  function showError(field, errorElement, message) {
    field.classList.add("invalid");
    errorElement.textContent = message;
    errorElement.classList.add("show");
  }

  function clearError(field, errorElement) {
    field.classList.remove("invalid");
    errorElement.textContent = "";
    errorElement.classList.remove("show");
  }

  function findUser(email, password) {
    const usersData = localStorage.getItem("users");
    if (!usersData) return null;
    try {
      const users = JSON.parse(usersData);
      return users.find(
        (user) => user.email === email && user.password === password,
      );
    } catch {
      return null;
    }
  }
const loginForm = document.getElementById("loginForm"); 

loginForm.addEventListener("submit", (e) => { 
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    clearError(emailInput, errorEmail);
    clearError(passwordInput, errorPassword);
    successMessage.textContent = "";

    let valid = true;

    if (!email) {
      showError(emailInput, errorEmail, "Please enter your email ...");
      valid = false;
    }

    if (!password) {
      showError(passwordInput, errorPassword, "Please enter your password ...");
      valid = false;
    }

    if (!valid) return;

    const user = findUser(email, password);
    if (!user) {
      showError(passwordInput, errorPassword, "Email hoặc mật khẩu không đúng");
      return;
    }

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("authUser", JSON.stringify(user));
    successMessage.textContent = "Sign In Successfully";
    successMessage.classList.add("show");

    setTimeout(() => {
      window.location.href = "./home.html";
    }, 700);
  });

  emailInput.addEventListener("input", () =>
    clearError(emailInput, errorEmail),
  );
  passwordInput.addEventListener("input", () =>
    clearError(passwordInput, errorPassword),
  );
});
