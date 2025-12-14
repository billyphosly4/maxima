/* M-Pesa Simulation Page
   - Accepts ?checkoutId=... as the primary source of truth
   - Optionally reads Firestore doc if ?docId=... exists
   - Falls back safely without throwing "Missing order id"
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

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyBYrk0pA2n36c-fk9NvpwJYw2mcTBYsAnc",
  authDomain: "maxima-6f4dc.firebaseapp.com",
  projectId: "maxima-6f4dc",
  storageBucket: "maxima-6f4dc.firebasestorage.app",
  messagingSenderId: "294387008300",
  appId: "1:294387008300:web:6b276d0689742576432289"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= UI ELEMENTS ================= */
const infoEl = document.getElementById('info');
const orderDetailsEl = document.getElementById('orderDetails');
const payPhoneEl = document.getElementById('payPhone');
const payBtn = document.getElementById('payBtn');
const failBtn = document.getElementById('failBtn');
const backBtn = document.getElementById('backBtn');
const receiptEl = document.getElementById('receipt');

/* ================= URL PARAMS ================= */
const params = new URLSearchParams(window.location.search);
let checkoutId = params.get('checkoutId');
const docId = params.get('docId');

/* ================= STATE ================= */
let checkoutDoc = null;
let localOnly = false;

/* ================= AUTH ================= */
onAuthStateChanged(auth, () => loadOrder());

/* ================= LOAD ORDER ================= */
async function loadOrder() {
  if (!checkoutId) {
    try {
      const pending = JSON.parse(localStorage.getItem('pendingOrder'));
      if (pending?.checkoutId) checkoutId = pending.checkoutId;
    } catch {}
  }

  if (checkoutId && docId) {
    try {
      const snap = await getDoc(doc(db, 'checkout', docId));
      if (snap.exists()) {
        checkoutDoc = { id: snap.id, ...snap.data() };
        renderOrder(checkoutDoc);
        return;
      }
    } catch {}
  }

  try {
    const pending = JSON.parse(localStorage.getItem('pendingOrder'));
    if (pending?.checkoutId === checkoutId) {
      checkoutDoc = { id: pending.checkoutId, ...pending };
      localOnly = true;
      renderOrder(checkoutDoc);
      return;
    }
  } catch {}

  checkoutDoc = {
    checkoutId: checkoutId || 'LOCAL-' + Date.now(),
    items: [],
    total: 0,
    status: 'Pending',
    customerName: 'Guest'
  };
  localOnly = true;
  renderOrder(checkoutDoc);
}

/* ================= RENDER ================= */
function renderOrder(order) {
  infoEl.textContent = `Order ${order.checkoutId} — Status: ${order.status}`;

  let html = `<div class="muted">Customer: ${order.customerName || 'Guest'}</div><hr/>`;

  order.items.forEach(it => {
    const price = Number(it.price || 0);
    const qty = Number(it.quantity || 1);
    html += `
      <div class="item">
        <img class="thumb" src="${it.image || 'img/image.png'}"/>
        <div>
          <strong>${it.name}</strong>
          <div class="muted">x${qty} @ KES ${price}</div>
        </div>
        <div style="margin-left:auto"><strong>KES ${price * qty}</strong></div>
      </div>`;
  });

  html += `<div style="text-align:right"><strong>Total: KES ${order.total}</strong></div>`;
  orderDetailsEl.innerHTML = html;

  payBtn.onclick = () => simulatePayment(true);
  failBtn.onclick = () => simulatePayment(false);
  backBtn.onclick = () => location.href = 'checkout.html';
}

