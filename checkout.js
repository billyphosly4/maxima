/* ================================
   FIREBASE IMPORTS
================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

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

// generate a PDF blob for an order using jsPDF
async function generateOrderPdfBlob({ items, total, customer }) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = 40;

  doc.setFontSize(18);
  doc.setTextColor(SHOP_COLOR || '#000');
  doc.text(SHOP_NAME, margin, y);
  doc.setFontSize(10);
  doc.setTextColor('#666');
  doc.text(`${SHOP_ADDRESS} | ${SHOP_WEBSITE} | ${SHOP_PHONE}`, margin, y + 16);
  y += 36;

  doc.setDrawColor(220);
  doc.line(margin, y, 595 - margin, y);
  y += 14;

  doc.setFontSize(12);
  doc.setTextColor('#000');
  doc.text(`Order for: ${customer.name || ''}`, margin, y);
  doc.text(`Phone: ${customer.phone || ''}`, 400, y);
  y += 18;

  // Table header
  doc.setFontSize(11);
  doc.text('Item', margin, y);
  doc.text('Qty', 350, y);
  doc.text('Unit', 420, y);
  doc.text('Total', 500, y, { align: 'right' });
  y += 8;
  doc.line(margin, y, 595 - margin, y);
  y += 12;

  // compute row height and font size so all items fit on one A4 page
  const pageHeight = 842; // pts for A4
  const footerReserve = 130; // space for totals/footer
  const baseRowHeight = 18;
  let rowHeight = baseRowHeight;
  let rowFontSize = 11;
  if ((items || []).length > 0) {
    const availableForRows = Math.max(80, pageHeight - y - footerReserve);
    rowHeight = Math.max(8, Math.floor(availableForRows / items.length));
    rowFontSize = Math.max(8, Math.floor(11 * (rowHeight / baseRowHeight)));
  }

  items.forEach(it => {
    const price = Number(it.price || 0);
    const qty = Number(it.quantity || it.qty || 1);
    doc.setFontSize(rowFontSize);
    // wrap long names if needed (simple truncation here to keep single page)
    const name = it.name.length > 60 ? it.name.slice(0, 57) + '...' : it.name;
    doc.text(name, margin, y);
    doc.text(String(qty), 350, y);
    doc.text(`KES ${price.toLocaleString()}`, 420, y);
    doc.text(`KES ${(price*qty).toLocaleString()}`, 500, y, { align: 'right' });
    y += rowHeight;
  });

  y += 8;
  doc.setFontSize(Math.max(10, rowFontSize + 1));
  doc.setFont(undefined, 'bold');
  doc.text('Grand Total', 420, y);
  doc.text(`KES ${total.toLocaleString()}`, 500, y, { align: 'right' });

  // include signature image if present (local only)
  const savedSig = localStorage.getItem('userSignature');
  if (savedSig) {
    try {
      let sigData = savedSig;
      if (!sigData.startsWith('data:')) {
        sigData = await fetchToDataUrl(sigData);
      }
      if (sigData) {
        try { doc.addImage(sigData, 'PNG', 420, y + 10, 120, 36); } catch (e) { console.warn('addImage failed', e); }
      }
    } catch (e) { console.warn('signature include failed', e); }
  }
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  const bottomY = Math.min(780, 842 - margin - 20);
  doc.text(`Thank you for shopping at ${SHOP_NAME}`, margin, bottomY);

  const blob = doc.output('blob');
  return blob;
}

/* ================================
   INIT
================================ */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================================
   CONFIG (WHERE TO PUT DETAILS)
   - Set your shop WhatsApp number below (international format, no +):
     e.g. const SHOP_WHATSAPP_NUMBER = "2547XXXXXXXX";
   - If you add a real M-Pesa integration later, put credentials here.
================================ */
const SHOP_WHATSAPP_NUMBER = "254117345789"; // <-- change this to your number
// Shop details for receipts: customize these values
const SHOP_NAME = "Maxima";
const SHOP_ADDRESS = "123 Market St, Nairobi";
const SHOP_LOGO = "img/logo.png"; // update to your logo path if available
const SHOP_COLOR = "#3c3f99"; // primary brand color
const SHOP_WEBSITE = "https://your-shop.example";
const SHOP_EMAIL = "info@your-shop.example";
const SHOP_PHONE = "+254700000000";
// Authorized signature (company)
const SHOP_AUTH_SIGNATURE = "img/auth-signature.png"; // put your authorized signature image here

