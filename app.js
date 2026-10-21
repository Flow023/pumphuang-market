/* =====================================================
   รถพุ่มพวง JavaScript (Full System)
===================================================== */

/* =====================================================
   1. ข้อมูลเริ่มต้น (Initial Data)
===================================================== */

let trucks = JSON.parse(localStorage.getItem("trucks")) || [
    { id: 1, name: "รถพุ่มพวง A", license: "กข 1234", location: "ตลาดหน้าหมู่บ้าน", description: "ขายผักสดและของใช้ในบ้าน", latitude: 13.7563, longitude: 100.5018 },
    { id: 2, name: "รถพุ่มพวง B", license: "ขค 5678", location: "ชุมชนเมือง", description: "ขายเนื้อ หมู ไก่ และอาหารสด", latitude: 13.7466, longitude: 100.5347 }
];

let products = JSON.parse(localStorage.getItem("products")) || [
    { id: 1, truckId: 1, name: "ไข่ไก่", price: 45, quantity: 50, unit: "แผง" },
    { id: 2, truckId: 1, name: "ผักบุ้ง", price: 20, quantity: 30, unit: "กำ" },
    { id: 3, truckId: 2, name: "หมูสามชั้น", price: 120, quantity: 20, unit: "กิโลกรัม" },
    { id: 4, truckId: 2, name: "ไก่สด", price: 80, quantity: 20, unit: "กิโลกรัม" }
];

// รวมรายการสินค้าที่ซ้ำกันจริงในรถคันเดียวกัน (ชื่อ/ราคา/หน่วยตรงกัน) โดยรวมจำนวนสต็อก
function mergeDuplicateProducts() {
    const merged = new Map();
    for (const product of products) {
        const key = [product.truckId, String(product.name || "").trim().toLocaleLowerCase("th-TH"), Number(product.price), String(product.unit || "ชิ้น").trim().toLocaleLowerCase("th-TH")].join("|");
        if (merged.has(key)) {
            const existing = merged.get(key);
            existing.quantity = Number(existing.quantity || 0) + Number(product.quantity || 0);
        } else {
            merged.set(key, { ...product, unit: product.unit || "ชิ้น" });
        }
    }
    products = Array.from(merged.values());
}
mergeDuplicateProducts();

let orders = JSON.parse(localStorage.getItem("orders")) || [];

let users = JSON.parse(localStorage.getItem("users")) || [
    { id: 1, name: "ผู้ขายตัวอย่าง", phone: "0800000000", username: "seller", password: "1234", role: "seller", points: 0 },
    { id: 2, name: "ลูกค้าตัวอย่าง", phone: "0811111111", username: "customer", password: "1234", role: "customer", points: 50 }
];

let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
if (currentUser && !users.some(u => u.id === currentUser.id)) currentUser = null;
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* =====================================================
   2. ระบบบันทึกข้อมูล (Save Data)
===================================================== */

function saveData() {
    localStorage.setItem("trucks", JSON.stringify(trucks));
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("orders", JSON.stringify(orders));
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("cart", JSON.stringify(cart));
}

/* =====================================================
   3. ระบบจัดการหน้าเรนเดอร์และเมนู (Navigation & Navbar)
===================================================== */

function renderNavbar() {
    let nav = document.getElementById("navbarMenu");
    if (!nav) return;

    let html = "";

    if (currentUser) {
        if (currentUser.role === "seller") {
            // 👨‍💼 ถ้าเป็น "ผู้ขาย" ให้แสดงเฉพาะเมนูระบบผู้ขายเท่านั้น
            html += `<button onclick="navigateTo('seller')">👨‍💼 ระบบผู้ขาย</button>`;
        } else {
            // 👤 ถ้าเป็น "ลูกค้า" ให้แสดงเมนูสำหรับซื้อสินค้าตามปกติ
            html += `
                <button onclick="navigateTo('home')">หน้าหลัก</button>
                <button onclick="navigateTo('trucks')">🚚 รถพุ่มพวง</button>
                <button onclick="navigateTo('cart')">🛒 ตะกร้า</button>
                <button onclick="navigateTo('orders')">📦 ออเดอร์ของฉัน</button>
            `;
        }

        // แสดงชื่อผู้ใช้ และปุ่มออกจากระบบ
        let userPoints = currentUser.points || 0;
        html += `
            <span style="color: #10b981; font-size: 0.9rem; align-self: center; margin: 0 8px; font-weight: 500;">
                👤 ${currentUser.name} ${currentUser.role === 'customer' ? `(⭐ ${userPoints} แต้ม)` : ''}
            </span>
            <button onclick="logout()" style="color: #ef4444;">ออกจากระบบ</button>
        `;
    } else {
        // 🔐 ถ้ายังไม่ได้เข้าสู่ระบบ ให้แสดงเมนูทั่วไป
        html += `
            <button onclick="navigateTo('home')">หน้าหลัก</button>
            <button onclick="navigateTo('trucks')">🚚 รถพุ่มพวง</button>
            <button onclick="navigateTo('cart')">🛒 ตะกร้า</button>
            <button onclick="showLogin()">🔐 เข้าสู่ระบบ</button>
            <button onclick="showRegister()">📝 สมัครสมาชิก</button>
        `;
    }

    nav.innerHTML = html;
}

function navigateTo(pageName, param = null) {
    const sellerPages = ["seller", "manageTrucks", "manageProducts", "manageOrders", "salesReport", "pos"];
    const customerPages = ["cart", "orders", "trackOrder"];
    if (sellerPages.includes(pageName) && (!currentUser || currentUser.role !== "seller")) {
        alert("หน้านี้สำหรับผู้ขายที่ได้รับอนุญาตเท่านั้น");
        if (!currentUser) showLogin(); else navigateTo("home");
        return;
    }
    if (customerPages.includes(pageName) && (!currentUser || currentUser.role !== "customer") && !(pageName === "trackOrder" && param)) {
        alert("กรุณาเข้าสู่ระบบด้วยบัญชีลูกค้าก่อน");
        if (!currentUser) showLogin(); else navigateTo("home");
        return;
    }
    let pageState = { name: pageName, param: param };
    localStorage.setItem("currentPage", JSON.stringify(pageState));

    switch (pageName) {
        case "home":
            showHome();
            break;
        case "trucks":
            showTrucks(param);
            break;
        case "trackOrder":
            showOrderTracking(param);
            break;
        case "products":
            showProducts(param);
            break;
        case "cart":
            showCart();
            break;
        case "orders":
            showOrders();
            break;
        case "seller":
            showSeller();
            break;
        case "manageTrucks":
            manageTrucks();
            break;
        case "manageProducts":
            manageProducts();
            break;
        case "manageOrders":
            manageOrders();
            break;
        case "salesReport":
            showSalesReport();
            break;
        case "pos":
            showPOS();
            break;
        default:
            showHome();
            break;
    }
}

/* =====================================================
   4. ฟังก์ชันช่วย (Helper Functions)
===================================================== */

function formatPrice(price) {
    return Number(price).toLocaleString("th-TH") + " บาท";
}

function findTruck(truckId) {
    return trucks.find(truck => truck.id == truckId);
}

function findProduct(productId) {
    return products.find(product => product.id == productId);
}

function getToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getCurrentMonth() {
    let date = new Date();
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

function getNextOrderId() {
    if (orders.length === 0) return 1;
    return Math.max(...orders.map(o => o.id)) + 1;
}

function getReceiptNumber(orderId) {
    return "RC-" + String(orderId).padStart(5, "0");
}

/* =====================================================
   5. หน้าหลัก (Home Page)
===================================================== */

function showHome() {
    const content = document.getElementById("content");
    const featuredProducts = products.slice(0, 4);
    const html = `
      <section class="market-hero">
        <div class="hero-copy">
          <span class="eyebrow"><span class="live-dot"></span> ตลาดสดใกล้บ้านคุณ</span>
          <h1>ตลาดสด...ถึงหน้าบ้าน<br><em>สดใหม่ทุกวัน ใกล้คุณ</em></h1>
          <p>เลือกซื้อผักสด ผลไม้ เนื้อสัตว์ และของใช้จากรถพุ่มพวงในชุมชน สะดวก ง่าย ได้ของสดถึงบ้าน</p>
          <div class="hero-actions">
            <button class="btn hero-cta" onclick="navigateTo('trucks')">ค้นหารถพุ่มพวง <span>→</span></button>
            <button class="btn hero-secondary" onclick="navigateTo('trucks')">เลือกดูสินค้า</button>
          </div>
          <div class="hero-proof"><span>✓</span> สินค้าจากชุมชน <span>✓</span> สั่งซื้อง่าย <span>✓</span> สดใหม่ทุกวัน</div>
        </div>
        <div class="hero-photo" role="img" aria-label="ผักสดและผลไม้หลากสี"></div>
        <div class="hero-sticker"><span>🥬</span><div><strong>สดใหม่ทุกวัน</strong><small>คัดสรรจากชุมชน</small></div></div>
      </section>

      <section class="quick-search">
        <div class="quick-search-icon">⌕</div>
        <div class="quick-search-copy"><strong>กำลังมองหาอะไรอยู่?</strong><small>ค้นหารถพุ่มพวงและสินค้าที่คุณต้องการ</small></div>
        <button class="btn search-cta" onclick="navigateTo('trucks')">ค้นหารถใกล้ฉัน <span>→</span></button>
      </section>

      <section class="section-block">
        <div class="section-heading"><div><span class="section-kicker">เลือกซื้อได้ตามใจ</span><h2>หมวดหมู่สินค้า</h2></div><span class="heading-note">ของดีจากร้านค้าในชุมชน</span></div>
        <div class="category-grid">
          <button class="category-card category-veg" onclick="navigateTo('trucks', 'ผักสด')"><span class="category-emoji">🥬</span><span><strong>ผักสด</strong><small>ผักสดจากสวน</small></span><b>→</b></button>
          <button class="category-card category-meat" onclick="navigateTo('trucks', 'เนื้อสัตว์')"><span class="category-emoji">🥩</span><span><strong>เนื้อสัตว์</strong><small>สด สะอาด คัดคุณภาพ</small></span><b>→</b></button>
          <button class="category-card category-fruit" onclick="navigateTo('trucks', 'ผลไม้')"><span class="category-emoji">🍊</span><span><strong>ผลไม้</strong><small>หวานฉ่ำตามฤดูกาล</small></span><b>→</b></button>
          <button class="category-card category-grocery" onclick="navigateTo('trucks', 'ของใช้ทั่วไป')"><span class="category-emoji">🧺</span><span><strong>ของใช้ทั่วไป</strong><small>ครบครันในรถเดียว</small></span><b>→</b></button>
        </div>
      </section>

      <section class="section-block">
        <div class="section-heading"><div><span class="section-kicker">เดินตลาดแบบไม่ต้องเดิน</span><h2>รถพุ่มพวงที่ให้บริการ</h2><p>เลือกดูร้านค้าและสินค้าที่มีในแต่ละคัน</p></div><button class="text-link" onclick="navigateTo('trucks')">ดูรถทั้งหมด <span>→</span></button></div>
        <div class="card-container truck-grid">
          ${trucks.slice(0, 3).map((truck, i) => `
            <article class="card truck-card redesigned-truck-card">
              <div class="truck-art truck-art-${i % 3}"><span>🚚</span><small>${i === 0 ? 'ผัก • ผลไม้' : i === 1 ? 'เนื้อสัตว์ • ของสด' : 'สินค้าในชุมชน'}</small></div>
              <div class="truck-card-body"><div class="truck-title-row"><h3>${truck.name}</h3><span class="status-pill"><i></i> พร้อมให้บริการ</span></div>
              <p class="truck-location">📍 ${truck.location || 'พื้นที่ชุมชน'}</p><p class="truck-description">${truck.description || 'เลือกชมสินค้าจากรถพุ่มพวงคันนี้ได้เลย'}</p>
              <button class="btn truck-view-btn" onclick="navigateTo('products', ${truck.id})">ดูสินค้าในรถ <span>→</span></button></div>
            </article>`).join('')}
        </div>
      </section>

      <section class="section-block featured-section">
        <div class="section-heading"><div><span class="section-kicker">คัดมาให้คุณ</span><h2>สินค้าแนะนำประจำวัน</h2><p>ของสดของดีที่มีในรถพุ่มพวง</p></div><button class="text-link" onclick="navigateTo('trucks')">เลือกซื้อสินค้า <span>→</span></button></div>
        <div class="card-container featured-grid">
          ${featuredProducts.map((product, i) => {
            const truck = findTruck(product.truckId);
            const emojis = ['🥚', '🥬', '🥩', '🍗', '🍅', '🥕'];
            return `<article class="product-card redesigned-product-card"><div class="product-visual product-visual-${i % 4}"><span>${emojis[i % emojis.length]}</span><small>สินค้าแนะนำ</small></div><div class="product-details"><span class="product-origin">${truck ? truck.name : 'ร้านค้าในชุมชน'}</span><h3>${product.name}</h3><div class="product-bottom"><div><p class="price">${formatPrice(product.price)}</p><small>คงเหลือ ${product.quantity} ${product.unit || 'ชิ้น'}</small></div><button class="add-cart-btn" aria-label="เพิ่ม ${product.name} ลงตะกร้า" onclick="addToCart(${product.id})">+</button></div></div></article>`;
          }).join('')}
        </div>
      </section>
      <section class="community-banner"><div class="community-icon">🏡</div><div><h2>สนับสนุนร้านค้าในชุมชน</h2><p>ซื้อสะดวก ช่วยสร้างรายได้ให้ผู้ขายในพื้นที่ของคุณ</p></div><button class="btn community-btn" onclick="navigateTo('trucks')">เริ่มเลือกซื้อเลย →</button></section>
      <footer class="home-footer">© 2026 รถพุ่มพวง · ตลาดเคลื่อนที่ออนไลน์ <span>ซื้อของใกล้บ้าน ง่ายกว่าที่เคย</span></footer>
    `;
    content.innerHTML = html;
}

/* =====================================================
   6. แสดงรถพุ่มพวง และค้นหา
===================================================== */

function showTrucks(category = null) {
    const content = document.getElementById("content");
    const categoryOptions = ["ทั้งหมด", "ผักสด", "เนื้อสัตว์", "ผลไม้", "ของใช้ทั่วไป"];
    const selected = categoryOptions.includes(category) ? category : "ทั้งหมด";
    let html = `
        <section class="page-title market-page-title">
            <span class="section-kicker">ตลาดชุมชนออนไลน์</span>
            <h1>🚚 ค้นหารถพุ่มพวงและสินค้า</h1>
            <p>เลือกดูรถใกล้บ้าน หรือค้นหาสินค้าที่ต้องการได้ในที่เดียว</p>
        </section>
        <div class="market-filter-panel">
            <label class="market-search-field"><span>⌕</span><input id="truckSearch" placeholder="ค้นหาชื่อรถ พื้นที่ หรือสินค้า..." oninput="searchTrucks()" value=""></label>
            <label class="filter-label">หมวดหมู่สินค้า
                <select id="truckCategoryFilter" onchange="filterTruckCategories()">
                    ${categoryOptions.map(c => `<option value="${c}" ${c === selected ? "selected" : ""}>${c}</option>`).join("")}
                </select>
            </label>
        </div>
        <div class="market-results-heading"><strong>รถพุ่มพวงที่ให้บริการ</strong><span>${trucks.length} คันในระบบ</span></div>
        <div id="truckList" class="card-container truck-grid market-truck-grid">
    `;
    trucks.forEach((truck, i) => {
        const truckProducts = products.filter(p => p.truckId == truck.id);
        const categoryMatch = selected === "ทั้งหมด" || truckProducts.some(p => getProductCategory(p) === selected);
        html += `
            <article class="card truck-card redesigned-truck-card market-truck-card" data-search="${escapeHTML([truck.name, truck.location, truck.license, truck.description, ...truckProducts.map(p => p.name)].join(" ").toLocaleLowerCase("th-TH"))}" data-categories="${[...new Set(truckProducts.map(getProductCategory))].join("|")}" style="${categoryMatch ? "" : "display:none"}">
                <div class="truck-art truck-art-${i % 3}"><span>🚚</span><small>${truckProducts.length} รายการสินค้า</small></div>
                <div class="truck-card-body">
                    <div class="truck-title-row"><h3>${escapeHTML(truck.name)}</h3><span class="status-pill"><i></i> พร้อมให้บริการ</span></div>
                    <p class="truck-location">📍 ${escapeHTML(truck.location || "พื้นที่ชุมชน")}</p>
                    <p class="truck-description">${escapeHTML(truck.description || "เลือกชมสินค้าจากรถพุ่มพวงคันนี้ได้เลย")}</p>
                    <div class="truck-card-meta"><span>ทะเบียน ${escapeHTML(truck.license || "-")}</span><span>สินค้า ${truckProducts.length} รายการ</span></div>
                    <div class="truck-card-actions"><button class="btn truck-view-btn" onclick="navigateTo('products', ${truck.id})">เลือกซื้อสินค้า <span>→</span></button><button class="btn btn-light-back" onclick="openTruckMapInGoogleMaps(${Number(truck.latitude || 13.7563)},${Number(truck.longitude || 100.5018)})">📍 ดูแผนที่รถ</button></div>
                </div>
            </article>`;
    });
    html += `</div><div id="truckEmpty" class="empty-state" style="display:none"><span>🔎</span><h3>ไม่พบรถที่ตรงกับการค้นหา</h3><p>ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p></div>`;
    content.innerHTML = html;
}

function getProductCategory(product) {
    const name = String(product?.name || "").toLocaleLowerCase("th-TH");
    if (/หมู|ไก่|เนื้อ|ปลา|กุ้ง|ปลาหมึก|ไข่|ไส้กรอก|แฮม|เป็ด/.test(name)) return "เนื้อสัตว์";
    if (/ผัก|คะน้า|กะหล่ำ|แตงกวา|มะเขือ|แครอท|หอม|กระเทียม|พริก|ข้าวโพด|ฟัก|ถั่ว/.test(name)) return "ผักสด";
    if (/ผลไม้|ส้ม|กล้วย|มะม่วง|แตงโม|แอปเปิล|แอปเปิ้ล|องุ่น|ฝรั่ง|มะละกอ|สับปะรด|มะพร้าว|ลำไย|ทุเรียน/.test(name)) return "ผลไม้";
    if (/สบู่|ผงซักฟอก|น้ำย|กระดาษ|ถุง|แชมพู|ยาสีฟัน|ของใช้/.test(name)) return "ของใช้ทั่วไป";
    return "ของใช้ทั่วไป";
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[char]));
}

function filterTruckCategories() {
    const selected = document.getElementById("truckCategoryFilter")?.value || "ทั้งหมด";
    document.querySelectorAll("#truckList .market-truck-card").forEach(card => {
        const categories = (card.dataset.categories || "").split("|");
        card.style.display = selected === "ทั้งหมด" || categories.includes(selected) ? "" : "none";
    });
    updateTruckEmptyState();
    searchTrucks();
}

function updateTruckEmptyState() {
    const cards = Array.from(document.querySelectorAll("#truckList .market-truck-card"));
    const visible = cards.some(card => card.style.display !== "none");
    const empty = document.getElementById("truckEmpty");
    if (empty) empty.style.display = visible ? "none" : "block";
}

function searchTrucks() {
    const keyword = (document.getElementById("truckSearch")?.value || "").trim().toLocaleLowerCase("th-TH");
    const selected = document.getElementById("truckCategoryFilter")?.value || "ทั้งหมด";
    document.querySelectorAll("#truckList .market-truck-card").forEach(card => {
        const matchesText = (card.dataset.search || "").includes(keyword);
        const categories = (card.dataset.categories || "").split("|");
        const matchesCategory = selected === "ทั้งหมด" || categories.includes(selected);
        card.style.display = matchesText && matchesCategory ? "" : "none";
    });
    updateTruckEmptyState();
}

/* =====================================================
   7. แสดงสินค้าตามรถ
===================================================== */

function showProducts(truckId) {
    const truck = findTruck(truckId);
    const content = document.getElementById("content");
    const truckProducts = products.filter(product => product.truckId == truckId);
    const categories = ["ทั้งหมด", "ผักสด", "เนื้อสัตว์", "ผลไม้", "ของใช้ทั่วไป"];
    let html = `
        <section class="page-title market-page-title">
            <span class="section-kicker">เลือกซื้อจากร้านค้าในชุมชน</span>
            <h1>${truck ? `🚚 ${escapeHTML(truck.name)}` : "ไม่พบรถพุ่มพวง"}</h1>
            <p>📍 ${truck ? escapeHTML(truck.location || "พื้นที่ชุมชน") : "กรุณาเลือกรถพุ่มพวงอีกครั้ง"}</p>
            <button class="btn btn-light-back" onclick="navigateTo('trucks')">← กลับไปเลือกรถ</button>
        </section>
        <div class="market-filter-panel product-filter-panel">
            <label class="market-search-field"><span>⌕</span><input id="productSearch" type="search" placeholder="ค้นหาชื่อสินค้า..." oninput="searchProducts()" aria-label="ค้นหาสินค้า"></label>
            <label class="filter-label">หมวดหมู่
                <select id="productCategory" onchange="searchProducts()">${categories.map(c => `<option value="${c}">${c}</option>`).join("")}</select>
            </label>
            <label class="filter-label">เรียงตามราคา
                <select id="productSort" onchange="searchProducts()"><option value="default">แนะนำ</option><option value="price-asc">ราคาน้อยไปมาก</option><option value="price-desc">ราคามากไปน้อย</option><option value="name">ชื่อสินค้า</option></select>
            </label>
        </div>
        <div class="market-results-heading"><strong>สินค้าในรถคันนี้</strong><span>${truckProducts.length} รายการ</span></div>
        <div id="productList" class="card-container featured-grid market-product-grid">
    `;
    if (!truckProducts.length) html += `<div class="empty-state"><span>🧺</span><h3>ยังไม่มีสินค้าในรถคันนี้</h3><p>ลองเลือกรถพุ่มพวงคันอื่น</p></div>`;
    truckProducts.forEach(product => {
        const category = getProductCategory(product);
        const emoji = category === "ผักสด" ? "🥬" : category === "เนื้อสัตว์" ? "🥩" : category === "ผลไม้" ? "🍊" : "🧺";
        const outOfStock = Number(product.quantity) <= 0;
        html += `<article class="product-card redesigned-product-card market-product-card" data-product-name="${escapeHTML(product.name.toLocaleLowerCase("th-TH"))}" data-price="${Number(product.price)}" data-category="${category}">
            <button class="product-visual product-visual-${product.id % 4} product-detail-trigger" onclick="showProductDetail(${product.id})" aria-label="ดูรายละเอียด ${escapeHTML(product.name)}"><span>${emoji}</span><small>${category}</small></button>
            <div class="product-details"><span class="product-origin">${escapeHTML(truck?.name || "ร้านค้าในชุมชน")}</span><h3>${escapeHTML(product.name)}</h3><p class="product-unit">หน่วยจำหน่าย: ${escapeHTML(product.unit || "ชิ้น")}</p>
                <div class="product-bottom"><div><p class="price">${formatPrice(product.price)}</p><small class="${outOfStock ? "stock-out" : ""}">${outOfStock ? "สินค้าหมด" : `เหลือ ${Number(product.quantity)} ${escapeHTML(product.unit || "ชิ้น")}`}</small></div>
                <button class="add-cart-btn" ${outOfStock ? "disabled" : ""} aria-label="เพิ่ม ${escapeHTML(product.name)} ลงตะกร้า" onclick="addToCart(${product.id})">${outOfStock ? "×" : "+"}</button></div>
                <button class="product-detail-link" onclick="showProductDetail(${product.id})">ดูรายละเอียดสินค้า</button>
            </div></article>`;
    });
    html += `</div><div id="productEmpty" class="empty-state" style="display:none"><span>🔎</span><h3>ไม่พบสินค้าที่ตรงกับคำค้นหา</h3><p>ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</p></div>`;
    content.innerHTML = html;
}

function showProductDetail(productId) {
    const product = findProduct(productId);
    if (!product) return;
    const category = getProductCategory(product);
    const emoji = category === "ผักสด" ? "🥬" : category === "เนื้อสัตว์" ? "🥩" : category === "ผลไม้" ? "🍊" : "🧺";
    const truck = findTruck(product.truckId);
    openModal(`<div class="product-detail-modal"><div class="product-detail-emoji">${emoji}</div><span class="section-kicker">${category}</span><h2>${escapeHTML(product.name)}</h2><p class="product-detail-price">${formatPrice(product.price)} <small>/ ${escapeHTML(product.unit || "ชิ้น")}</small></p><p>ร้านค้า: ${escapeHTML(truck?.name || "ร้านค้าในชุมชน")}</p><p>พื้นที่ให้บริการ: ${escapeHTML(truck?.location || "พื้นที่ชุมชน")}</p><p>คงเหลือ: ${Number(product.quantity)} ${escapeHTML(product.unit || "ชิ้น")}</p><p class="product-detail-note">สินค้าจากรถพุ่มพวงในชุมชน กรุณาตรวจสอบจำนวนสินค้าในตะกร้าก่อนยืนยันคำสั่งซื้อ</p><button class="btn" ${Number(product.quantity) <= 0 ? "disabled" : ""} onclick="addToCart(${product.id});closeModal()">🛒 เพิ่มลงตะกร้า</button><button class="btn btn-light-back" onclick="closeModal()">ปิด</button></div>`);
}

