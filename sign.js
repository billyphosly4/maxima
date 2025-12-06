import { createUserWithEmailAndPassword }
from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const form = document.getElementById("signupForm");

form.addEventListener("submit", (e) => {
    e.preventDefault(); // stop page reload

    const fullName = document.getElementById("fullName").value;
    const username = document.getElementById("username").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    const confirmPass = document.getElementById("confirmPassword").value;
    const agree = document.getElementById("agree").checked;

    if (!agree) {
        alert("You must agree to continue");
        return;
    }

    if (pass !== confirmPass) {
        alert("Passwords do not match");
        return;
    }

    createUserWithEmailAndPassword(auth, email, pass)
        .then(() => {
            alert("Signup successful!");
            window.location.href = "login.html";
        })
        .catch((error) => {
            alert(error.message);
        });
});