/* ================= PAYMENT ================= */
async function simulatePayment(success) {
  if (!success) {
    receiptEl.innerHTML = `<div style="color:red">Payment failed</div>`;
    return;
  }

  const phone = payPhoneEl.value.trim();
  if (!phone) return alert('Enter M-Pesa phone number');

  if (!localOnly && docId) {
    try {
      await updateDoc(doc(db, 'checkout', docId), {
        status: 'Paid',
        paidAt: serverTimestamp(),
        paidPhone: phone
      });
    } catch {}
  }

  const receiptNo = 'MP' + Math.floor(Math.random() * 1e9);
  const paidDate = new Date().toLocaleString();

  receiptEl.innerHTML = `
<div id="receiptBox" style="max-width:420px;margin:20px auto;padding:20px;border:1px solid #ddd;border-radius:12px;background:#fff;font-family:Segoe UI,Roboto,Arial,sans-serif">

  <div style="text-align:center">
    <img src="img/logo.png" style="height:48px"/>
    <h2 style="margin:6px 0;color:#1b5e20">MAXIMA STORES</h2>
    <div style="font-size:13px;color:#666">Quality Furniture • Electronics • Home Essentials</div>
  </div>

  <hr/>

  <div style="font-size:14px">
    <div><strong>Receipt No:</strong> ${receiptNo}</div>
    <div><strong>Order ID:</strong> ${checkoutDoc.checkoutId}</div>
    <div><strong>Date:</strong> ${paidDate}</div>
    <div><strong>M-Pesa Phone:</strong> ${phone}</div>
    <div><strong>Status:</strong> <span style="color:#1b5e20">PAID</span></div>
  </div>

  <hr/>

  ${checkoutDoc.items.map(it => `
    <div style="display:flex;justify-content:space-between">
      <span>${it.name} × ${it.quantity || 1}</span>
      <strong>KES ${it.price * (it.quantity || 1)}</strong>
    </div>`).join('')}

  <hr/>

  <div style="display:flex;justify-content:space-between;font-size:16px">
    <strong>Total Paid</strong>
    <strong>KES ${checkoutDoc.total}</strong>
  </div>

  <div style="margin-top:12px;text-align:center;font-size:12px;color:#555">
    Thank you for shopping with <strong>MAXIMA STORES</strong><br/>
    📍 Kenya | 📞 0117345789
  </div>

  <div style="margin-top:14px;display:flex;justify-content:space-between">
    <span>Authorized Signature</span>
    <img id="sigPreview" style="height:40px"/>
  </div>

  <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
    <button style="background:#1b5e20;color:#fff;border:none;padding:8px 12px;border-radius:6px" onclick="downloadPDF()">Print</button>
    <button style="background:#1b5e20;color:#fff;border:none;padding:8px 12px;border-radius:6px" onclick="openSignature()">Sign</button>
    <button style="background:#1b5e20;color:#fff;border:none;padding:8px 12px;border-radius:6px" onclick="downloadPDF()">PDF</button>
    <button style="background:#1b5e20;color:#fff;border:none;padding:8px 12px;border-radius:6px" onclick="sendWhatsApp()">WhatsApp</button>
  </div>
</div>`;
}

/* ================= SIGNATURE ================= */
const modal = document.getElementById('signatureModal');
const canvas = document.getElementById('signaturePad');
const ctx = canvas?.getContext('2d');
let drawing = false;

function pos(e) {
  const r = canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : e;
  return { x: t.clientX - r.left, y: t.clientY - r.top };
}

canvas?.addEventListener('mousedown', e => { drawing = true; ctx.beginPath(); const p = pos(e); ctx.moveTo(p.x, p.y); });
canvas?.addEventListener('mousemove', e => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
canvas?.addEventListener('mouseup', () => drawing = false);
canvas?.addEventListener('touchstart', e => { drawing = true; ctx.beginPath(); const p = pos(e); ctx.moveTo(p.x, p.y); });
canvas?.addEventListener('touchmove', e => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
canvas?.addEventListener('touchend', () => drawing = false);

window.openSignature = () => modal.style.display = 'flex';
window.closeSignature = () => modal.style.display = 'none';
window.saveSignature = () => {
  document.getElementById('sigPreview').src = canvas.toDataURL();
  modal.style.display = 'none';
};

/* ================= PDF / PRINT ================= */
window.downloadPDF = () => {
  const box = document.getElementById('receiptBox');
  const w = window.open('', '', 'width=800,height=1000');
  w.document.write(`<style>@page{margin:10mm}*{page-break-inside:avoid}</style>${box.outerHTML}`);
  w.document.close();
  w.print();
};

window.sendWhatsApp = () => {
  const msg = `MAXIMA STORES\nOrder: ${checkoutDoc.checkoutId}\nTotal: KES ${checkoutDoc.total}\nStatus: PAID`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
};