function searchProducts() {
    const list = document.getElementById("productList");
    if (!list) return;
    const keyword = (document.getElementById("productSearch")?.value || "").trim().toLocaleLowerCase("th-TH");
    const sort = document.getElementById("productSort")?.value || "default";
    const category = document.getElementById("productCategory")?.value || "ทั้งหมด";
    const cards = Array.from(list.querySelectorAll(".market-product-card"));
    cards.sort((a, b) => {
        if (sort === "price-asc") return Number(a.dataset.price) - Number(b.dataset.price);
        if (sort === "price-desc") return Number(b.dataset.price) - Number(a.dataset.price);
        if (sort === "name") return (a.dataset.productName || "").localeCompare(b.dataset.productName || "", "th");
        return 0;
    });
    cards.forEach(card => {
        const matchesText = (card.dataset.productName || "").includes(keyword);
        const matchesCategory = category === "ทั้งหมด" || card.dataset.category === category;
        card.style.display = matchesText && matchesCategory ? "" : "none";
        list.appendChild(card);
    });
    const visible = cards.some(card => card.style.display !== "none");
    const empty = document.getElementById("productEmpty");
    if (empty) empty.style.display = visible ? "none" : "block";
}

/* =====================================================
   8. ตะกร้าสินค้า (แก้ไขล่าสุด)
===================================================== */
function addToCart(productId) {
    let product = findProduct(productId);
    if (!product) return;
    if (cart.length > 0) {
        let firstProduct = findProduct(cart[0].productId);
        if (firstProduct && firstProduct.truckId != product.truckId) {
            alert("สามารถสั่งสินค้าจากรถพุ่มพวงได้ครั้งละ 1 คัน");
            return;
        }
    }
    let cartItem = cart.find(item => item.productId == productId);
    if (cartItem) {
        if (cartItem.quantity < product.quantity) {
            cartItem.quantity++;
        } else {
            alert("สินค้าในสต็อกมีไม่พอ");
            return;
        }
    } else {
        cart.push({ productId: Number(productId), quantity: 1 });
    }
    saveData();
    alert("เพิ่มสินค้าลงตะกร้าแล้ว");
}

function showCart() {
    let content = document.getElementById("content");
    let html = `<h1>🛒 ตะกร้าสินค้า</h1>`;
    
    if (cart.length === 0) {
        html += `
            <div class="card">
                <p>ยังไม่มีสินค้าในตะกร้า</p>
                <button class="btn" onclick="navigateTo('trucks')">เลือกสินค้า</button>
            </div>
        `;
        content.innerHTML = html;
        return;
    }

    let totalAll = 0;
    cart.forEach(item => {
        let product = findProduct(item.productId);
        if (!product) return;
        
        let subtotal = product.price * item.quantity;
        totalAll += subtotal;
        
        html += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
                <div style="flex: 2;">
                    <strong>${product.name}</strong><br>
                    <span style="color: #666; font-size: 0.9rem;">${product.price} บาท</span>
                </div>
                
                <div style="display: flex; align-items: center; gap: 8px; flex: 1; justify-content: center;">
                    <button style="background: #10b981; color: white; border: none; width: 32px; height: 32px; border-radius: 4px; cursor: pointer;" 
                            onclick="decreaseCart(${product.id})">-</button>
                    <span style="min-width: 24px; text-align: center; font-weight: 600;">${item.quantity}</span>
                    <button style="background: #10b981; color: white; border: none; width: 32px; height: 32px; border-radius: 4px; cursor: pointer;" 
                            onclick="increaseCart(${product.id})">+</button>
                </div>
                
                <div style="flex: 1; text-align: right; font-weight: 600; color: #10b981;">
                    ${subtotal} บาท
                </div>
                
                <div style="margin-left: 10px;">
                    <button style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;" 
                            onclick="removeFromCart(${product.id})">ลบ</button>
                </div>
            </div>
        `;
    });

    html += `
        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #ddd; display: flex; justify-content: space-between; align-items: center; font-size: 1.2rem;">
            <strong>ยอดรวมทั้งสิ้น:</strong>
            <strong style="color: #10b981; font-size: 1.4rem;">${totalAll} บาท</strong>
        </div>
        <div style="margin-top: 25px;">
            <button style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 1rem; cursor: pointer;" 
                    onclick="checkout()">ไปชำระเงิน</button>
        </div>
    `;

    content.innerHTML = html;
}

function increaseCart(productId) {
    let item = cart.find(item => item.productId == productId);
    let product = findProduct(productId);
    if (item && product && item.quantity < product.quantity) {
        item.quantity++;
    } else {
        alert("สินค้าในสต็อกมีไม่พอ");
    }
    saveData();
    showCart();
}

function decreaseCart(productId) {
    let item = cart.find(item => item.productId == productId);
    if (!item) return;
    item.quantity--;
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    saveData();
    showCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId != productId);
    saveData();
    showCart();
}

/* =====================================================
   9. ชำระเงิน และระบบแต้มส่วนลด (Checkout)
===================================================== */

function checkout() {
    if (cart.length === 0) {
        alert("ไม่มีสินค้าในตะกร้า");
        return;
    }

    if (currentUser && currentUser.role !== "customer") {
        alert("บัญชีผู้ขายไม่สามารถสั่งซื้อสินค้าได้");
        return;
    }

    let subtotal = cart.reduce((sum, item) => {
        let p = findProduct(item.productId);
        return sum + (p ? p.price * item.quantity : 0);
    }, 0);

    let userPoints = currentUser && currentUser.role === "customer" ? (currentUser.points || 0) : 0;

    let html = `
        <h2>💳 ชำระเงิน</h2>
        ${currentUser && currentUser.role === "customer" ? `<div class="card"><h3>ข้อมูลสมาชิก</h3><p>ชื่อ: ${escapeHTML(currentUser.name || '-')}</p><p>เบอร์โทร: ${escapeHTML(currentUser.phone || '-')}</p><p style="color:#27ae60;font-weight:bold;margin-top:5px;">⭐ แต้มสะสมคงเหลือ: ${userPoints} แต้ม</p></div>` : `<div class="card guest-checkout-note"><h3>🛍️ สั่งซื้อแบบไม่สมัครสมาชิก</h3><p>กรอกชื่อและเบอร์โทรสำหรับติดต่อได้เลย ไม่จำเป็นต้องสร้างบัญชี</p><div class="form-group"><label for="guestName">ชื่อผู้รับสินค้า *</label><input id="guestName" type="text" maxlength="80" placeholder="ชื่อ-นามสกุล"></div><div class="form-group"><label for="guestPhone">เบอร์โทรศัพท์ *</label><input id="guestPhone" type="tel" maxlength="20" placeholder="08XXXXXXXX"></div></div>`}

        // ${currentUser && currentUser.role === "customer" && userPoints > 0 ? `
        //     // <div class="form-group" style="background: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #bbf7d0;">
        //     //     <label style="color: #166534; font-weight: bold;">🎁 ใช้แต้มสะสมแลกส่วนลด (1 แต้ม = 1 บาท)</label>
        //     //     <input type="number" id="usePointsInput" min="0" max="${Math.min(userPoints, subtotal)}" value="0" oninput="calculateDiscount(${subtotal},${userPoints})" placeholder="กรอกจำนวนแต้มที่ต้องการใช้">
        //     //     <small style="color: #15803d; display: block; margin-top: 4px;">แต้มสะสมที่จะได้รับจากออเดอร์นี้: +${Math.floor(subtotal / 100)} แต้ม</small>
        //     // </div>
        // ` : ''}

        <div class="form-group">
            <label>ที่อยู่จัดส่ง</label>
            <textarea id="customerAddress" rows="3" placeholder="กรอกที่อยู่จัดส่ง"></textarea>
        </div>

        <div class="card">
            <h3>🏦 ข้อมูลสำหรับโอนเงิน</h3>
            <p>ธนาคาร: กสิกรไทย</p>
            <p>ชื่อบัญชี: ร้านรถพุ่มพวง</p>
            <p>เลขบัญชี: 123-4-56789-0</p>
            <hr style="margin: 10px 0;">
            <p>ราคาสินค้ารวม: <span id="cartSubtotalText">${formatPrice(subtotal)}</span></p>
            <p style="color: #e74c3c;">ส่วนลดจากแต้ม: -<span id="discountText">0 บาท</span></p>
            <h3>ยอดสุทธิที่ต้องโอน: <span id="finalTotalText" style="color: #10b981;">${formatPrice(subtotal)}</span></h3>
        </div>

        <div class="form-group">
            <label>แนบสลิปการโอนเงิน</label>
            <input type="file" id="slipImage" accept="image/*">
        </div>
        <button class="btn" onclick="placeOrder(${subtotal})">✅ ยืนยันการสั่งซื้อ</button>
        ${!currentUser ? `<p class="guest-checkout-footnote">มีบัญชีอยู่แล้ว? <button class="text-button" onclick="closeModal();showLogin()">เข้าสู่ระบบ</button> หรือสั่งซื้อแบบผู้เยี่ยมชมต่อได้เลย</p>` : ``}
    `;

    openModal(html);
}

function calculateDiscount(subtotal, userPoints) {
    let inputEl = document.getElementById("usePointsInput");
    let pointsToUse = Number(inputEl.value) || 0;

    if (pointsToUse > userPoints) {
        pointsToUse = userPoints;
        inputEl.value = pointsToUse;
    }

    if (pointsToUse > subtotal) {
        pointsToUse = subtotal;
        inputEl.value = pointsToUse;
    }

    let finalTotal = subtotal - pointsToUse;

    document.getElementById("discountText").innerText = pointsToUse + " บาท";
    document.getElementById("finalTotalText").innerText = formatPrice(finalTotal);
}

function placeOrder(subtotal) {
    let address = document.getElementById("customerAddress").value.trim();
    let slipInput = document.getElementById("slipImage");
    let slipFile = slipInput.files[0];
    let pointsInput = document.getElementById("usePointsInput");
    let pointsUsed = currentUser && currentUser.role === "customer" && pointsInput ? Number(pointsInput.value) || 0 : 0;
    let guestName = document.getElementById("guestName")?.value.trim() || "";
    let guestPhone = document.getElementById("guestPhone")?.value.trim() || "";
    let customerName = currentUser && currentUser.role === "customer" ? currentUser.name : guestName;
    let customerPhone = currentUser && currentUser.role === "customer" ? currentUser.phone : guestPhone;

    if (!currentUser && (!guestName || !guestPhone)) { alert("กรุณากรอกชื่อและเบอร์โทรสำหรับติดต่อ"); return; }
    if (!address) {
        alert("กรุณากรอกที่อยู่");
        return;
    }

    if (!slipFile) {
        alert("กรุณาแนบสลิปการโอนเงิน");
        return;
    }
    if (!slipFile.type.startsWith("image/")) { alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น"); return; }
    if (slipFile.size > 2 * 1024 * 1024) { alert("รูปสลิปต้องมีขนาดไม่เกิน 2 MB"); return; }
    if (pointsUsed < 0 || pointsUsed > ((currentUser && currentUser.role === "customer" && currentUser.points) || 0) || pointsUsed > subtotal) { alert("จำนวนแต้มที่ใช้ไม่ถูกต้อง"); return; }

    // อ่านไฟล์รูปภาพเปลี่ยนเป็น Base64
    let reader = new FileReader();
    reader.onload = function (e) {
        let slipDataUrl = e.target.result; // รูปสลิปจริง
        let finalTotal = subtotal - pointsUsed;
        let items = [];

        for (let cartItem of cart) {
            let product = findProduct(cartItem.productId);
            if (cartItem.quantity > product.quantity) {
                alert(`สินค้า ${product.name} มีไม่พอ`);
                return;
            }

            let itemSubtotal = product.price * cartItem.quantity;
            items.push({
                productId: product.id,
                productName: product.name,
                quantity: cartItem.quantity,
                price: product.price,
                subtotal: itemSubtotal
            });
        }

        let firstProduct = findProduct(cart[0].productId);

        let order = {
            id: getNextOrderId(),
            customerId: currentUser && currentUser.role === "customer" ? currentUser.id : null,
            guestOrder: !(currentUser && currentUser.role === "customer"),
            customerName: customerName,
            phone: customerPhone,
            address: address,
            truckId: firstProduct.truckId,
            items: items,
            subtotal: subtotal,
            discount: pointsUsed,
            total: finalTotal,
            date: new Date().toLocaleString("sv-SE"),
            status: "รอตรวจสอบ",
            paymentMethod: "โอนเงิน",
            paymentStatus: "รอตรวจสอบ",
            slipImage: slipDataUrl, // 🌟 บันทึกรูปสลิปจริง
            receiptNumber: null
        };

        orders.push(order);

        if (pointsUsed > 0 && currentUser && currentUser.role === "customer") {
            currentUser.points = (currentUser.points || 0) - pointsUsed;
            let userInList = users.find(u => u.id == currentUser.id);
            if (userInList) userInList.points = currentUser.points;
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }

        items.forEach(item => {
            let product = findProduct(item.productId);
            if (product) product.quantity -= item.quantity;
        });

        cart = [];
        saveData();
        renderNavbar();
        closeModal();
        alert(`สั่งซื้อสำเร็จ! เลขที่ออเดอร์ #${order.id} กรุณาเก็บเลขนี้ไว้เพื่อติดตามสถานะ`);
        if (currentUser && currentUser.role === "customer") navigateTo("orders");
        else showOrderTracking(order.id, true);
    };

    reader.readAsDataURL(slipFile);
}
function rejectPayment(orderId) {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    let order = orders.find(o => o.id == orderId);
    if (!order) return;

    if (!confirm(`ต้องการปฏิเสธสลิปการโอนเงินของออเดอร์ #${orderId} ใช่หรือไม่?`)) return;

    // คืนแต้มให้ลูกค้าถ้าออเดอร์นั้นมีการใช้แต้มส่วนลด
    // if (order.discount && order.discount > 0) {
    //     let customer = users.find(u => u.id == order.customerId);
    //     if (customer) {
    //         customer.points = (customer.points || 0) + order.discount;
            
            // อัปเดต currentUser หากผู้ใช้ที่ล็อกอินอยู่คือลูกค้ารายนี้
            if (currentUser && currentUser.id == customer.id) {
                currentUser.points = customer.points;
                localStorage.setItem("currentUser", JSON.stringify(currentUser));
            }
        }
    }

    // คืนสต็อกสินค้าเข้าคลัง
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            let product = findProduct(item.productId);
            if (product) {
                product.quantity += item.quantity;
            }
        });
    }

    order.paymentStatus = "ชำระเงินไม่ถูกต้อง";
    order.status = "ยกเลิกออเดอร์";

    saveData();
    renderNavbar();
    alert(`ปฏิเสธการชำระเงินแล้ว (ระบบได้ทำการคืนแต้ม ${order.discount || 0} แต้ม และสต็อกสินค้าให้ลูกค้าเรียบร้อยแล้ว)`);
    manageOrders();
}
function updateOrderStatus(orderId, newStatus) {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    let order = orders.find(o => o.id == orderId);
    if (!order) return;

    // ถ้ายกเลิกออเดอร์ และก่อนหน้านี้ออเดอร์ยังไม่ได้ถูกยกเลิก ให้คืนแต้มและคืนสต็อก
    if (newStatus === "ยกเลิกออเดอร์" && order.status !== "ยกเลิกออเดอร์") {
        if (order.discount && order.discount > 0) {
            let customer = users.find(u => u.id == order.customerId);
            if (customer) {
                customer.points = (customer.points || 0) + order.discount;
                if (currentUser && currentUser.id == customer.id) {
                    currentUser.points = customer.points;
                    localStorage.setItem("currentUser", JSON.stringify(currentUser));
                }
            }
        }

        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                let product = findProduct(item.productId);
                if (product) {
                    product.quantity += item.quantity;
                }
            });
        }

        order.paymentStatus = "ชำระเงินไม่ถูกต้อง";
    }

    order.status = newStatus;
    saveData();
    renderNavbar();
    alert(`อัปเดตสถานะออเดอร์ #${orderId} เป็น "${newStatus}" เรียบร้อยแล้ว`);
    manageOrders();
}

