// ==========================================
// 統合版スクリプト (服の表示 ＋ メニューバー機能)
// Creator: K025C2093 吉川蔣
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------
  // 1. メニューバー（ドロワーメニュー）の機能
  // ----------------------------------------
  function setupDrawerMenu() {
    const menuButton = document.querySelector(".menu-button");
    if (!menuButton || document.getElementById("drawerMenu")) return;

    let userName = "";
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      userName = currentUser.name || currentUser.username || "";
    } catch (e) {}

    const overlay = document.createElement("div");
    overlay.id = "menuOverlay";
    Object.assign(overlay.style, {
      position: "fixed", inset: "0", background: "rgba(0, 0, 0, 0.45)",
      opacity: "0", visibility: "hidden", transition: "opacity 0.2s ease, visibility 0.2s ease", zIndex: "9998"
    });

    const drawer = document.createElement("aside");
    drawer.id = "drawerMenu";
    Object.assign(drawer.style, {
      position: "fixed", top: "0", right: "0", width: "min(300px, 85vw)", height: "100%",
      padding: "28px 20px", boxSizing: "border-box", overflowY: "auto",
      transform: "translateX(100%)", transition: "transform 0.2s ease", zIndex: "9999", visibility: "hidden",
      background: "#ffffff", color: "#222222"
    });

    const heading = document.createElement("h2");
    heading.textContent = "MENU";
    Object.assign(heading.style, { fontSize: "18px", fontWeight: "600", margin: "0 0 16px" });
    drawer.appendChild(heading);

    if (userName) {
      const userLabel = document.createElement("p");
      userLabel.textContent = userName;
      Object.assign(userLabel.style, { fontSize: "12px", margin: "0 0 24px", color: "#777777" });
      drawer.appendChild(userLabel);
    }

    const nav = document.createElement("nav");
    const links = [
      ["ホーム", "index.html"],
      ["クローゼット", "closet.html"],
      ["コーディネート", "coordinate.html"],
      ["服を登録", "add-cloth.html"],
      ["コーデ提案", "ai-outfit.html"],
      ["顔・骨格診断", "diagnosis.html"],
      ["おすすめ商品", "recommend.html"],
      ["クローゼット分析", "analytics.html"],
      ["購入候補チェック", "ai-purchase.html"],
      ["購入候補リスト", "purchase-check.html"],
      ["プロフィール・設定", "profile.html"]
    ];

    links.forEach(([label, href]) => {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      Object.assign(link.style, {
        display: "block", padding: "13px 0", textDecoration: "none", fontSize: "14px", borderBottom: "1px solid #eeeeee", color: "inherit"
      });
      link.addEventListener("click", closeDrawer);
      nav.appendChild(link);
    });
    drawer.appendChild(nav);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "閉じる";
    Object.assign(closeButton.style, { width: "100%", marginTop: "24px", padding: "12px", border: "1px solid #ccc", borderRadius: "6px", cursor: "pointer", background: "#fff" });
    closeButton.addEventListener("click", closeDrawer);
    drawer.appendChild(closeButton);

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.textContent = "ログアウト";
    Object.assign(logoutButton.style, { width: "100%", marginTop: "10px", padding: "12px", border: "none", borderRadius: "6px", cursor: "pointer", background: "#222", color: "#fff" });
    logoutButton.addEventListener("click", () => {
      if (!confirm("ログアウトしますか？")) return;
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
    });
    drawer.appendChild(logoutButton);

    document.body.append(overlay, drawer);

    function openDrawer() {
      drawer.style.visibility = "visible";
      overlay.style.visibility = "visible";
      requestAnimationFrame(() => {
        drawer.style.transform = "translateX(0)";
        overlay.style.opacity = "1";
      });
      menuButton.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
      drawer.style.transform = "translateX(100%)";
      overlay.style.opacity = "0";
      menuButton.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      setTimeout(() => {
        drawer.style.visibility = "hidden";
        overlay.style.visibility = "hidden";
      }, 200);
    }

    menuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      if (isOpen) closeDrawer();
      else openDrawer();
    });

    overlay.addEventListener("click", closeDrawer);
  }

  // メニューバーの初期化を実行
  setupDrawerMenu();


  // ----------------------------------------
  // 2. 服一覧の取得・表示機能
  // ----------------------------------------
  const clothesGrid = document.getElementById('clothesGrid');
  const resultCount = document.getElementById('resultCount');
  const clothesCount = document.getElementById('clothesCount');
  const emptyState = document.getElementById('emptyState');

  function getImageUrl(item) {
    const path = item.image_url || item.imageUrl || item.image || item.path || item.image_path;
    if (!path) return null;

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    const SERVER_BASE = 'http://127.0.0.1:5001'; 
    return path.startsWith('/') ? `${SERVER_BASE}${path}` : `${SERVER_BASE}/${path}`;
  }

  function createCardHTML(item) {
    const imageUrl = getImageUrl(item);
    const imageHTML = imageUrl
      ? `<img src="${imageUrl}" alt="${item.name || '服の画像'}" onerror="this.onerror=null; this.parentElement.textContent='画像なし';">`
      : `<span class="no-image">画像なし</span>`;

    return `
      <article class="clothes-card">
        <div class="clothes-image">
          ${imageHTML}
        </div>
        <div class="clothes-info">
          <h3>${item.name || '名称未設定'}</h3>
          <p class="category">${item.category_name || item.category || 'カテゴリ未設定'}</p>
          <p class="color">色：${item.color || '未指定'}</p>
          ${item.brand ? `<p class="brand">ブランド：${item.brand}</p>` : ''}
          <a href="cloth-detail.html?id=${item.id}" class="detail-button">詳細・編集を見る</a>
        </div>
      </article>
    `;
  }

  function renderClothes(items) {
    if (!items || items.length === 0) {
      if (clothesGrid) clothesGrid.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      if (resultCount) resultCount.textContent = '0着表示 / 全0着';
      if (clothesCount) clothesCount.textContent = '0';
      return;
    }

    if (emptyState) emptyState.hidden = true;
    if (clothesCount) clothesCount.textContent = items.length;
    if (resultCount) resultCount.textContent = `${items.length}着表示 / 全${items.length}着`;

    if (clothesGrid) {
      clothesGrid.innerHTML = items.map(item => createCardHTML(item)).join('');
    }
  }

  async function fetchClothes() {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const userParam = currentUser.id ? `?user_id=${currentUser.id}` : "";

      const response = await fetch(`http://127.0.0.1:5001/items${userParam}`);
      if (!response.ok) throw new Error('データ取得に失敗しました');
      const data = await response.json();
      renderClothes(data);
    } catch (error) {
      console.warn('API取得失敗。LocalStorageからの取得を試みます:', error);
      const localData = JSON.parse(localStorage.getItem('clothes') || '[]');
      renderClothes(localData);
    }
  }

  fetchClothes();
});