/* ================================
   STATE
  // include authorized signature image (company) at bottom right
  try {
    if (SHOP_AUTH_SIGNATURE) {
      let authData = null;
      try {
        const r = await fetch(SHOP_AUTH_SIGNATURE);
        const b = await r.blob();
        authData = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(b); });
      } catch (e) { console.warn('Could not fetch authorized signature', e); }
      if (authData) {
        try { doc.addImage(authData, 'PNG', 420, (bottomY - 40), 120, 36); } catch (e) { console.warn('addImage(auth) failed', e); }
      }
    }
  } catch (e) { console.warn('include auth signature failed', e); }
================================ */
let currentUser = null;
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let total = 0;

/* ================================
   DOM
================================ */
const cartItemsEl = document.getElementById("cartItems");
const totalAmountEl = document.getElementById("totalAmount");
const receiptContainer = document.getElementById("receiptContainer");
// Customer detail inputs (added in checkout.html)
const customerNameEl = document.getElementById('customerName');
const customerPhoneEl = document.getElementById('customerPhone');
const customerAddressEl = document.getElementById('customerAddress');
// Signature elements (added in checkout.html)
const sigInput = document.getElementById('sigInput');
const sigPreview = document.getElementById('sigPreview');
const saveSigBtn = document.getElementById('saveSigBtn');
const removeSigBtn = document.getElementById('removeSigBtn');
// draw signature elements
const drawSigBtn = document.getElementById('drawSigBtn');
const drawArea = document.getElementById('drawArea');
const sigCanvas = document.getElementById('sigCanvas');
const saveDrawBtn = document.getElementById('saveDrawBtn');
const clearDrawBtn = document.getElementById('clearDrawBtn');
const closeDrawBtn = document.getElementById('closeDrawBtn');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const authMessageEl = document.getElementById('authMessage');

// disable styles for disabled buttons
const style = document.createElement('style');
style.textContent = '.btn[disabled]{opacity:.6;cursor:not-allowed}';
document.head.appendChild(style);

/* ================================
   AUTH
================================ */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    currentUser = null;
    if (authMessageEl) authMessageEl.innerHTML = 'You are not logged in. <a href="login.html">Log in</a> to place an order.';
    renderCart();
    return;
  }
  currentUser = user;
  if (authMessageEl) authMessageEl.textContent = '';
  renderCart();
});

// attach event listener to place order button (safer than inline handlers)
if (placeOrderBtn) {
  placeOrderBtn.addEventListener('click', () => {
    if (typeof window.placeOrder === 'function') window.placeOrder();
  });
}

// ensure cart shows up on initial page load even before auth state resolves
renderCart();
// load saved signature preview
function loadSavedSignature() {
  const src = localStorage.getItem('userSignature');
  if (!sigPreview) return;
  sigPreview.innerHTML = '';
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.style.maxHeight = '48px';
    img.style.border = '1px solid #ddd';
    img.style.borderRadius = '6px';
    sigPreview.appendChild(img);
    // update draw buttons to indicate signature exists
    if (typeof drawSigBtn !== 'undefined' && drawSigBtn) drawSigBtn.textContent = 'Edit Signature';
    if (typeof drawPersistentBtn !== 'undefined' && drawPersistentBtn) { drawPersistentBtn.textContent = '✓'; drawPersistentBtn.style.background = '#28a745'; }
  }
  else {
    if (typeof drawSigBtn !== 'undefined' && drawSigBtn) drawSigBtn.textContent = 'Draw Signature';
    if (typeof drawPersistentBtn !== 'undefined' && drawPersistentBtn) { drawPersistentBtn.textContent = '✍'; drawPersistentBtn.style.background = '#3c3f99'; }
  }
}
loadSavedSignature();

// convert remote URL to dataURL
async function fetchToDataUrl(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((res2, rej) => {
      const fr = new FileReader();
      fr.onload = () => res2(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  } catch (e) { console.warn('fetchToDataUrl failed', e); return null; }
}

// preview selected image
if (sigInput) {
  sigInput.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f || !sigPreview) return;
    const reader = new FileReader();
    reader.onload = () => {
      sigPreview.innerHTML = '';
      const img = document.createElement('img');
      img.src = reader.result;
      img.style.maxHeight = '48px';
      img.style.border = '1px solid #ddd';
      img.style.borderRadius = '6px';
      sigPreview.appendChild(img);
    };
    reader.readAsDataURL(f);
  });
}