/* =====================================================
   10. ระบบสมาชิก (Register & Login)
===================================================== */

function showRegister() {
    let html = `
        <div class="form-box">
            <h2>📝 สมัครสมาชิก</h2>
            <div class="form-group">
                <label>ชื่อผู้ใช้ (Username)</label>
                <input id="registerUsername" placeholder="ตั้งชื่อผู้ใช้" onkeyup="handleRegisterKey(event)">
            </div>
            <div class="form-group">
                <label>รหัสผ่าน</label>
                <input id="registerPassword" type="password" placeholder="ตั้งรหัสผ่าน" onkeyup="handleRegisterKey(event)">
            </div>
            <div class="form-group">
                <label>เบอร์โทรศัพท์</label>
                <input id="registerPhone" placeholder="กรอกเบอร์โทรศัพท์" onkeyup="handleRegisterKey(event)">
            </div>
            <div class="notice">สมัครสมาชิกใหม่เป็นบัญชีลูกค้าเท่านั้น หากต้องการบัญชีผู้ขายให้ผู้ดูแลระบบเป็นผู้สร้าง</div>
            <button class="btn" onclick="registerUser()">สมัครสมาชิก</button>
            <p style="margin-top: 15px; text-align: center;">
                มีบัญชีแล้ว? 
            <button class="btn btn-blue" style="width: auto; padding: 4px 12px; margin-left: 5px;" onclick="closeModal(); setTimeout(showLogin, 100);">
                    เข้าสู่ระบบ
            </button>
            </p>
        </div>
    `;
    openModal(html);
}

// ฟังก์ชันดักจับปุ่ม Enter หน้าสมัครสมาชิก
function handleRegisterKey(event) {
    if (event.key === "Enter") registerUser();
}

function registerUser() {
    const name = document.getElementById("registerName")?.value.trim() || "";
    const username = document.getElementById("registerUsername")?.value.trim() || "";
    const password = document.getElementById("registerPassword")?.value || "";
    const phone = document.getElementById("registerPhone")?.value.trim() || "";
    if (!name || !username || !password || !phone) return alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
    if (username.length < 4) return alert("ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร");
    if (password.length < 8) return alert("รหัสผ่านควรมีอย่างน้อย 8 ตัวอักษร");
    if (!/^[0-9+() -]{9,20}$/.test(phone)) return alert("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
    if (users.some(u => String(u.username).toLowerCase() === username.toLowerCase())) return alert("ชื่อผู้ใช้นี้ถูกใช้แล้ว");
    const user = { id: users.length ? Math.max(...users.map(u => Number(u.id)||0))+1 : 1, name, username, password, phone, role: "customer", points: 0 };
    users.push(user);
    saveData();
    closeModal();
    alert("สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ");
    showLogin();
}
function showLogin() {
    let html = `
        <section class="auth-card" aria-labelledby="loginTitle">
            <div class="auth-topline"><span class="auth-icon">🔐</span><span class="auth-brand">รถพุ่มพวง</span></div>
            <h2 id="loginTitle">ยินดีต้อนรับกลับมา</h2>
            <p class="auth-subtitle">เข้าสู่ระบบเพื่อจัดการบัญชีและเลือกซื้อสินค้า</p>
            <div class="form-group auth-field">
                <label for="loginUsername">ชื่อผู้ใช้ (Username)</label>
                <input id="loginUsername" autocomplete="username" placeholder="กรอกชื่อผู้ใช้" onkeyup="handleLoginKey(event)">
            </div>
            <div class="form-group auth-field">
                <label for="loginPassword">รหัสผ่าน (Password)</label>
                <input id="loginPassword" type="password" autocomplete="current-password" placeholder="กรอกรหัสผ่าน" onkeyup="handleLoginKey(event)">
            </div>
            <button class="btn auth-submit" onclick="login()">เข้าสู่ระบบ <span aria-hidden="true">→</span></button>
            <div class="auth-divider"><span>หรือ</span></div>
            <p class="auth-signup-text">ยังไม่มีบัญชีใช่ไหม?</p>
            <button class="btn auth-register" onclick="closeModal(); setTimeout(showRegister, 100);">สมัครสมาชิก</button>
        </section>
    `;
    openModal(html);
    setTimeout(() => document.getElementById("loginUsername")?.focus(), 50);
}

// ฟังก์ชันดักจับปุ่ม Enter หน้าล็อกอิน
function handleLoginKey(event) {
    if (event.key === "Enter") {
        login();
    }
}
function login() {
    let username = document.getElementById("loginUsername").value.trim();
    let password = document.getElementById("loginPassword").value;

    let user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        alert("Username หรือ Password ไม่ถูกต้อง");
        return;
    }

    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    
    closeModal();
    renderNavbar(); // 👈 1. สั่งวาด Navbar ใหม่ทันที

    alert(`ยินดีต้อนรับคุณ ${currentUser.name}`);

    // 👈 2. สลับหน้าตามบทบาทผู้ใช้
    if (user.role === "seller") {
        navigateTo('seller');
    } else {
        navigateTo('home');
    }
}
function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    renderNavbar();
    alert("ออกจากระบบแล้ว");
    navigateTo('home');
}

/* =====================================================
   11. หน้าออเดอร์ของฉัน (Customer Orders + Stepper)
===================================================== */

function getStepProgress(status) {
    switch (status) {
        case "รอตรวจสอบ": return 1;
        case "กำลังเตรียมสินค้า": return 2;
        case "พร้อมจัดส่ง": return 3;
        case "จัดส่งสำเร็จ": return 4;
        default: return 0;
    }
}

