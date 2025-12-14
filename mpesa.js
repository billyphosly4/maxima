/* M-Pesa Simulation Page
   - Reads ?docId=<firestoreDocId> from URL
   - Loads checkout document, displays items & totals
   - Simulates payment success/failure; on success updates checkout doc (status=Paid)
   - Generates a printable receipt and clears local cart
*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase config (same as checkout.js)
const firebaseConfig = {
  apiKey: "AIzaSyBYrk0pA2n36c-fk9NvpwJYw2mcTBYsAnc",
  authDomain: "maxima-6f4dc.firebaseapp.com",
  projectId: "maxima-6f4dc",
  storageBucket: "maxima-6f4dc.firebasestorage.app",
  messagingSenderId: "294387008300",
  appId: "1:294387008300:web:6b276d0689742576432289",
  measurementId: "G-D6W9MKN7PD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Shop details for receipts
const SHOP_NAME = "Maxima";
const SHOP_ADDRESS = "123 Market St, Kakamega, Kenya";
const SHOP_LOGO = "img/logo.png";
const SHOP_COLOR = "#3c3f99";
const SHOP_WEBSITE = "https://maxima-shopping-com.vercel.app/";
const SHOP_EMAIL = "info@maximal-shop.com";
const SHOP_PHONE = "+25417345789";
// Authorized signature (company)
const SHOP_AUTH_SIGNATURE = "img/auth-signature.png"; // put your authorized signature image here

let currentUser = null;

const infoEl = document.getElementById('info');
const orderDetailsEl = document.getElementById('orderDetails');
const payPhoneEl = document.getElementById('payPhone');
const payBtn = document.getElementById('payBtn');
const failBtn = document.getElementById('failBtn');
const backBtn = document.getElementById('backBtn');
const receiptEl = document.getElementById('receipt');

// get docId or checkoutId from query; allow fallback to local pending order in localStorage
const params = new URLSearchParams(window.location.search);
const docId = params.get('docId');
const checkoutIdParam = params.get('checkoutId');
let checkoutDoc = null;
let localOnly = false;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  loadOrder();
});

async function loadOrder() {
  // prefer Firestore doc id if present
  if (docId) {
    const dref = doc(db, 'checkout', docId);
    const snap = await getDoc(dref);
    if (!snap.exists()) {
      infoEl.textContent = 'Order not found.';
      return;
    }
    checkoutDoc = { id: snap.id, ...snap.data() };

    // if order is not a guest order, require the owner to be logged in
    if (checkoutDoc.userId && checkoutDoc.userId !== 'guest' && (!currentUser || currentUser.uid !== checkoutDoc.userId)) {
      infoEl.innerHTML = 'Please <a href="login.html">log in</a> with the account that placed this order to complete payment.';
      return;
    }
  } else {
    // fallback to local pending order
    const pendingRaw = localStorage.getItem('pendingOrder');
    const pendingDocId = localStorage.getItem('pendingOrderDocId');
    if (pendingRaw) {
      const pending = JSON.parse(pendingRaw);
      // if checkoutId param provided, ensure it matches
      if (checkoutIdParam && pending.checkoutId !== checkoutIdParam) {
        infoEl.textContent = 'Order not found.';
        return;
      }
      checkoutDoc = { id: pending.checkoutId, ...pending };
      localOnly = !pendingDocId;
    } else {
      infoEl.textContent = 'Missing order id.';
      return;
    }
  }

  renderOrder(checkoutDoc);
}

function renderOrder(order) {
  infoEl.textContent = `Order ${order.checkoutId} — Status: ${order.status}`;

  let html = '';
  html += `<div class="muted">Customer: ${order.customerName || order.email}</div>`;
  if (order.customerPhone) html += `<div class="muted">Phone: ${order.customerPhone}</div>`;
  if (order.customerAddress) html += `<div class="muted">Address: ${order.customerAddress}</div>`;

  html += '<hr />';
  order.items.forEach(it => {
    const price = Number(it.price || 0);
    const qty = Number(it.quantity || it.qty || 1);
    html += `<div class="item"><img class="thumb" src="${it.image || 'img/image.png'}" /><div><strong>${it.name}</strong><div class="muted">x${qty} @ KES ${price.toLocaleString()}</div></div><div style="margin-left:auto"><strong>KES ${(price*qty).toLocaleString()}</strong></div></div>`;
  });

  html += `<div style="text-align:right;margin-top:10px"><strong>Total: KES ${Number(order.total).toLocaleString()}</strong></div>`;
  orderDetailsEl.innerHTML = html;

  // prefill phone if available
  if (order.mpesaPhone) payPhoneEl.value = order.mpesaPhone;
  else if (order.customerPhone) payPhoneEl.value = order.customerPhone;

  // attach handlers
  payBtn.onclick = () => simulatePayment(true);
  failBtn.onclick = () => simulatePayment(false);
  backBtn.onclick = () => window.location.href = 'checkout.html';
}

async function simulatePayment(success) {
  if (!checkoutDoc) return;
  const phone = payPhoneEl.value.trim();
  if (!phone) return alert('Enter M-Pesa phone number');

  if (!success) {
    receiptEl.innerHTML = `<div style="padding:12px;border-radius:8px;background:#fff;border:1px solid #f5c6cb;color:#721c24">Payment failed (simulated).</div>`;
    return;
  }

  if (!localOnly) {
    // update Firestore document: mark as Paid
    try {
      const dref = doc(db, 'checkout', checkoutDoc.id);
      await updateDoc(dref, {
        status: 'Paid',
        paidAt: serverTimestamp(),
        paidPhone: phone
      });
    } catch (err) {
      console.warn('Failed to update server doc, falling back to local receipt', err);
      localOnly = true;
    }
  }

  // generate receipt in page
  generateReceipt(checkoutDoc, phone);

  // clear cart and pending order now that payment is done
  localStorage.removeItem('cart');
  localStorage.removeItem('pendingOrder');
  localStorage.removeItem('pendingOrderDocId');
}

function generateReceipt(order, phone) {
  const savedSig = localStorage.getItem('userSignature');
  // build table rows
  let rows = '';
  order.items.forEach(it => {
    const price = Number(it.price || 0);
    const qty = Number(it.quantity || it.qty || 1);
    rows += `<tr><td style="padding:8px;border-bottom:1px solid #eee">${it.name}</td><td style="padding:8px;border-bottom:1px solid #eee">${qty}</td><td style="padding:8px;border-bottom:1px solid #eee">KES ${price.toLocaleString()}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">KES ${(price*qty).toLocaleString()}</td></tr>`;
  });

  const paidHtml = `
    <div style="font-family:Montserrat,Arial,Helvetica,sans-serif;max-width:720px;margin:12px auto;padding:12px;background:#fff;border-radius:6px;border:1px solid #eee;font-size:13px">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');
        @page { size: A4; margin: 10mm }
        body{font-family:Montserrat,Arial,Helvetica,sans-serif}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{padding:6px;border-bottom:1px solid #eee}
        .muted{color:#666;font-size:12px}
        .no-break{page-break-inside:avoid}
      </style>

      <div style="height:6px;background:${SHOP_COLOR};border-radius:4px;margin-bottom:8px"></div>
      <div style="display:flex;align-items:center;gap:12px">
        <img src="${SHOP_LOGO}" alt="logo" style="width:56px;height:56px;object-fit:contain" />
        <div>
          <div style="font-size:16px;font-weight:700;color:${SHOP_COLOR}">${SHOP_NAME}</div>
          <div class="muted">${SHOP_ADDRESS}</div>
          <div class="muted">${SHOP_WEBSITE} · ${SHOP_EMAIL} · ${SHOP_PHONE}</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div style="font-size:13px;font-weight:700">Receipt (Paid)</div>
          <div class="muted">${new Date().toLocaleString()}</div>
        </div>
      </div>

      <div style="margin-top:10px">
        <div class="muted">Order ID</div>
        <div style="font-weight:700">${order.checkoutId}</div>
      </div>

      <div style="margin-top:8px">
        <div class="muted">Customer</div>
        <div>${order.customerName || order.email} ${order.customerPhone ? `<div class="muted">${order.customerPhone}</div>` : ''}</div>
      </div>

      <table class="no-break" style="margin-top:10px">
        <thead><tr style="text-align:left;color:#666;font-size:12px"><th>Item</th><th style="width:48px">Qty</th><th style="width:90px">Unit</th><th style="text-align:right;width:110px">Total</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td></td><td></td><td style="font-weight:700;padding:6px">Grand Total</td><td style="text-align:right;font-weight:700;padding:6px">KES ${Number(order.total).toLocaleString()}</td></tr></tfoot>
      </table>

      <div style="margin-top:12px;display:flex;gap:8px;align-items:center"><button class="btn" onclick="window.print()" style="padding:8px 10px;border-radius:6px;background:${SHOP_COLOR};color:#fff;border:none;cursor:pointer">Print Receipt</button> <a href="checkout.html">Back to shop</a></div>

      <div style="margin-top:14px;padding-top:10px;border-top:1px dashed #e6e6e6;display:flex;gap:16px;align-items:flex-start;">
        <div style="flex:1">
          <div style="font-weight:700;margin-bottom:6px">Customer Signature</div>
          ${savedSig ? `<img src="${savedSig}" style="max-height:48px;border:1px solid #ddd;border-radius:6px" />` : `<div style="height:48px;border:1px solid #ddd;border-radius:6px;background:#fafafa"></div>`}
        </div>
        <div style="flex:1;text-align:right">
          <div style="font-weight:700;margin-bottom:6px">Authorized Signature</div>
        <p>MAXIMAL</p>
        </div>
      </div>

      <div style="text-align:center;margin-top:10px;color:#666;font-size:12px">Thank you for your purchase — ${SHOP_NAME}</div>
      <div style="text-align:center;margin-top:6px;color:${SHOP_COLOR};font-size:12px">${SHOP_WEBSITE} · ${SHOP_EMAIL} · ${SHOP_PHONE}</div>
    </div>
  `;

  receiptEl.innerHTML = paidHtml;
  infoEl.textContent = `Order ${order.checkoutId} — Status: Paid`;
}
