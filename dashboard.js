/* ================================
   FIREBASE IMPORTS (v12.6.0)
================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================================
   FIREBASE CONFIG (YOURS)
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyBYrk0pA2n36c-fk9NvpwJYw2mcTBYsAnc",
  authDomain: "maxima-6f4dc.firebaseapp.com",
  projectId: "maxima-6f4dc",
  storageBucket: "maxima-6f4dc.firebasestorage.app",
  messagingSenderId: "294387008300",
  appId: "1:294387008300:web:6b276d0689742576432289",
  measurementId: "G-D6W9MKN7PD"
};

/* ================================
   INIT
================================ */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================================
   DOM ELEMENTS (HTML MATCH)
================================ */
const displayName = document.getElementById("displayName");
const emailDisplaySimple = document.getElementById("emailDisplaySimple");
const emailInput = document.getElementById("emailInput");
const uidInput = document.getElementById("uidInput");
const phoneInput = document.getElementById("phoneInput");
const whatsappInput = document.getElementById("whatsappInput");
const profilePic = document.getElementById("profilePic");

const saveProfileBtn = document.getElementById("saveProfileBtn");
const saveProfileMsg = document.getElementById("saveProfileMsg");

const newPasswordInput = document.getElementById("newPasswordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const passwordMsg = document.getElementById("passwordMsg");

const ordersList = document.getElementById("ordersList");
const statusGrid = document.getElementById("statusGrid");

const editEmailLeftBtn = document.getElementById("editEmailLeftBtn");
const viewOrdersBtn = document.getElementById("viewOrdersBtn");
const viewAllOrdersBtn = document.getElementById("viewAllOrdersBtn");
const editProfileBtn = document.getElementById("editProfileBtn");

/* ================================
   LOGOUT BUTTON (NO HTML EDIT)
================================ */
function injectLogoutButton() {
  const profileCard = document.querySelector(".card.center");
  if (!profileCard || document.getElementById("logoutBtn")) return;

  const btn = document.createElement("button");
  btn.id = "logoutBtn";
  btn.textContent = "Logout";
  btn.className = "small";
  btn.style.background = "#d9534f";
  btn.style.marginTop = "10px";

  btn.onclick = async () => {
    await signOut(auth);
    window.location.href = "login.html";
  };

  profileCard.appendChild(btn);
}

/* ================================
   AUTH STATE
================================ */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  uidInput.value = user.uid;
  emailInput.value = user.email;

  const signupDate = new Date(user.metadata.creationTime).toLocaleDateString();

  emailDisplaySimple.innerHTML = `
    ${user.email}<br>
    <span class="muted">Joined: ${signupDate}</span>
  `;

  injectLogoutButton();
  await loadUserProfile(user);
  await loadCheckout(user.uid);
});

/* ================================
   LOAD SIGN-UP PROFILE
================================ */
async function loadUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const d = snap.data();
    displayName.textContent = d.name || user.displayName || "My Profile";
    phoneInput.value = d.phone || "";
    whatsappInput.value = d.whatsapp || "";
    profilePic.src = d.photoURL || user.photoURL || "/img/image.png";
  } else {
    await setDoc(ref, {
      name: user.displayName || "",
      email: user.email,
      createdAt: user.metadata.creationTime
    });
    displayName.textContent = user.displayName || "My Profile";
  }
}

/* ================================
   SAVE PROFILE
================================ */
saveProfileBtn.onclick = async () => {
  try {
    await setDoc(
      doc(db, "users", auth.currentUser.uid),
      {
        phone: phoneInput.value.trim(),
        whatsapp: whatsappInput.value.trim()
      },
      { merge: true }
    );
    saveProfileMsg.textContent = "Saved ✔";
    setTimeout(() => (saveProfileMsg.textContent = ""), 2000);
  } catch (e) {
    saveProfileMsg.textContent = e.message;
  }
};

/* ================================
   UPDATE PASSWORD
================================ */
changePasswordBtn.onclick = async () => {
  if (newPasswordInput.value.length < 6) {
    passwordMsg.textContent = "Minimum 6 characters";
    return;
  }
  if (newPasswordInput.value !== confirmPasswordInput.value) {
    passwordMsg.textContent = "Passwords do not match";
    return;
  }

  try {
    await updatePassword(auth.currentUser, newPasswordInput.value);
    passwordMsg.textContent = "Password updated ✔";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";
  } catch (e) {
    passwordMsg.textContent = e.message;
  }
};

/* ================================
   UPDATE EMAIL
================================ */
editEmailLeftBtn.onclick = async () => {
  const user = auth.currentUser;
  const newEmail = prompt("Enter new email", user.email);
  if (!newEmail) return;

  await updateEmail(user, newEmail);
  emailInput.value = newEmail;

  emailDisplaySimple.innerHTML = `
    ${newEmail}<br>
    <span class="muted">Updated</span>
  `;

  await setDoc(doc(db, "users", user.uid), { email: newEmail }, { merge: true });
};

/* ================================
   LOAD CHECKOUT DATA
================================ */
async function loadCheckout(uid) {
  const q = query(collection(db, "checkout"), where("userId", "==", uid));
  const snap = await getDocs(q);

  const items = [];
  snap.forEach(doc => items.push(doc.data()));

  renderStatusGrid(items);
  renderRecent(items);
}

/* ================================
   STATUS GRID
================================ */
function renderStatusGrid(items) {
  const stats = { Pending: 0, Processing: 0, Delivered: 0, Cancelled: 0 };

  items.forEach(i => {
    if (stats[i.status] !== undefined) stats[i.status]++;
  });

  statusGrid.innerHTML = "";
  Object.entries(stats).forEach(([k, v]) => {
    statusGrid.innerHTML += `
      <div class="status-card">
        <span class="muted">${k}</span>
        <strong>${v}</strong>
      </div>
    `;
  });
}

/* ================================
   RECENT CHECKOUT
================================ */
function renderRecent(items) {
  ordersList.innerHTML = "";

  if (items.length === 0) {
    ordersList.innerHTML = `<p class="muted">No checkout history</p>`;
    return;
  }

  items.slice(0, 3).forEach(i => {
    ordersList.innerHTML += `
      <div class="order-item">
        <div>
          <strong>${i.checkoutId || "Checkout"}</strong>
          <div class="muted">${i.status}</div>
        </div>
        <div>KES ${Number(i.total || 0).toLocaleString()}</div>
      </div>
    `;
  });
}

/* ================================
   NAVIGATION
================================ */
viewOrdersBtn.onclick = () => (window.location.href = "checkout.html");
viewAllOrdersBtn.onclick = () => (window.location.href = "checkout.html");
editProfileBtn.onclick = () => phoneInput.focus();