function renderStepperHTML(currentStatus) {
    if (currentStatus === "ยกเลิกออเดอร์" || currentStatus === "ชำระเงินไม่ถูกต้อง") {
        return `
            <div class="stepper-wrapper canceled">
                <div class="stepper-item canceled">
                    <div class="step-counter">❌</div>
                    <div class="step-name">ออเดอร์ถูกยกเลิก</div>
                </div>
            </div>
        `;
    }

    const steps = [
        { level: 1, name: "รอตรวจสอบ", icon: "⏳" },
        { level: 2, name: "กำลังเตรียมสินค้า", icon: "👨‍🍳" },
        { level: 3, name: "พร้อมจัดส่ง", icon: "🚚" },
        { level: 4, name: "จัดส่งสำเร็จ", icon: "✅" }
    ];

    const currentLevel = getStepProgress(currentStatus);
    let html = `<div class="stepper-wrapper">`;

    steps.forEach(step => {
        let stateClass = "";
        if (step.level < currentLevel) {
            stateClass = "completed";
        } else if (step.level === currentLevel) {
            stateClass = "active";
        }

        html += `
            <div class="stepper-item ${stateClass}">
                <div class="step-counter">${step.level < currentLevel ? "✓" : step.icon}</div>
                <div class="step-name">${step.name}</div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

function initializeTruckMap(containerId, truck) {
    const el = document.getElementById(containerId);
    if (!el || typeof L === "undefined") {
        if (el) el.innerHTML = '<p style="padding:16px">ไม่สามารถโหลดแผนที่ได้ กรุณาตรวจสอบอินเทอร์เน็ต</p>';
        return;
    }
    const lat = Number(truck?.latitude || 13.7563);
    const lng = Number(truck?.longitude || 100.5018);
    const map = L.map(containerId).setView([lat, lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    L.marker([lat, lng]).addTo(map).bindPopup(`<strong>${escapeHTML(truck?.name || "รถพุ่มพวง")}</strong><br>ตำแหน่งตัวอย่าง`).openPopup();
    setTimeout(() => map.invalidateSize(), 150);
}

function openTruckMapInGoogleMaps(lat, lng) {
    window.open(`https://www.google.com/maps?q=${encodeURIComponent(lat + "," + lng)}`, "_blank", "noopener,noreferrer");
}

function showOrderTracking(orderId, guestView = false) {
    const order = orders.find(o => o.id == orderId && (o.guestOrder || (currentUser && currentUser.role === "customer" && o.customerId == currentUser.id)));
    if (!order) { alert("ไม่พบคำสั่งซื้อ หรือรายการนี้เป็นของบัญชีอื่น"); if (currentUser && currentUser.role === "customer") navigateTo("orders"); else navigateTo("home"); return; }
    const truck = findTruck(order.truckId);
    const steps = ["รอตรวจสอบ", "กำลังเตรียมสินค้า", "พร้อมจัดส่ง", "จัดส่งสำเร็จ"];
    const canceled = order.status === "ยกเลิกออเดอร์" || order.paymentStatus === "ชำระเงินไม่ถูกต้อง";
    const currentStep = steps.indexOf(order.status);
    const itemsHtml = (order.items || []).map(item => `<div class="tracking-item"><span>${escapeHTML(item.productName)}</span><span>${Number(item.quantity)} × ${formatPrice(item.price)}</span><strong>${formatPrice(item.subtotal)}</strong></div>`).join("");
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address || "ประเทศไทย")}`;
    document.getElementById("content").innerHTML = `
        <section class="page-title market-page-title"><span class="section-kicker">สถานะคำสั่งซื้อ</span><h1>📦 ติดตามออเดอร์ #${order.id}</h1><p>ตรวจสอบสถานะการชำระเงิน รายการสินค้า และข้อมูลจัดส่งได้ที่นี่</p><button class="btn btn-light-back" onclick="${guestView ? "navigateTo(\'home\')" : "navigateTo(\'orders\')"}">${guestView ? "← กลับหน้าหลัก" : "← กลับไปออเดอร์ของฉัน"}</button></section>
        <div class="tracking-layout"><section class="card tracking-main"><div class="tracking-status-head"><div><span class="muted-label">สถานะปัจจุบัน</span><h2>${canceled ? "❌ ออเดอร์ถูกยกเลิก" : escapeHTML(order.status || "รอตรวจสอบ")}</h2></div><span class="tracking-order-chip">#${order.id}</span></div>
            ${canceled ? `<div class="tracking-canceled-note">คำสั่งซื้อนี้ถูกยกเลิกหรือมีปัญหาการชำระเงิน หากต้องการความช่วยเหลือ กรุณาติดต่อผู้ขาย</div>` : `<div class="tracking-timeline">${steps.map((step, i) => `<div class="tracking-step ${i < currentStep ? "done" : i === currentStep ? "current" : ""}"><span class="tracking-step-icon">${i < currentStep ? "✓" : ["⏳", "🧺", "🚚", "🏡"][i]}</span><div><strong>${step}</strong><small>${["ร้านค้ากำลังตรวจสอบคำสั่งซื้อ", "ร้านค้ากำลังจัดเตรียมสินค้าของคุณ", "คำสั่งซื้อพร้อมออกจัดส่ง", "ส่งมอบสินค้าเรียบร้อยแล้ว"][i]}</small></div></div>`).join("")}</div>`}
            <div class="tracking-info-grid"><div><span class="muted-label">วันที่สั่งซื้อ</span><strong>${new Date(order.date).toLocaleString("th-TH")}</strong></div><div><span class="muted-label">สถานะชำระเงิน</span><strong>${escapeHTML(order.paymentStatus || "รอตรวจสอบ")}</strong></div><div><span class="muted-label">รถพุ่มพวง</span><strong>${escapeHTML(truck?.name || "-")}</strong></div><div><span class="muted-label">เบอร์โทรร้านค้า</span><strong>${escapeHTML(truck?.phone || "ยังไม่มีข้อมูล")}</strong></div></div>
        </section><aside class="card tracking-side"><h3>🚚 ตำแหน่งรถพุ่มพวงบนแผนที่</h3><div id="truckLiveMap" class="truck-live-map" role="img" aria-label="แผนที่ตำแหน่งรถพุ่มพวง"></div><p class="tracking-map-note">📌 ตำแหน่งตัวอย่างสำหรับสาธิตระบบ ยังไม่ใช่ GPS สดของรถ</p><button class="btn btn-light-back" onclick="openTruckMapInGoogleMaps(${Number(truck?.latitude || 13.7563)},${Number(truck?.longitude || 100.5018)})">เปิดแผนที่ขนาดใหญ่ ↗</button><hr><h3>📍 ที่อยู่จัดส่ง</h3><p>${escapeHTML(order.address || "ไม่ได้ระบุที่อยู่")}</p><a class="btn map-link-btn" href="${mapUrl}" target="_blank" rel="noopener noreferrer">เปิดที่อยู่ใน Google Maps ↗</a><p class="tracking-map-note">แผนที่เปิดตำแหน่งที่อยู่จัดส่ง ไม่ใช่ตำแหน่งรถแบบเรียลไทม์</p><hr><h3>🧺 รายการสินค้า</h3>${itemsHtml}<div class="tracking-total"><span>ยอดรวมสุทธิ</span><strong>${formatPrice(order.total)}</strong></div>${order.discount ? `<p class="tracking-discount">ใช้แต้มส่วนลด ${order.discount} บาท</p>` : ""}</aside></div>`;
    initializeTruckMap("truckLiveMap", truck);
}

function showOrders() {
    if (!currentUser) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        showLogin();
        return;
    }

    if (currentUser.role !== "customer") {
        alert("หน้านี้สำหรับลูกค้า");
        return;
    }

    let content = document.getElementById("content");
    let myOrders = orders.filter(order => order.customerId == currentUser.id);

    let html = `
        <div class="page-title">
            <h1>📦 ออเดอร์ของฉัน</h1>
        </div>

        <div class="card" style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: none; margin-bottom: 20px;">
            <h3>⭐ แต้มสะสมของฉัน: <span style="font-size: 1.5rem; color: #d97706;">${currentUser.points || 0}</span> แต้ม</h3>
            <p style="font-size: 0.85rem; color: #92400e;">(ซื้อครบทุก 100 บาท รับ 1 แต้ม / 1 แต้ม = ส่วนลด 1 บาท)</p>
        </div>
    `;

    if (myOrders.length === 0) {
        html += `<div class="card"><p>ยังไม่มีรายการสั่งซื้อ</p></div>`;
        content.innerHTML = html;
        return;
    }

    for (let i = myOrders.length - 1; i >= 0; i--) {
        let order = myOrders[i];
        let truck = findTruck(order.truckId);

        html += `
            <div class="card" style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>ออเดอร์ #${order.id}</h3>
                    <span style="font-size: 0.9em; color: #666;">
                        📅 ${new Date(order.date).toLocaleString("th-TH")}
                    </span>
                </div>

                ${renderStepperHTML(order.status)}
                <div class="order-track-action"><button class="btn" onclick="navigateTo('trackOrder', ${order.id})">📍 ดูรายละเอียดและติดตามออเดอร์</button></div>

                <div style="background: #f9f9f9; padding: 12px; border-radius: 8px; margin-top: 10px;">
                    <p><strong>รถพุ่มพวง:</strong> ${truck ? truck.name : "-"}</p>
                    ${order.discount ? `<p style="color: #dc2626;"><strong>ส่วนลดจากแต้ม:</strong> -${order.discount} บาท</p>` : ''}
                    <p><strong>ยอดเงินสุทธิ:</strong> <strong>${formatPrice(order.total)}</strong></p>
                    <p><strong>การชำระเงิน:</strong> ${order.paymentStatus}</p>
                </div>
        `;

        if (order.paymentStatus === "ชำระเงินแล้ว") {
            html += `
                <div style="margin-top: 10px;">
                    <button class="btn btn-blue" onclick="showReceipt(${order.id})">
                        🧾 ดูใบเสร็จรับเงิน
                    </button>
                </div>
            `;
        }

        html += `</div>`;
    }

    content.innerHTML = html;
}

/* =====================================================
   12. ระบบผู้ขาย (Seller System)
===================================================== */

function getLastSevenDaysSales() {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        const total = orders.filter(o => o.date && o.date.substring(0,10) === key && o.paymentStatus === "ชำระเงินแล้ว").reduce((sum,o)=>sum+Number(o.total||0),0);
        days.push({ key, total, label: `${d.getDate()}/${d.getMonth()+1}` });
    }
    const max = Math.max(...days.map(d=>d.total), 1);
    days.forEach(d => d.percent = d.total === 0 ? 3 : Math.max(8, Math.round(d.total/max*100)));
    return days;
}

function showSeller() {
    if (!currentUser || currentUser.role !== "seller") {
        alert("กรุณาเข้าสู่ระบบผู้ขาย");
        showLogin();
        return;
    }

    // คำนวณข้อมูลสำหรับแดชบอร์ด
    let today = getToday();
    let todayOrders = orders.filter(o => o.date.substring(0, 10) === today && o.paymentStatus === "ชำระเงินแล้ว");
    let todayTotal = todayOrders.reduce((sum, o) => sum + o.total, 0);
    let pendingOrders = orders.filter(o => o.paymentStatus === "รอตรวจสอบ");

    let content = document.getElementById("content");
    content.innerHTML = `
        <div class="page-title" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border-color); padding-bottom: 15px;">
            <div>
                <h1 style="font-size: 1.8rem; color: var(--dark);">👨‍💼 แดชบอร์ดผู้ขาย</h1>
                <p style="color: #64748b;">ยินดีต้อนรับคุณ <strong>${currentUser.name}</strong></p>
            </div>
            <span class="badge" style="background: var(--primary-light); color: var(--primary-hover); font-size: 0.9rem; padding: 6px 14px; border-radius: 20px;">
                🟢 พร้อมให้บริการ
            </span>
        </div>

        <!-- 1. ตัวเลขสรุปภาพรวมด่วน -->
        <div class="report-container" style="margin-top: 20px;">
            <div class="report-card" style="border-left: 5px solid #10b981;">
                <p style="color: #64748b; font-size: 0.9rem;">💰 ยอดขายวันนี้</p>
                <h2 style="font-size: 1.6rem; color: #10b981; margin: 5px 0;">${formatPrice(todayTotal)}</h2>
                <p style="font-size: 0.85rem; color: #64748b;">สำเร็จ ${todayOrders.length} ออเดอร์</p>
            </div>
            <div class="report-card" style="border-left: 5px solid #f59e0b;">
                <p style="color: #64748b; font-size: 0.9rem;">⏳ รอตรวจสอบสลิป</p>
                <h2 style="font-size: 1.6rem; color: #f59e0b; margin: 5px 0;">${pendingOrders.length} รายการ</h2>
                <p style="font-size: 0.85rem; color: #64748b;">รอยืนยันการชำระเงิน</p>
            </div>
            <div class="report-card" style="border-left: 5px solid #3b82f6;">
                <p style="color: #64748b; font-size: 0.9rem;">🚚 รถพุ่มพวงในระบบ</p>
                <h2 style="font-size: 1.6rem; color: #3b82f6; margin: 5px 0;">${trucks.length} คัน</h2>
                <p style="font-size: 0.85rem; color: #64748b;">พร้อมวิ่งให้บริการ</p>
            </div>
            <div class="report-card" style="border-left: 5px solid #8b5cf6;">
                <p style="color: #64748b; font-size: 0.9rem;">🥬 สินค้าทั้งหมด</p>
                <h2 style="font-size: 1.6rem; color: #8b5cf6; margin: 5px 0;">${products.length} รายการ</h2>
                <p style="font-size: 0.85rem; color: #64748b;">ในคลังสินค้า</p>
            </div>
        </div>

        <section class="card chart-card" style="margin-top:20px;">
            <div class="section-heading"><div><h2>📈 ยอดขายย้อนหลัง 7 วัน</h2><p>นับเฉพาะออเดอร์ที่ชำระเงินแล้ว</p></div></div>
            <div class="sales-chart">
                ${getLastSevenDaysSales().map(day => `<div class="chart-column"><span class="chart-value">${day.total.toLocaleString("th-TH")}</span><div class="chart-track"><div class="chart-bar" style="height:${day.percent}%" title="${formatPrice(day.total)}"></div></div><span class="chart-label">${day.label}</span></div>`).join("")}
            </div>
        </section>

        <!-- 2. เมนูจัดการหลัก -->
        <div style="margin-top: 35px;">
            <h3 style="font-size: 1.2rem; margin-bottom: 15px; color: var(--dark);">🛠️ เมนูจัดการระบบ</h3>
            <div class="card-container">
                <div class="card pos-shortcut-card" style="text-align: center; padding: 24px; border: 1px solid #b9e7cc; background: linear-gradient(145deg,#f0fff5,#ffffff);">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">🧾</div>
                    <h3 style="margin-bottom: 6px;">ระบบขายด่วน (POS)</h3>
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">ขายหน้าร้าน คิดเงินทันที พิมพ์ใบเสร็จ และตัดสต็อกอัตโนมัติ</p>
                    <button class="btn" onclick="navigateTo('pos')">เปิดหน้าขายด่วน</button>
                </div>
                <div class="card" style="text-align: center; padding: 24px;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">🚚</div>
                    <h3 style="margin-bottom: 6px;">จัดการรถพุ่มพวง</h3>
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">เพิ่ม/ลบ รถพุ่มพวง และกำหนดจุดให้บริการ</p>
                    <button class="btn" onclick="navigateTo('manageTrucks')">จัดการรถ</button>
                </div>
                <div class="card" style="text-align: center; padding: 24px;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">🥬</div>
                    <h3 style="margin-bottom: 6px;">จัดการสินค้า</h3>
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">เพิ่ม แก้ไขสต็อกสินค้า และ <br> ราคา</p>
                    <button class="btn" onclick="navigateTo('manageProducts')">จัดการสินค้า</button>
                </div>
                <div class="card" style="text-align: center; padding: 24px;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">📦</div>
                    <h3 style="margin-bottom: 6px;">จัดการออเดอร์</h3>
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">ตรวจสลิปโอนเงิน และอัปเดตสถานะจัดส่ง</p>
                    <button class="btn btn-blue" onclick="navigateTo('manageOrders')">
                        ดูออเดอร์ ${pendingOrders.length > 0 ? `(${pendingOrders.length})` : ''}
                    </button>
                </div>
                <div class="card" style="text-align: center; padding: 24px;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">📊</div>
                    <h3 style="margin-bottom: 6px;">รายงานยอดขาย</h3>
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">สรุปรายได้ประจำวัน ประจำเดือน และใบเสร็จ</p>
                    <button class="btn btn-blue" onclick="navigateTo('salesReport')">ดูรายงาน</button>
                </div>
            </div>
        </div>

        <!-- 3. ตารางรายการสั่งซื้อล่าสุด -->
        <div class="card" style="margin-top: 35px; padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3>📦 รายการสั่งซื้อล่าสุด</h3>
                <button class="btn btn-blue" style="width: auto; padding: 6px 14px; font-size: 0.85rem;" onclick="navigateTo('manageOrders')">
                    ดูออเดอร์ทั้งหมด →
                </button>
            </div>
            <div class="table-box">
                <table>
                    <thead>
                        <tr>
                            <th>เลขที่ออเดอร์</th>
                            <th>ชื่อลูกค้า</th>
                            <th>ยอดเงินสุทธิ</th>
                            <th>สถานะสลิป</th>
                            <th>สถานะการจัดส่ง</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${createRecentOrdersRows()}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ฟังก์ชันช่วยเรนเดอร์แถวออเดอร์ล่าสุด 5 รายการ
