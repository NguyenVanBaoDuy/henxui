// CONFIG
const ADMIN_NAME = "Nguyễn Văn Bảo Duy";
const ADMIN_PASS = "baoduy2012";
const ADMIN_ID = 999;
const ADMIN_BALANCE = 10000000;

// Helpers
function getData() {
  return JSON.parse(localStorage.getItem("rongGame") || "{}");
}

function saveData(data) {
  localStorage.setItem("rongGame", JSON.stringify(data));
}

// Tự động tạo / fix admin
function initAdmin() {
  let data = getData();
  if (!data[ADMIN_NAME]) {
    data[ADMIN_NAME] = {
      id: ADMIN_ID,
      pass: ADMIN_PASS,
      balance: ADMIN_BALANCE,
      banned: false,
      role: "admin",
    };
  } else if (data[ADMIN_NAME].balance === 0) {
    data[ADMIN_NAME].balance = ADMIN_BALANCE;
  }
  saveData(data);
}

// Register - CHO PHÉP TẠO VÔ HẠN ACCOUNT
function register() {
  const username = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value;
  const msg = document.getElementById("msg");

  if (!username || !password) {
    msg.textContent = "Nhập username và password";
    msg.style.color = "orange";
    return;
  }

  let data = getData();

  if (data[username]) {
    msg.textContent = "Username đã tồn tại";
    msg.style.color = "orange";
    return;
  }

  // ────────────────────────────────────────────────
  // ĐÃ XÓA GIỚI HẠN → TẠO THOẢI MÁI
  // ────────────────────────────────────────────────

  let maxId = 1000;
  Object.values(data).forEach((u) => {
    if (u.id > maxId) maxId = u.id;
  });
  const newId = maxId + 1;

  data[username] = {
    id: newId,
    pass: password,
    balance: 10000,
    banned: false,
    role: "player",
  };

  saveData(data);

  msg.textContent = `Đăng ký thành công! ID: ${newId}. Đăng nhập ngay.`;
  msg.style.color = "#0f0";
}

// Login
function login() {
  const username = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value;
  const msg = document.getElementById("msg");

  if (!username || !password) {
    msg.textContent = "Nhập username và password";
    msg.style.color = "orange";
    return;
  }

  const data = getData();
  const user = data[username];

  if (!user || user.pass !== password) {
    msg.textContent = "Sai username hoặc password";
    msg.style.color = "red";
    return;
  }

  if (user.banned) {
    msg.textContent = "Tài khoản bị khóa";
    msg.style.color = "red";
    return;
  }

  localStorage.setItem("currentUser", username);
  document.getElementById("auth").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  document.querySelector("#welcome span").textContent =
    username + " (ID: " + user.id + ")";

  document.getElementById("bal").textContent =
    `Số dư: ${user.balance.toLocaleString()} VND`;

  if (user.role === "admin") {
    document.getElementById("adminPanel").classList.remove("hidden");
    loadPlayerList();
  }

  msg.textContent = "";
}

// Bet
function bet() {
  const current = localStorage.getItem("currentUser");
  if (!current) return alert("Vui lòng đăng nhập lại");

  const data = getData();
  const user = data[current];
  const amount = parseInt(document.getElementById("bet").value) || 0;

  if (amount < 1000 || amount > user.balance || isNaN(amount)) {
    alert("Cược không hợp lệ: ≥1000 và ≤ số dư!");
    return;
  }

  if (
    amount > user.balance * 0.5 &&
    !confirm(`Cược lớn (${amount.toLocaleString()} VND). Xác nhận?`)
  ) {
    return;
  }

  user.balance -= amount;
  saveData(data);
  document.getElementById("bal").textContent =
    `Số dư: ${user.balance.toLocaleString()} VND`;

  const win = Math.random() < 0.5;
  const selectedSide = document.getElementById("side").value;
  const winner = win
    ? selectedSide === "dong"
      ? "Đông"
      : "Tây"
    : selectedSide === "dong"
      ? "Tây"
      : "Đông";

  const res = document.getElementById("res");

  if (win) {
    user.balance += amount * 2; // hoàn vốn + thắng bằng vốn → tổng +amount
    saveData(data);
    document.getElementById("bal").textContent =
      `Số dư: ${user.balance.toLocaleString()} VND`;
    res.innerHTML = `Rồng ${winner} thắng! +${amount.toLocaleString()} 🎉`;
    res.style.color = "#0f0";
  } else {
    res.innerHTML = `Rồng ${winner} thắng! -${amount.toLocaleString()} 😢`;
    res.style.color = "#f44";
  }

  document.getElementById("bet").value = "";
}

