// signup.js - robust version that works whether firebase was initialized in HTML or not

// Your Firebase config (keep this synced with your project settings)
const firebaseConfig = {
    apiKey: "AIzaSyBYrk0pA2n36c-fk9NvpwJYw2mcTBYsAnc",
    authDomain: "maxima-6f4dc.firebaseapp.com",
    projectId: "maxima-6f4dc",
    // use the normal appspot domain (verify in console). change if different.
    storageBucket: "maxima-6f4dc.appspot.com",
    messagingSenderId: "294387008300",
    appId: "1:294387008300:web:6b276d0689742576432289",
    measurementId: "G-D6W9MKN7PD"
};

// Helper to initialize firebase locally if needed
async function ensureFirebase() {
    // If HTML already exposed auth + function, use it.
    if (window.auth && window.createUserWithEmailAndPassword) {
        return { auth: window.auth, createUserWithEmailAndPassword: window.createUserWithEmailAndPassword };
    }

    // Otherwise, import and initialize firebase here
    try {
        const [{ initializeApp }, { getAuth, createUserWithEmailAndPassword }] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js")
        ]);

        // Avoid double initialization: try to read existing app if any
        // In v12 there is getApp / getApps but dynamic import approach keeps it simple:
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);

        // expose for other scripts (optional)
        window.auth = auth;
        window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;

        return { auth, createUserWithEmailAndPassword };
    } catch (err) {
        console.error("Firebase dynamic import/init failed:", err);
        throw err;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;

        const fullName = document.getElementById("fullName").value.trim();
        const username = document.getElementById("username").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const email = document.getElementById("email").value.trim();
        const pass = document.getElementById("password").value;
        const confirmPass = document.getElementById("confirmPassword").value;
        const agree = document.getElementById("agree").checked;

        // Basic validation
        if (!agree) {
            alert("You must agree to the terms to continue.");
            submitBtn.disabled = false;
            return;
        }
        if (!email) {
            alert("Please enter an email address.");
            submitBtn.disabled = false;
            return;
        }
        if (pass.length < 6) {
            alert("Password must be at least 6 characters.");
            submitBtn.disabled = false;
            return;
        }
        if (pass !== confirmPass) {
            alert("Passwords do not match.");
            submitBtn.disabled = false;
            return;
        }

        try {
            const { auth, createUserWithEmailAndPassword } = await ensureFirebase();

            // create user
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            // user created
            console.log("User created:", userCredential);

            // OPTIONAL: you can save extra profile data (fullName/phone/username) in Firestore here
            // (not included to keep this file minimal)

            alert("Signup successful!");
            // redirect
            window.location.href = "login.html";
        } catch (error) {
            // Show both code & message for clearer debugging
            console.error("Signup error:", error);
            const code = error?.code || "unknown/error";
            const msg = error?.message || String(error);
            alert(`Signup failed (${code}): ${msg}`);
        } finally {
            submitBtn.disabled = false;
        }
    });
});