function createRecentOrdersRows() {
    if (orders.length === 0) {
        return `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">ยังไม่มีรายการสั่งซื้อเข้ามาในระบบ</td></tr>`;
    }

    let recentOrders = orders.slice(-5).reverse();

    return recentOrders.map(o => `
        <tr>
            <td><strong>#${o.id}</strong></td>
            <td>${o.customerName}</td>
            <td><strong>${formatPrice(o.total)}</strong></td>
            <td>
                <span class="badge" style="background: ${o.paymentStatus === 'ชำระเงินแล้ว' ? '#d1fae5' : '#fef3c7'}; color: ${o.paymentStatus === 'ชำระเงินแล้ว' ? '#059669' : '#d97706'};">
                    ${o.paymentStatus}
                </span>
            </td>
            <td>${o.status}</td>
        </tr>
    `).join("");
}

function manageTrucks() {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    let html = `
        <div style="margin-bottom: 15px;">
            <button class="btn btn-blue" style="width: auto; padding: 6px 14px;" onclick="navigateTo('seller')">← กลับหน้าระบบผู้ขาย</button>
        </div>
        <h2>🚚 จัดการรถพุ่มพวง</h2>
        <button class="btn" onclick="showAddTruck()">+ เพิ่มรถ</button>
        <hr style="margin: 15px 0;">
    `;

    trucks.forEach(truck => {
        html += `
            <div class="card" style="margin-bottom: 15px;">
                <h3>🚚 ${truck.name}</h3>
                <p><strong>ทะเบียน:</strong> ${truck.license}</p>
                <p>📍 ${truck.location}</p>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 12px;">${truck.description || '-'}</p>
                
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="btn btn-blue" onclick="showEditTruck(${truck.id})">✏️ แก้ไขข้อมูลรถ</button>
                    <button class="btn btn-danger" onclick="deleteTruck(${truck.id})">🗑️ ลบรถ</button>
                </div>
            </div>
        `;
    });

    document.getElementById("content").innerHTML = html;
}

// เพิ่มรถพุ่มพวงใหม่
function showAddTruck() {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    const html = `
        <h2>🚚 เพิ่มรถพุ่มพวง</h2>
        <div class="form-group"><label>ชื่อรถ</label><input id="newTruckName" placeholder="เช่น รถพุ่มพวง C" required></div>
        <div class="form-group"><label>ทะเบียน</label><input id="newTruckLicense" placeholder="กรอกทะเบียนรถ" required></div>
        <div class="form-group"><label>สถานที่ให้บริการ</label><input id="newTruckLocation" placeholder="เช่น ตลาดหน้าหมู่บ้าน"></div>
        <div class="form-group"><label>รายละเอียด</label><textarea id="newTruckDescription" rows="3" placeholder="รายละเอียดรถ"></textarea></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
            <button class="btn" onclick="saveNewTruck()">บันทึกรถ</button>
            <button class="btn btn-blue" type="button" onclick="closeModal()">ยกเลิก / ปิด</button>
        </div>`;
    openModal(html);
}

function saveNewTruck() {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    const name = document.getElementById("newTruckName").value.trim();
    const license = document.getElementById("newTruckLicense").value.trim();
    const location = document.getElementById("newTruckLocation").value.trim();
    const description = document.getElementById("newTruckDescription").value.trim();
    if (!name || !license) { alert("กรุณากรอกชื่อรถและทะเบียนรถให้ครบถ้วน"); return; }
    if (trucks.some(t => String(t.license).trim().toLowerCase() === license.toLowerCase())) {
        alert("ทะเบียนรถนี้มีอยู่ในระบบแล้ว"); return;
    }
    trucks.push({ id: Date.now(), name, license, location, description });
    saveData();
    closeModal();
    manageTrucks();
    alert("เพิ่มรถพุ่มพวงเรียบร้อยแล้ว");
}

// เปิดหน้าต่าง Modal แก้ไขข้อมูลรถ
function showEditTruck(truckId) {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    let truck = findTruck(truckId);
    if (!truck) return;

    let html = `
        <h2>✏️ แก้ไขข้อมูลรถพุ่มพวง</h2>
        <div class="form-group">
            <label>ชื่อรถ</label>
            <input id="editTruckName" value="${truck.name}">
        </div>
        <div class="form-group">
            <label>ทะเบียน</label>
            <input id="editTruckLicense" value="${truck.license}">
        </div>
        <div class="form-group">
            <label>สถานที่ให้บริการ</label>
            <input id="editTruckLocation" value="${truck.location}">
        </div>
        <div class="form-group">
            <label>รายละเอียด</label>
            <textarea id="editTruckDescription" rows="3">${truck.description || ''}</textarea>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
            <button class="btn" onclick="saveEditTruck(${truck.id})">💾 บันทึกการแก้ไข</button>
            <button class="btn btn-blue" type="button" onclick="closeModal()">ยกเลิก / ปิด</button>
        </div>
    `;

    openModal(html);
}

// บันทึกข้อมูลรถพุ่มพวงที่แก้ไข
function saveEditTruck(truckId) {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    let truck = findTruck(truckId);
    if (!truck) return;

    let name = document.getElementById("editTruckName").value.trim();
    let license = document.getElementById("editTruckLicense").value.trim();
    let location = document.getElementById("editTruckLocation").value.trim();
    let description = document.getElementById("editTruckDescription").value.trim();

    if (!name || !license) {
        alert("กรุณากรอกชื่อรถและทะเบียนรถให้ครบถ้วน");
        return;
    }

    truck.name = name;
    truck.license = license;
    truck.location = location;
    truck.description = description;

    saveData();
    closeModal();
    manageTrucks();
    alert("อัปเดตข้อมูลรถพุ่มพวงเรียบร้อยแล้ว");
}

function deleteTruck(truckId) {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    if (!confirm("ต้องการลบรถคันนี้หรือไม่?")) return;

    trucks = trucks.filter(truck => truck.id != truckId);
    products = products.filter(product => product.truckId != truckId);
    saveData();
    manageTrucks();
}

function manageProducts() {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    let html = `
        <div style="margin-bottom: 15px;">
            <button class="btn btn-blue" style="width: auto; padding: 6px 14px;" onclick="navigateTo('seller')">← กลับหน้าระบบผู้ขาย</button>
        </div>
        <h2>🥬 จัดการสินค้า</h2>
        <button class="btn" onclick="showAddProduct()">+ เพิ่มสินค้า</button>
        <div class="table-box">
            <table>
                <thead>
                    <tr>
                        <th>สินค้า</th>
                        <th>รถ</th>
                        <th>ราคา</th>
                        <th>จำนวน</th>
                        <th style="text-align: center;">จัดการ</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (products.length === 0) {
        html += `<tr><td colspan="5" style="text-align: center;">ยังไม่มีรายการสินค้า</td></tr>`;
    } else {
        products.forEach(product => {
            let truck = findTruck(product.truckId);
            let unitText = product.unit ? product.unit : "ชิ้น";

            html += `
                <tr>
                    <td><strong>${product.name}</strong></td>
                    <td>${truck ? truck.name : "-"}</td>
                    <td>${formatPrice(product.price)}</td>
                    <td>${product.quantity} ${unitText}</td>
                    <td style="text-align: center;">
                        <button class="btn btn-blue" style="padding: 4px 8px; font-size: 0.85rem;" onclick="showEditProduct(${product.id})">✏️ แก้ไข</button>
                        <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.85rem;" onclick="deleteProduct(${product.id})">🗑️ ลบ</button>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table></div>`;
    document.getElementById("content").innerHTML = html;
}

function showAddProduct() {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    let options = trucks.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
    let html = `
        <h2>เพิ่มสินค้า</h2>
        <div class="form-group"><label>ชื่อสินค้า</label><input id="productName"></div>
        <div class="form-group"><label>รถพุ่มพวง</label><select id="productTruck">${options}</select></div>
        <div class="form-group"><label>ราคา</label><input id="productPrice" type="number"></div>
        <div class="form-group"><label>จำนวน</label><input id="productQuantity" type="number"></div>
        <div class="form-group"><label>หน่วย</label><input id="productUnit" placeholder="เช่น แผง / กำ / กิโลกรัม"></div>
        <div class="form-actions" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
            <button class="btn" onclick="saveProduct()">บันทึกสินค้า</button>
            <button class="btn btn-blue" type="button" onclick="closeModal()">ยกเลิก / ปิด</button>
        </div>
    `;
    openModal(html);
}

function saveProduct() {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    let name = document.getElementById("productName").value.trim();
    let truckId = Number(document.getElementById("productTruck").value);
    let price = Number(document.getElementById("productPrice").value);
    let quantity = Number(document.getElementById("productQuantity").value);
    let unit = document.getElementById("productUnit").value.trim();

    if (!name || price <= 0 || quantity <= 0) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
    }

    // ตรวจสอบว่ารถคันนี้มีสินค้านี้อยู่แล้วหรือไม่
    let existingProduct = products.find(p => p.truckId === truckId && p.name.toLowerCase() === name.toLowerCase());

    if (existingProduct) {
        // ถ้านามซ้ำ ให้ทบจำนวนสต็อกเพิ่มเข้าไปในรายการเดิม
        existingProduct.quantity += quantity;
        existingProduct.price = price; // อัปเดตราคาล่าสุด
        if (unit) existingProduct.unit = unit;
        alert(`พบสินค้า "${name}" ในรถคันนี้อยู่แล้ว ระบบได้ทำการบวกเพิ่มจำนวนสต็อกให้อัตโนมัติ`);
    } else {
        // ถ้าเป็นสินค้าใหม่ ให้สร้างรายการใหม่
        products.push({
            id: Date.now(),
            truckId: truckId,
            name: name,
            price: price,
            quantity: quantity,
            unit: unit !== "" ? unit : "ชิ้น"
        });
        alert("เพิ่มสินค้าเรียบร้อยแล้ว");
    }

    saveData();
    closeModal();
    manageProducts();
}

function showEditProduct(productId) {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    let product = findProduct(productId);
    if (!product) return;

    let options = trucks.map(t => 
        `<option value="${t.id}" ${t.id == product.truckId ? "selected" : ""}>${t.name}</option>`
    ).join("");

    let html = `
        <h2>✏️ แก้ไขสินค้า</h2>
        <div class="form-group"><label>ชื่อสินค้า</label><input id="editProductName" value="${product.name}"></div>
        <div class="form-group"><label>รถพุ่มพวง</label><select id="editProductTruck">${options}</select></div>
        <div class="form-group"><label>ราคา</label><input id="editProductPrice" type="number" value="${product.price}"></div>
        <div class="form-group"><label>จำนวนสต็อก</label><input id="editProductQuantity" type="number" value="${product.quantity}"></div>
        <div class="form-group"><label>หน่วย</label><input id="editProductUnit" value="${product.unit || ''}" placeholder="เช่น แผง / กำ / กิโลกรัม"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
            <button class="btn" onclick="saveEditProduct(${product.id})">💾 บันทึกการแก้ไข</button>
            <button class="btn btn-blue" type="button" onclick="closeModal()">ยกเลิก / ปิด</button>
        </div>
    `;

    openModal(html);
}