// save signature locally and optionally upload to Firebase Storage
if (saveSigBtn) {
  saveSigBtn.addEventListener('click', async () => {
    const file = sigInput && sigInput.files && sigInput.files[0];
    if (!file) return alert('Choose an image file first');
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      try { localStorage.setItem('userSignature', dataUrl); } catch (e) { console.warn('could not store signature locally', e); }

      // save locally only (server upload removed)
      try { localStorage.setItem('userSignature', dataUrl); } catch (e) { console.warn('could not store signature locally', e); }
      alert('Signature saved locally');
      loadSavedSignature();
    };
    reader.readAsDataURL(file);
  });
}

if (removeSigBtn) {
  removeSigBtn.addEventListener('click', () => {
    if (!confirm('Remove signature?')) return;
    localStorage.removeItem('userSignature');
    if (sigPreview) sigPreview.innerHTML = '';
    loadSavedSignature();
    alert('Signature removed');
  });
}

// Drawing logic (pointer events for mouse + touch)
// allow persistent button to open same draw area
const drawPersistentBtn = document.getElementById('drawPersistentBtn');
if (drawPersistentBtn && drawArea) drawPersistentBtn.addEventListener('click', () => { drawArea.style.display = 'block'; sigCanvas.focus(); });

if (drawSigBtn && drawArea && sigCanvas) {
  const ctx = sigCanvas.getContext('2d');
  const rect = () => sigCanvas.getBoundingClientRect();
  let drawing = false;
  let lastX = 0, lastY = 0;

  // initialize canvas with white background
  function clearCanvas() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, sigCanvas.width, sigCanvas.height);
  }
  clearCanvas();

  function toCanvasPos(e) {
    const r = rect();
    const x = (e.clientX - r.left) * (sigCanvas.width / r.width);
    const y = (e.clientY - r.top) * (sigCanvas.height / r.height);
    return [x, y];
  }

  sigCanvas.addEventListener('pointerdown', (ev) => {
    drawing = true;
    sigCanvas.setPointerCapture(ev.pointerId);
    const [x, y] = toCanvasPos(ev);
    lastX = x; lastY = y;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
  });
  sigCanvas.addEventListener('pointermove', (ev) => {
    if (!drawing) return;
    const [x, y] = toCanvasPos(ev);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x; lastY = y;
  });
  sigCanvas.addEventListener('pointerup', (ev) => {
    drawing = false;
    try { sigCanvas.releasePointerCapture(ev.pointerId); } catch (e) {}
  });
  sigCanvas.addEventListener('pointercancel', () => { drawing = false; });

  drawSigBtn.addEventListener('click', () => { drawArea.style.display = 'block'; sigCanvas.focus(); });
  clearDrawBtn.addEventListener('click', () => { clearCanvas(); });
  closeDrawBtn.addEventListener('click', () => { drawArea.style.display = 'none'; });

  saveDrawBtn.addEventListener('click', async () => {
    const dataUrl = sigCanvas.toDataURL('image/png');
    try { localStorage.setItem('userSignature', dataUrl); } catch (e) { console.warn('could not store signature locally', e); }
    // update preview
    if (sigPreview) { sigPreview.innerHTML = ''; const img = document.createElement('img'); img.src = dataUrl; img.style.maxHeight='48px'; img.style.border='1px solid #ddd'; img.style.borderRadius='6px'; sigPreview.appendChild(img); }

    // save locally only (server upload removed)
    alert('Signature saved locally');
    drawArea.style.display = 'none';
    loadSavedSignature();
  });
}

// close draw area on Escape key
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawArea && drawArea.style.display === 'block') drawArea.style.display = 'none'; });