// Load danh sách người chơi
function loadPlayerList() {
  const data = getData();
  const ul = document.getElementById("plist");
  ul.innerHTML = "";

  Object.entries(data).forEach(([name, u]) => {
    const li = document.createElement("li");
    li.innerHTML = `ID: ${u.id} | ${name} | ${u.balance.toLocaleString()} VND ${u.banned ? "(BANNED)" : ""} ${u.role === "admin" ? "(ADMIN)" : ""}`;
    ul.appendChild(li);
  });
}

// Admin actions - Tự động reload sau khi thay đổi
function admin(type) {
  const idInput = document.getElementById("tid");
  const id = parseInt(idInput.value);
  if (!id) return alert("Nhập ID người chơi!");

  const data = getData();
  let targetName = null;
  let target = null;

  Object.entries(data).forEach(([name, u]) => {
    if (u.id === id) {
      targetName = name;
      target = u;
    }
  });

  if (!target) return alert("Không tìm thấy người dùng với ID này!");

  if (type === "find") {
    document.getElementById("ainfo").textContent =
      `${targetName} (ID: ${target.id}) - Số dư: ${target.balance.toLocaleString()} VND - ${target.banned ? "BANNED" : "OK"} ${target.role === "admin" ? "(ADMIN)" : ""}`;
    return;
  }

  if (type === "add" || type === "sub") {
    const amt = parseInt(prompt("Số tiền:"));
    if (isNaN(amt) || amt <= 0) return alert("Số tiền không hợp lệ!");

    if (type === "add") target.balance += amt;
    else target.balance = Math.max(0, target.balance - amt);

    saveData(data);
    alert("Đã cập nhật số dư!");
  } else if (type === "ban" || type === "unban") {
    if (target.role === "admin") return alert("Không thể ban/unban admin!");
    target.banned = type === "ban";
    saveData(data);
    alert(type === "ban" ? "Đã BAN!" : "Đã UNBAN!");
  } else if (type === "transfer") {
    if (target.role === "admin") return alert("Người này đã là admin!");
    if (
      !confirm(
        `Chuyển quyền ADMIN cho ${targetName} (ID ${target.id})?\nBạn sẽ mất quyền admin!`,
      )
    )
      return;

    data[targetName].role = "admin";
    data[ADMIN_NAME].role = "player";
    saveData(data);
    alert("Chuyển admin thành công! Đang reload...");
    location.reload();
    return;
  } else if (type === "reset") {
    if (target.role === "admin") return alert("Không thể reset admin!");
    if (!confirm(`Xóa hoàn toàn người chơi ${targetName} (ID ${target.id})?`))
      return;

    delete data[targetName];
    saveData(data);
    alert("Đã reset player!");
  }

  // Tự động reload sau mọi hành động thay đổi (trừ find)
  if (type !== "find") {
    loadPlayerList(); // cập nhật list ngay
    setTimeout(() => location.reload(), 800); // reload sau 0.8s để thấy thông báo
  }
}

// Logout
function logout() {
  localStorage.removeItem("currentUser");
  location.reload();
}

// Load trang
window.onload = function () {
  initAdmin();

  const current = localStorage.getItem("currentUser");
  if (current) {
    const data = getData();
    const user = data[current];
    if (user) {
      document.getElementById("auth").classList.add("hidden");
      document.getElementById("game").classList.remove("hidden");

      document.querySelector("#welcome span").textContent =
        current + " (ID: " + user.id + ")";

      document.getElementById("bal").textContent =
        `Số dư: ${user.balance.toLocaleString()} VND`;

      if (user.role === "admin") {
        document.getElementById("adminPanel").classList.remove("hidden");
        loadPlayerList();
      }
    }
  }
};