function saveEditProduct(productId) {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    let product = findProduct(productId);
    if (!product) return;

    let name = document.getElementById("editProductName").value.trim();
    let truckId = Number(document.getElementById("editProductTruck").value);
    let price = Number(document.getElementById("editProductPrice").value);
    let quantity = Number(document.getElementById("editProductQuantity").value);
    let unit = document.getElementById("editProductUnit").value.trim();

    if (!name || price <= 0 || quantity < 0) {
        alert("กรุณากรอกข้อมูลให้ถูกต้อง");
        return;
    }

    product.name = name;
    product.truckId = truckId;
    product.price = price;
    product.quantity = quantity;
    product.unit = unit || "ชิ้น";

    saveData();
    closeModal();
    manageProducts();
    alert("อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว");
}

function deleteProduct(productId) {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    if (!confirm("คุณต้องการลบสินค้ารายการนี้ใช่หรือไม่?")) return;

    products = products.filter(p => p.id != productId);
    cart = cart.filter(c => c.productId != productId);

    saveData();
    manageProducts();
}

function manageOrders() {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    let content = document.getElementById("content");
    let html = `
        <div style="margin-bottom: 15px;">
            <button class="btn btn-blue" style="width: auto; padding: 6px 14px;" onclick="navigateTo('seller')">← กลับหน้าระบบผู้ขาย</button>
        </div>
        <div class="page-title">
            <h1>📦 รายการออเดอร์ทั้งหมด</h1>
        </div>
    `;

    if (orders.length === 0) {
        html += `<div class="card"><p>ยังไม่มีออเดอร์ในระบบ</p></div>`;
        content.innerHTML = html;
        return;
    }

    for (let i = orders.length - 1; i >= 0; i--) {
        let order = orders[i];

        html += `
            <div class="card" style="margin-bottom: 15px; border-left: 5px solid ${order.paymentStatus === 'ชำระเงินแล้ว' ? '#10b981' : '#f59e0b'};">
                <h3>ออเดอร์ #${order.id}</h3>
                <p><strong>ลูกค้า:</strong> ${order.customerName} (${order.phone})</p>
                <p><strong>ที่อยู่จัดส่ง:</strong> ${order.address || '-'}</p>
                ${order.discount ? `<p style="color: #dc2626;"><strong>ส่วนลดแต้ม:</strong> -${order.discount} บาท</p>` : ''}
                <p><strong>ยอดเงินสุทธิ:</strong> <strong>${formatPrice(order.total)}</strong></p>
                <p><strong>สถานะการชำระเงิน:</strong> <span class="badge">${order.paymentStatus}</span></p>

                <!-- ปุ่มเปิดดูรูปภาพสลิป -->
                <div style="margin: 10px 0;">
                    ${order.slipImage ? `
                        <button class="btn btn-blue" style="width: auto; padding: 6px 12px; font-size: 0.85rem;" onclick="viewSlip('${order.id}')">
                            🖼️ ดูหลักฐานสลิปโอนเงิน
                        </button>
                    ` : '<p style="color: #ef4444; font-size: 0.85rem;">⚠️ ไม่มีหลักฐานสลิป</p>'}
                </div>

                ${order.receiptNumber ? `<p><strong>เลขที่ใบเสร็จ:</strong> ${order.receiptNumber}</p>` : ''}

                <hr style="margin: 10px 0;">

                <div style="margin-bottom: 10px;">
        `;

        if (order.paymentStatus === "รอตรวจสอบ") {
            html += `
                <button class="btn btn-success" style="margin-bottom: 6px;" onclick="confirmPayment(${order.id})">
                    ✅ ยืนยันสลิปถูกต้อง
                </button>
                <button class="btn btn-danger" onclick="rejectPayment(${order.id})">
                    ❌ ปฏิเสธสลิป / ไม่ถูกต้อง
                </button>
            `;
        } else {
            html += `<p style="color: green; font-weight: bold;">✓ ตรวจสอบการชำระเงินเรียบร้อยแล้ว</p>`;
        }

        html += `
                </div>

                <div class="form-group" style="margin-top: 10px;">
                    <label><strong>อัปเดตสถานะการจัดส่ง:</strong></label>
                    <select id="statusSelect_${order.id}" onchange="updateOrderStatus(${order.id}, this.value)" class="form-control" style="padding: 5px; margin-top: 5px;">
                        <option value="รอตรวจสอบ" ${order.status === "รอตรวจสอบ" ? "selected" : ""}>⏳ รอตรวจสอบ</option>
                        <option value="กำลังเตรียมสินค้า" ${order.status === "กำลังเตรียมสินค้า" ? "selected" : ""}>👨‍🍳 กำลังเตรียมสินค้า</option>
                        <option value="พร้อมจัดส่ง" ${order.status === "พร้อมจัดส่ง" ? "selected" : ""}>🚚 พร้อมจัดส่ง</option>
                        <option value="จัดส่งสำเร็จ" ${order.status === "จัดส่งสำเร็จ" ? "selected" : ""}>✅ จัดส่งสำเร็จ</option>
                        <option value="ยกเลิกออเดอร์" ${order.status === "ยกเลิกออเดอร์" ? "selected" : ""}>❌ ยกเลิกออเดอร์</option>
                    </select>
                </div>
            </div>
        `;
    }

    content.innerHTML = html;
}

// ฟังก์ชันแสดงรูปสลิปขยายใหญ่ใน Modal
function viewSlip(orderId) {
    let order = orders.find(o => o.id == orderId);
    if (!order || !order.slipImage) return;

    let html = `
        <div style="text-align: center;">
            <h2>🖼️ หลักฐานการโอนเงิน (ออเดอร์ #${order.id})</h2>
            <p>ยอดโอนสุทธิ: <strong>${formatPrice(order.total)}</strong></p>
            <hr style="margin: 12px 0;">
            <img src="${order.slipImage}" alt="สลิปการโอนเงิน" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="margin-top: 16px;">
                <button class="btn btn-blue" onclick="closeModal()">ปิดหน้าต่าง</button>
            </div>
        </div>
    `;

    openModal(html);
}

function confirmPayment(orderId) {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    let order = orders.find(o => o.id == orderId);
    if (!order) return;
    if (order.paymentStatus === "ชำระเงินแล้ว") { alert("ออเดอร์นี้ยืนยันชำระเงินไปแล้ว"); return; }
    if (order.paymentStatus !== "รอตรวจสอบ") { alert("สถานะการชำระเงินไม่อนุญาตให้ยืนยัน"); return; }

    if (!confirm(`ยืนยันการชำระเงินสำหรับออเดอร์ #${orderId} ใช่หรือไม่?`)) return;

    order.paymentStatus = "ชำระเงินแล้ว";
    order.status = "กำลังเตรียมสินค้า";
    order.receiptNumber = getReceiptNumber(order.id);

    let earnedPoints = Math.floor(order.total / 100);
    let customer = users.find(u => u.id == order.customerId);
    
    if (customer) {
        customer.points = (customer.points || 0) + earnedPoints;
        if (currentUser && currentUser.id == customer.id) {
            currentUser.points = customer.points;
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }
    }

    saveData();
    renderNavbar();
    alert(`อนุมัติการชำระเงินเรียบร้อยแล้ว (ลูกค้าได้รับ +${earnedPoints} แต้มสะสม)`);
    manageOrders();
}

function restoreOrderStock(order) {
    if (!order || order.stockRestored) return;
    (order.items || []).forEach(item => {
        const product = findProduct(item.productId);
        if (product) product.quantity = Number(product.quantity || 0) + Number(item.quantity || 0);
    });
    order.stockRestored = true;
}

function rejectPayment(orderId) {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    const order = orders.find(o => o.id == orderId);
    if (!order || order.status === "ยกเลิกออเดอร์") return;
    if (order.paymentStatus !== "รอตรวจสอบ") { alert("ออเดอร์นี้ไม่ได้อยู่ในสถานะรอตรวจสอบ"); return; }
    if (!confirm(`ต้องการปฏิเสธสลิปโอนเงินของออเดอร์ #${orderId} ใช่หรือไม่?`)) return;

    // คืนแต้มที่ใช้แลกส่วนลด และคืนสต็อกเพียงครั้งเดียว
    if (order.discount > 0 && !order.pointsRestored) {
        const customer = users.find(u => u.id == order.customerId);
        if (customer) customer.points = Number(customer.points || 0) + Number(order.discount);
        order.pointsRestored = true;
    }
    restoreOrderStock(order);
    order.paymentStatus = "ชำระเงินไม่ถูกต้อง";
    order.status = "ยกเลิกออเดอร์";
    saveData();
    alert("ปฏิเสธสลิปแล้ว คืนสต็อกสินค้าและแต้มส่วนลด (ถ้ามี) เรียบร้อย");
    manageOrders();
}

function updateOrderStatus(orderId, newStatus) {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    const order = orders.find(o => o.id == orderId);
    if (!order) return;
    if (order.status === "ยกเลิกออเดอร์") { alert("ออเดอร์ที่ยกเลิกแล้วไม่สามารถเปลี่ยนสถานะได้"); manageOrders(); return; }
    if (newStatus === "ยกเลิกออเดอร์") {
        if (!confirm(`ยืนยันยกเลิกออเดอร์ #${orderId} และคืนสต็อกสินค้าใช่หรือไม่?`)) { manageOrders(); return; }
        restoreOrderStock(order);
        if (order.discount > 0 && !order.pointsRestored) {
            const customer = users.find(u => u.id == order.customerId);
            if (customer) customer.points = Number(customer.points || 0) + Number(order.discount);
            order.pointsRestored = true;
        }
    }
    order.status = newStatus;
    saveData();
    alert(`อัปเดตสถานะออเดอร์ #${orderId} เป็น "${newStatus}" เรียบร้อยแล้ว`);
    manageOrders();
}

/* =====================================================
   13. ใบเสร็จรับเงิน & รายงานยอดขาย
===================================================== */

function showReceipt(orderId) {
    let order = orders.find(o => o.id == orderId);
    if (!order) return;

    let truck = findTruck(order.truckId);

    let html = `
        <div class="receipt">
            <div class="receipt-header">
                <h1>🚚 รถพุ่มพวง</h1>
                <h2>ใบเสร็จรับเงิน</h2>
                <p>เลขที่ใบเสร็จ: ${order.receiptNumber}</p>
                <p>วันที่: ${new Date(order.date).toLocaleString("th-TH")}</p>
            </div>
            <p><strong>ลูกค้า:</strong> ${order.customerName}</p>
            <p><strong>เบอร์โทร:</strong> ${order.phone}</p>
            <p><strong>รถ:</strong> ${truck ? truck.name : "-"}</p>
            <hr>
            <table>
                <tr>
                    <th>สินค้า</th>
                    <th>จำนวน</th>
                    <th>ราคา</th>
                </tr>
    `;

    order.items.forEach(item => {
        html += `
            <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.subtotal)}</td>
            </tr>
        `;
    });

    html += `
            </table>
            ${order.discount ? `<p style="text-align: right; color: #dc2626; margin-top: 10px;">ส่วนลดจากแต้มสะสม: -${order.discount} บาท</p>` : ''}
            <div class="receipt-total">รวมทั้งสิ้น: ${formatPrice(order.total)}</div>
            <p>วิธีชำระเงิน: ${order.paymentMethod}</p>
            <p>สถานะ: ชำระเงินแล้ว</p>
            <br>
            <div style="text-align:center">
                <p>ขอบคุณที่ใช้บริการ</p>
                <button class="btn" onclick="window.print()">🖨️ พิมพ์ใบเสร็จ</button>
            </div>
        </div>
    `;

    openModal(html);
}