/* ================================
   RENDER CART
================================ */
function renderCart() {
  cartItemsEl.innerHTML = "";
  total = 0;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<p class="muted">Cart is empty</p>`;
    if (placeOrderBtn) placeOrderBtn.disabled = true;
    return;
  }

  cart.forEach(item => {
    const price = Number(item.price || 0);
    const qty = Number(item.quantity || item.qty || 1);
    total += price * qty;

    cartItemsEl.innerHTML += `
      <div class="item">
        <div class="left">
          <img class="thumb" src="${item.image || 'img/image.png'}" alt="${item.name}" />
          <div>
            <div>${item.name}</div>
            <div class="muted">x${qty} @ KES ${price.toLocaleString()}</div>
          </div>
        </div>
        <div>KES ${(price * qty).toLocaleString()}</div>
      </div>
    `;
  });

  totalAmountEl.textContent = total.toLocaleString();
  // allow guest checkout: button only disabled when cart is empty
  if (placeOrderBtn) placeOrderBtn.disabled = cart.length === 0;
}

/* ================================
   PLACE ORDER (M-PESA)
================================ */
window.placeOrder = async function () {
  // require customer signature (must be drawn & saved locally)
  const hasSig = !!localStorage.getItem('userSignature');
  if (!hasSig) {
    const openPad = confirm('You must draw and save your signature before placing an order. Open signature pad now?');
    if (openPad) {
      if (typeof drawArea !== 'undefined' && drawArea) {
        drawArea.style.display = 'block';
        sigCanvas && sigCanvas.focus && sigCanvas.focus();
      }
    }
    return; // prevent proceeding to M-Pesa until signature saved
  }
  if (!currentUser) {
    const proceedGuest = confirm('You are not logged in. Proceed as guest to complete payment via M-Pesa?');
    if (!proceedGuest) {
      window.location.href = 'login.html';
      return;
    }
    // continue as guest (user info will be taken from customer inputs)
  }

  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }
  // read customer details from inputs (these are optional but recommended)
  const customerName = (customerNameEl && customerNameEl.value.trim()) || currentUser.displayName || "";
  const customerPhone = (customerPhoneEl && customerPhoneEl.value.trim()) || "";
  const customerAddress = (customerAddressEl && customerAddressEl.value.trim()) || "";

  if (!customerName) {
    alert('Please enter your full name.');
    return;
  }

  if (!customerPhone) {
    alert('Please enter your phone number.');
    return;
  }

  const checkoutId = "CHK-" + Date.now();
  // create a local pending order so we can always redirect to mpesa.html immediately
  const pending = {
    checkoutId,
    userId: currentUser ? currentUser.uid : 'guest',
    email: currentUser ? currentUser.email : 'guest@local',
    customerName,
    customerPhone,
    customerAddress,
    items: cart,
    total,
    status: "Pending",
    paymentMethod: "M-Pesa",
    createdAt: new Date().toISOString()
  };
  localStorage.setItem('pendingOrder', JSON.stringify(pending));

  // attempt Firestore write in the background (do not block navigation)
  addDoc(collection(db, "checkout"), {
    ...pending,
    mpesaPhone: null,
    createdAt: serverTimestamp()
  }).then(docRef => {
    try { localStorage.setItem('pendingOrderDocId', docRef.id); } catch (e) {}
  }).catch(err => {
    console.warn('Firestore addDoc (background) failed, will use local pending order', err);
  });

  // redirect immediately to mpesa page using checkoutId; mpesa.js will pick up local pendingOrder
  alert("Redirecting to M-Pesa payment page...");
  window.location.href = `mpesa.html?checkoutId=${checkoutId}`;
};

/* ================================
   WHATSAPP ORDER
================================ */
window.orderViaWhatsApp = async function () {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  // build item list
  let lines = [];
  lines.push("Hello " + SHOP_NAME + " 👋", "I would like to place an order.", "");
  lines.push(`Email: ${currentUser ? currentUser.email : 'guest'}`);
  // include customer details if filled
  const custName = (customerNameEl && customerNameEl.value.trim()) || (currentUser ? currentUser.displayName : '') || "";
  const custPhone = (customerPhoneEl && customerPhoneEl.value.trim()) || "";
  const custAddress = (customerAddressEl && customerAddressEl.value.trim()) || "";
  if (custName) lines.push(`Customer: ${custName}`);
  if (custPhone) lines.push(`Phone: ${custPhone}`);
  if (custAddress) lines.push(`Address: ${custAddress}`);
  lines.push("Items:");
  cart.forEach(item => {
    const price = Number(item.price || 0);
    const qty = Number(item.quantity || item.qty || 1);
    lines.push(`${item.name} x${qty} - KES ${(price * qty).toLocaleString()}`);
  });
  lines.push("", `Total: KES ${total.toLocaleString()}`, "Payment: WhatsApp Order");

  // open a popup early to avoid popup blockers
  let popup = null;
  try { popup = window.open('about:blank', '_blank'); } catch (e) { popup = null; }

  // Prepare UI area
  const waPdfArea = document.getElementById('waPdfArea');
  waPdfArea.style.display = 'block';
  waPdfArea.innerHTML = '<div style="font-size:13px;color:#333">Preparing order PDF…</div>';

  // attempt to create PDF blob and an object URL for download
  let blobUrl = null;
  let uploadedPdfUrl = null;
  try {
    if (window.jspdf && window.jspdf.jsPDF) {
      const pdfBlob = await generateOrderPdfBlob({ items: cart, total, customer: { name: custName, phone: custPhone, email: currentUser ? currentUser.email : '' } });
      blobUrl = URL.createObjectURL(pdfBlob);

      // try uploading to Firebase Storage (best-effort)
      try {
        const storage = getStorage();
        const fileName = `orders/order-${Date.now()}.pdf`;
        const sref = storageRef(storage, fileName);
        await uploadBytes(sref, pdfBlob, { contentType: 'application/pdf' });
        uploadedPdfUrl = await getDownloadURL(sref);
      } catch (uploadErr) {
        console.warn('Upload failed; continuing with local PDF', uploadErr);
      }
    }
  } catch (err) {
    console.warn('PDF generation failed', err);
  }

  // Render buttons/links for user to download and send via WhatsApp
  const downloadHtml = blobUrl ? `<a href="${blobUrl}" download="order-${Date.now()}.pdf" style="padding:8px 10px;background:#fff;border:1px solid #ddd;border-radius:6px;margin-right:8px;">Download PDF</a>` : '';
  const sendText = `Hello ${SHOP_NAME}%0AI would like to place an order.%0AEmail: ${currentUser ? currentUser.email : 'guest'}%0A${custName ? 'Customer: ' + custName + '%0A' : ''}${custPhone ? 'Phone: ' + custPhone + '%0A' : ''}%0AItems:%0A${encodeURIComponent(cart.map(i=>`${i.name} x${i.quantity||i.qty||1} - KES ${((i.price||0)*(i.quantity||i.qty||1)).toLocaleString()}`).join('\n'))}%0A%0ATotal: KES ${total.toLocaleString()}%0A`;
  const sendUrlWithPdf = uploadedPdfUrl ? `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodeURIComponent(decodeURIComponent(sendText) + '\nPDF: ' + uploadedPdfUrl)}` : `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodeURIComponent(decodeURIComponent(sendText))}`;

  waPdfArea.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      ${downloadHtml}
      <button id="waSendBtn" style="padding:8px 12px;border-radius:6px;border:none;background:${SHOP_COLOR};color:#fff;cursor:pointer">Send via WhatsApp</button>
      <button id="waCancelBtn" style="padding:8px 10px;border-radius:6px;border:1px solid #ddd;background:#fff;">Cancel</button>
    </div>
    ${uploadedPdfUrl ? `<div style="margin-top:8px;font-size:13px;color:#666">Using uploaded PDF link.</div>` : (blobUrl ? `<div style="margin-top:8px;font-size:13px;color:#666">PDF ready locally. It will be attached as a download. Upload to server failed or not available.</div>` : `<div style="margin-top:8px;font-size:13px;color:#666">PDF not available; proceeding with text-only message.</div>`)}
  `;

  document.getElementById('waCancelBtn').onclick = () => {
    waPdfArea.style.display = 'none';
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  };

  document.getElementById('waSendBtn').onclick = () => {
    // open wa link in new tab
    window.open(sendUrlWithPdf, '_blank');
  };
};

