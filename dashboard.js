// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Your Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBYrk0pA2n36c-fk9NvpwJYw2mcTBYsAnc",
    authDomain: "maxima-6f4dc.firebaseapp.com",
    projectId: "maxima-6f4dc",
    storageBucket: "maxima-6f4dc.firebasestorage.app",
    messagingSenderId: "294387008300",
    appId: "1:294387008300:web:6b276d0689742576432289",
    measurementId: "G-D6W9MKN7PD"
};

// Init App + Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const emailElement = document.getElementById("email");
const userIdElement = document.getElementById("userid");
const profilePicElement = document.getElementById("profilePic");

// Detect user state
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Show email + UID
        emailElement.textContent = user.email;
        userIdElement.textContent = user.uid;

        // Profile picture (if exists)
        if (user.photoURL) {
            profilePicElement.src = user.photoURL;
        } else {
            profilePicElement.src = "/img/image.png"; // default pic
        }
    } else {
        // If NOT logged in → redirect to login page
        window.location.href = "login.html";
    }
});

// LOGOUT BUTTON
document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            window.location.href = "login.html";
        })
        .catch((error) => {
            alert("Logout failed: " + error.message);
        });
});