function showSalesReport() {
    if (!currentUser || currentUser.role !== "seller") { alert("ต้องเข้าสู่ระบบผู้ขายที่ได้รับอนุญาตก่อน"); return; }
    let today = getToday();
    let month = getCurrentMonth();

    let todayOrders = orders.filter(o => o.date.substring(0, 10) === today && o.paymentStatus === "ชำระเงินแล้ว");
    let monthOrders = orders.filter(o => o.date.substring(0, 7) === month && o.paymentStatus === "ชำระเงินแล้ว");

    let todayTotal = todayOrders.reduce((sum, o) => sum + o.total, 0);
    let monthTotal = monthOrders.reduce((sum, o) => sum + o.total, 0);

    let content = document.getElementById("content");
    content.innerHTML = `
        <div style="margin-bottom: 15px;">
            <button class="btn btn-blue" style="width: auto; padding: 6px 14px;" onclick="navigateTo('seller')">← กลับหน้าระบบผู้ขาย</button>
        </div>
        <div class="page-title">
            <h1>📊 รายงานยอดขาย</h1>
            <p>แสดงเฉพาะออเดอร์ที่ชำระเงินแล้ว</p>
        </div>
        <div class="report-container">
            <div class="report-card">
                <h3>📅 ยอดขายวันนี้</h3>
                <h2>${formatPrice(todayTotal)}</h2>
                <p>${todayOrders.length} ออเดอร์</p>
            </div>
            <div class="report-card">
                <h3>📆 ยอดขายเดือนนี้</h3>
                <h2>${formatPrice(monthTotal)}</h2>
                <p>${monthOrders.length} ออเดอร์</p>
            </div>
            <div class="report-card">
                <h3>🧾 ใบเสร็จเดือนนี้</h3>
                <h2>${monthOrders.length}</h2>
                <p>ใบเสร็จ</p>
            </div>
        </div>
        <br>
        <div class="card">
            <h2>รายการขายวันนี้</h2>
            <div class="table-box">
                <table>
                    <tr>
                        <th>ออเดอร์</th>
                        <th>ลูกค้า</th>
                        <th>เวลา</th>
                        <th>ยอดเงิน</th>
                    </tr>
                    ${createSalesRows(todayOrders)}
                </table>
            </div>
        </div>
    `;
}

function createSalesRows(orderList) {
    if (orderList.length === 0) {
        return `<tr><td colspan="4" style="text-align:center;">ยังไม่มีรายการขายวันนี้</td></tr>`;
    }

    return orderList.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customerName}</td>
            <td>${new Date(order.date).toLocaleTimeString("th-TH")}</td>
            <td>${formatPrice(order.total)}</td>
        </tr>
    `).join("");
}

/* =====================================================
   14. ควบคุม Modal
===================================================== */

function openModal(html) {
    document.getElementById("modalContent").innerHTML = html;
    document.getElementById("modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
}

/* =====================================================
   15. เริ่มต้นระบบ (Initialize App)
===================================================== */

/* =====================================================
   ระบบขายด่วน POS สำหรับผู้ขาย
===================================================== */
let posCart = JSON.parse(localStorage.getItem("posCart") || "[]");
function savePOSData() { localStorage.setItem("posCart", JSON.stringify(posCart)); }
function showPOS() {
    if (!currentUser || currentUser.role !== "seller") { alert("ระบบขายด่วนสำหรับผู้ขายเท่านั้น"); showLogin(); return; }
    const sales = JSON.parse(localStorage.getItem("posSales") || "[]");
    const today = getToday();
    const todaySales = sales.filter(s => String(s.date).slice(0,10) === today);
    const totalToday = todaySales.reduce((sum,s) => sum + Number(s.total || 0), 0);
    const query = window.posSearch || "";
    const filtered = products.filter(p => Number(p.quantity) > 0 && String(p.name).toLowerCase().includes(query.toLowerCase()));
    const cartTotal = posCart.reduce((sum,item) => sum + item.price * item.qty, 0);
    const content = document.getElementById("content");
    content.innerHTML = `
      <div class="pos-page">
        <div class="pos-top"><div><p class="pos-kicker">SELLER CHECKOUT</p><h1>🧾 ระบบขายด่วน POS</h1><p>ขายหน้าร้านได้ทันที ไม่ต้องสร้างออเดอร์ออนไลน์</p></div><button class="btn btn-blue" onclick="navigateTo('seller')">← กลับแดชบอร์ด</button></div>
        <div class="pos-stats"><div><small>ยอดขายวันนี้</small><strong>${formatPrice(totalToday)}</strong></div><div><small>บิลวันนี้</small><strong>${todaySales.length} บิล</strong></div><div><small>สินค้าในระบบ</small><strong>${products.length} รายการ</strong></div></div>
        <div class="pos-layout"><section class="pos-products"><div class="pos-search"><input id="posSearchInput" value="${escapeHTML(query)}" placeholder="ค้นหาสินค้า เช่น ไข่ไก่, ผักบุ้ง" oninput="window.posSearch=this.value;renderPOSProducts()"><span>🔎</span></div><div id="posProductGrid" class="pos-product-grid">${renderPOSProductCards(filtered)}</div></section>
        <aside class="pos-checkout"><div class="pos-checkout-head"><div><h2>🛒 รายการขาย</h2><small>${posCart.reduce((n,i)=>n+i.qty,0)} ชิ้น</small></div><button class="pos-clear" onclick="clearPOSCart()">ล้างรายการ</button></div>
        <div class="pos-cart-items">${posCart.length ? posCart.map((item,i)=>`<div class="pos-cart-row"><div class="pos-cart-name"><strong>${escapeHTML(item.name)}</strong><small>${formatPrice(item.price)} / ${escapeHTML(item.unit || 'ชิ้น')}</small></div><div class="pos-qty"><button onclick="changePOSQty(${i},-1)">−</button><b>${item.qty}</b><button onclick="changePOSQty(${i},1)">+</button></div><strong class="pos-line-total">${formatPrice(item.price*item.qty)}</strong><button class="pos-remove" title="ลบ" onclick="removePOSItem(${i})">×</button></div>`).join("") : `<div class="pos-empty"><span>🧺</span><strong>ยังไม่มีสินค้า</strong><small>เลือกสินค้าทางซ้ายเพื่อเริ่มขาย</small></div>`}</div>
        <div class="pos-total"><span>ยอดรวม</span><strong>${formatPrice(cartTotal)}</strong></div><label class="pos-label" for="posPayment">วิธีชำระเงิน</label><select id="posPayment"><option value="เงินสด">เงินสด</option><option value="โอนเงิน">โอนเงิน</option><option value="คนละครึ่ง/อื่น ๆ">อื่น ๆ</option></select><label class="pos-label" for="posReceived">รับเงินมา (บาท)</label><input id="posReceived" type="number" min="0" step="0.01" value="${cartTotal}" oninput="updatePOSChange()"><div class="pos-change"><span>เงินทอน</span><strong id="posChange">${formatPrice(0)}</strong></div><button class="pos-pay-btn" onclick="completePOSSale()" ${posCart.length ? "" : "disabled"}>✓ รับชำระเงินและออกใบเสร็จ</button><p class="pos-note">การขายจะตัดสต็อกสินค้าและบันทึกยอดขายในเบราว์เซอร์นี้</p></aside></div>
      </div>`;
    updatePOSChange();
}
function renderPOSProductCards(list) {
 return list.map(p=>`<button class="pos-product" onclick="addPOSItem(${Number(p.id)})"><span class="pos-product-icon">${posEmoji(p.name)}</span><strong>${escapeHTML(p.name)}</strong><small>${Number(p.quantity)} ${escapeHTML(p.unit||'ชิ้น')} คงเหลือ</small><b>${formatPrice(Number(p.price))}<small> / ${escapeHTML(p.unit||'ชิ้น')}</small></b><span class="pos-add">+ เพิ่มลงบิล</span></button>`).join("") || `<div class="pos-no-products">ไม่พบสินค้า หรือสินค้าหมด</div>`;
}
function renderPOSProducts() { const el=document.getElementById('posProductGrid'); const input=document.getElementById('posSearchInput'); if(el) el.innerHTML=renderPOSProductCards(products.filter(p=>Number(p.quantity)>0 && String(p.name).toLowerCase().includes((input?.value||'').toLowerCase()))); }
function posEmoji(name) { const n=String(name); if(/ผัก|แตง|คะน้า|บุ้ง/.test(n)) return '🥬'; if(/ไข่/.test(n)) return '🥚'; if(/หมู|ไก่|เนื้อ/.test(n)) return '🥩'; if(/ผลไม้|ส้ม|กล้วย|มะม่วง/.test(n)) return '🍎'; return '🛍️'; }
function addPOSItem(id) { const p=products.find(x=>Number(x.id)===Number(id)); if(!p || Number(p.quantity)<=0) return alert('สินค้าหมด'); const item=posCart.find(x=>Number(x.id)===Number(id)); if(item){ if(item.qty>=Number(p.quantity)) return alert('จำนวนสินค้าไม่เพียงพอ'); item.qty++; } else posCart.push({id:p.id,name:p.name,price:Number(p.price),unit:p.unit||'ชิ้น',qty:1}); savePOSData(); showPOS(); }
function changePOSQty(index,delta) { const item=posCart[index]; if(!item)return; const p=products.find(x=>Number(x.id)===Number(item.id)); const next=item.qty+delta; if(next<=0){posCart.splice(index,1);} else if(!p||next>Number(p.quantity)){alert('จำนวนสินค้าในสต็อกไม่เพียงพอ');return;} else item.qty=next; savePOSData(); showPOS(); }
function removePOSItem(index){posCart.splice(index,1);savePOSData();showPOS();}
function clearPOSCart(){if(!posCart.length)return;if(confirm('ต้องการล้างรายการขายทั้งหมดหรือไม่?')){posCart=[];savePOSData();showPOS();}}
function updatePOSChange(){const total=posCart.reduce((s,i)=>s+i.price*i.qty,0);const received=Number(document.getElementById('posReceived')?.value||0);const el=document.getElementById('posChange');if(el)el.textContent=formatPrice(Math.max(0,received-total));}
function completePOSSale(){if(!currentUser||currentUser.role!=='seller')return alert('เฉพาะผู้ขายเท่านั้น');if(!posCart.length)return alert('กรุณาเลือกสินค้าก่อน');const total=posCart.reduce((s,i)=>s+i.price*i.qty,0);const received=Number(document.getElementById('posReceived')?.value||0);if(received<total)return alert('จำนวนเงินที่รับไม่เพียงพอ');for(const item of posCart){const p=products.find(x=>Number(x.id)===Number(item.id));if(!p||Number(p.quantity)<item.qty)return alert('สต็อกสินค้า '+item.name+' ไม่เพียงพอ กรุณาตรวจสอบใหม่');}const sale={id:'POS-'+Date.now().toString().slice(-8),date:new Date().toISOString(),sellerId:currentUser.id,sellerName:currentUser.name,items:posCart.map(i=>({...i})),total,paymentMethod:document.getElementById('posPayment')?.value||'เงินสด',received,change:received-total};for(const item of posCart){const p=products.find(x=>Number(x.id)===Number(item.id));p.quantity=Number(p.quantity)-item.qty;}const sales=JSON.parse(localStorage.getItem('posSales')||'[]');sales.push(sale);localStorage.setItem('posSales',JSON.stringify(sales));saveData();posCart=[];savePOSData();window.lastPOSSale=sale;showPOSReceipt(sale);}
function showPOSReceipt(sale){const content=document.getElementById('content');content.innerHTML=`<div class="pos-receipt-wrap"><div class="pos-receipt" id="posReceipt"><div class="receipt-logo">🚚</div><h1>รถพุ่มพวง</h1><p>ใบเสร็จรับเงิน / POS</p><hr><div class="receipt-meta"><span>เลขที่บิล</span><strong>${sale.id}</strong><span>วันที่</span><strong>${new Date(sale.date).toLocaleString('th-TH')}</strong><span>ผู้ขาย</span><strong>${escapeHTML(sale.sellerName)}</strong></div><hr>${sale.items.map(i=>`<div class="receipt-item"><span>${escapeHTML(i.name)} × ${i.qty}</span><strong>${formatPrice(i.price*i.qty)}</strong></div>`).join('')}<hr><div class="receipt-total"><span>รวมสุทธิ</span><strong>${formatPrice(sale.total)}</strong></div><div class="receipt-meta"><span>ชำระโดย</span><strong>${escapeHTML(sale.paymentMethod)}</strong><span>รับเงิน</span><strong>${formatPrice(sale.received)}</strong><span>เงินทอน</span><strong>${formatPrice(sale.change)}</strong></div><p class="receipt-thanks">ขอบคุณที่อุดหนุนครับ 🙏</p></div><div class="receipt-actions"><button class="btn" onclick="window.print()">🖨️ พิมพ์ใบเสร็จ</button><button class="btn btn-blue" onclick="navigateTo('pos')">ขายรายการถัดไป</button><button class="btn btn-blue" onclick="navigateTo('seller')">กลับแดชบอร์ด</button></div></div>`;}

function initApp() {
    renderNavbar();
    let savedPage = JSON.parse(localStorage.getItem("currentPage"));

    if (savedPage && savedPage.name) {
        navigateTo(savedPage.name, savedPage.param);
    } else {
        navigateTo("home");
    }
}

// เริ่มการทำงานระบบเมื่อโหลดไฟล์
initApp();