/* ================================
   RECEIPT
================================ */
function generateReceipt(id, method, mpesaPhone = '', customer = {}) {
  // Build item rows
  let rows = "";
  cart.forEach(item => {
    const price = Number(item.price || 0);
    const qty = Number(item.quantity || item.qty || 1);
    rows += `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td><td style="padding:8px;border-bottom:1px solid #eee;">${qty}</td><td style="padding:8px;border-bottom:1px solid #eee;">KES ${price.toLocaleString()}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">KES ${(price*qty).toLocaleString()}</td></tr>`;
  });

  const html = `
    <div style="font-family:Montserrat,Arial,Helvetica,sans-serif;max-width:720px;margin:0 auto;padding:12px;background:#fff;border-radius:6px;border:1px solid #eee;font-size:13px">
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
          <div style="font-size:13px;font-weight:700">Receipt</div>
          <div class="muted">${new Date().toLocaleString()}</div>
        </div>
      </div>

      <div style="margin-top:10px;display:flex;gap:12px;flex-wrap:wrap">
        <div style="flex:1">
          <div class="muted">Order ID</div>
          <div style="font-weight:700">${id}</div>
        </div>
        <div style="flex:1">
          <div class="muted">Payment</div>
          <div style="font-weight:700">${method}${mpesaPhone ? ` (M-Pesa: ${mpesaPhone})` : ''}</div>
        </div>
        <div style="flex:1">
          <div class="muted">Status</div>
          <div style="font-weight:700" id="receipt-status">Pending</div>
        </div>
      </div>

      <div style="margin-top:10px">
        <div class="muted">Customer</div>
        <div>${customer.customerName || currentUser?.displayName || ''} ${customer.customerPhone ? `<div class="muted">${customer.customerPhone}</div>` : ''} ${customer.customerAddress ? `<div class="muted">${customer.customerAddress}</div>` : ''}</div>
      </div>

      <table class="no-break" style="margin-top:10px">
        <thead>
          <tr style="text-align:left;color:#666;font-size:12px"><th>Item</th><th style="width:48px">Qty</th><th style="width:90px">Unit</th><th style="text-align:right;width:110px">Total</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr class="total-row"><td></td><td></td><td style="font-weight:700;padding:6px">Grand Total</td><td style="text-align:right;font-weight:700;padding:6px">KES ${total.toLocaleString()}</td></tr>
        </tfoot>
      </table>

      <div style="display:flex;gap:8px;margin-top:12px;align-items:center">
        <button class="print-btn" onclick="printReceipt()" style="padding:8px 10px;border-radius:6px;background:${SHOP_COLOR};color:#fff;border:none;cursor:pointer">Print Receipt</button>
      </div>

      <div style="margin-top:14px;padding-top:10px;border-top:1px dashed #e6e6e6;display:flex;gap:16px;align-items:flex-start;">
        <div style="flex:1">
          <div style="font-weight:700;margin-bottom:6px">Customer Signature</div>
          ${savedSig ? `<img src="${savedSig}" style="max-height:48px;border:1px solid #ddd;border-radius:6px" />` : `<div style="height:48px;border:1px solid #ddd;border-radius:6px;background:#fafafa"></div>`}
        </div>
        <div style="flex:1;text-align:right">
          <div style="font-weight:700;margin-bottom:6px">Authorized Signature</div>
          <img src="${SHOP_AUTH_SIGNATURE}" style="max-height:48px;border:1px solid #ddd;border-radius:6px;display:inline-block;width:70%;object-fit:contain" />
        </div>
      </div>

      <div style="text-align:center;margin-top:10px;color:#666;font-size:12px">Thank you for your purchase — ${SHOP_NAME}</div>
      <div style="text-align:center;margin-top:6px;color:${SHOP_COLOR};font-size:12px">${SHOP_WEBSITE} · ${SHOP_EMAIL} · ${SHOP_PHONE}</div>
    </div>
  `;

  receiptContainer.innerHTML = html;
}

window.printReceipt = function () {
  const html = `
    <html>
      <head>
        <title>Receipt</title>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 10mm }
          body{font-family:Montserrat,Arial,Helvetica,sans-serif;padding:10px;background:#fff;color:#222;font-size:12px}
          img{max-width:100%}
          .print-btn{display:none}
          @media print { .print-btn{display:none} }
          table{width:100%;border-collapse:collapse;font-size:12px}
          th,td{padding:6px;border-bottom:1px solid #eee}
          .muted{color:#666;font-size:12px}
          .no-break{page-break-inside:avoid}
        </style>
      </head>
      <body>
        ${receiptContainer.innerHTML}
      </body>
    </html>
  `;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  // optional: w.close();
}


