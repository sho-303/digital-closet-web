// ==========================================
// purchase-check.js (保存・画像対応 修正完全版)
// File: js/purchase-check.js
// Date: 2026-10-29
// Creator: K025C2093 吉川蔣
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const API_BASE = `http://${window.location.hostname}:5001`;
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB上限

    // 1. ログイン中のユーザー情報をチェック
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id;

    if (!userId) {
        alert("ログインしていません。ログイン画面へ移動します。");
        window.location.href = "login.html";
        return;
    }

    // 2. DOM要素の取得
    const listContainer = document.getElementById("purchaseList");
    const emptyState = document.getElementById("purchaseEmptyState");
    const addBtn = document.getElementById("openAddModalBtn");
    const modal = document.getElementById("purchaseModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const itemForm = document.getElementById("purchaseForm");

    // モーダル内フォーム要素
    const itemIdInput = document.getElementById("purchaseItemId");
    const nameInput = document.getElementById("purchaseName");
    const priceInput = document.getElementById("purchasePrice");
    const categoryInput = document.getElementById("purchaseCategory");
    const memoInput = document.getElementById("purchaseMemo");
    const imageInput = document.getElementById("purchaseImage");
    const modalTitle = document.getElementById("modalTitle");

    let uploadedImageBase64 = ""; // 画像データの保持用

    // 画像ファイルが選択されたときの処理（Base64変換を確実に実行）
    if (imageInput) {
        imageInput.addEventListener("change", (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                alert("画像ファイルを選択してください。");
                imageInput.value = "";
                return;
            }

            if (file.size > MAX_IMAGE_SIZE) {
                alert("画像サイズは5MB以下にしてください。");
                imageInput.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                uploadedImageBase64 = event.target.result;
            };
            reader.onerror = (error) => {
                console.error("画像の読み込みに失敗しました:", error);
                alert("画像の読み込みに失敗しました。");
            };
            reader.readAsDataURL(file);
        });
    }

    // 3. URLパラメータから値を受け取って自動入力
    const urlParams = new URLSearchParams(window.location.search);
    const paramName = urlParams.get("name");
    const paramCategory = urlParams.get("category");

    if (paramName && nameInput) {
        nameInput.value = paramName;
    }
    if (paramCategory && categoryInput) {
        categoryInput.value = paramCategory;
    }

    // 4. データの初期読み込み
    loadPurchaseItems();

    // --- イベントリスナー設定 ---

    if (addBtn) {
        addBtn.addEventListener("click", () => {
            resetForm();
            modalTitle.textContent = "購入候補の追加";
            openModal();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeModal);
    }

    window.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    // フォーム送信（新規保存または編集更新）
    if (itemForm) {
        itemForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = nameInput ? nameInput.value.trim() : "";
            const price = priceInput && priceInput.value ? Number(priceInput.value) : 0;
            const category = categoryInput ? categoryInput.value : "未分類";
            const memo = memoInput ? memoInput.value.trim() : "";

            const imageVal = uploadedImageBase64;

            if (!name) {
                alert("商品名を入力してください。");
                if (nameInput) nameInput.focus();
                return;
            }

            const payload = {
                user_id: userId,
                name: name,
                price: price,
                category: category,
                memo: memo,
                image: imageVal
            };

            const editId = itemIdInput ? itemIdInput.value : "";

            try {
                let res;
                if (editId) {
                    // 編集更新 (PUT)
                    res = await fetch(`${API_BASE}/purchase-items/${editId}?user_id=${userId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                } else {
                    // 新規追加 (POST)
                    res = await fetch(`${API_BASE}/purchase-items`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                }

                if (res.ok) {
                    closeModal();
                    loadPurchaseItems();
                    if (typeof window.showToast === "function") {
                        window.showToast(editId ? "購入候補を更新しました！" : "購入候補を追加しました！");
                    }
                } else {
                    const errData = await res.json().catch(() => ({}));
                    console.error("サーバー保存エラー詳細:", errData);
                    alert("保存に失敗しました。入力内容を確認してください。");
                }
            } catch (err) {
                console.error("保存通信エラー:", err);
                alert("サーバーとの通信に失敗しました。");
            }
        });
    }

    // --- データの読み込み＆描画（バックエンド連携） ---
    async function loadPurchaseItems() {
        try {
            const res = await fetch(`${API_BASE}/purchase-items?user_id=${userId}`);
            if (!res.ok) return;
            const items = await res.json();

            if (!listContainer) return;
            listContainer.innerHTML = "";

            if (!Array.isArray(items) || items.length === 0) {
                if (emptyState) emptyState.style.display = "block";
                return;
            }

            if (emptyState) emptyState.style.display = "none";

            items.forEach(item => {
                const card = document.createElement("div");
                card.className = "purchase-card";
                card.style.cssText = "border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; background-color: var(--card-bg, #fff); display: flex; gap: 12px; align-items: center;";

                // 画像プロパティの網羅的チェック
                const imgSrc = item.image_url || item.imageUrl || item.image || item.path || item.image_path || "https://via.placeholder.com/80?text=No+Image";
                const priceText = item.price ? `¥${Number(item.price).toLocaleString()}` : "価格未設定";

                card.innerHTML = `
                    <img src="${imgSrc}" alt="${item.name || '商品画像'}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; flex-shrink: 0;" onerror="this.src='https://via.placeholder.com/80?text=No+Image';">
                    <div style="flex-grow: 1;">
                        <h4 style="margin: 0 0 4px 0; font-size: 16px;">${item.name || ''}</h4>
                        <p style="margin: 0; font-size: 14px; color: #e53e3e; font-weight: bold;">${priceText}</p>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #718096;">カテゴリ: ${item.category || '未設定'} ${item.memo ? '│ ' + item.memo : ''}</p>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <button class="btn-check" data-name="${item.name || ''}" data-category="${item.category || ''}" style="padding: 6px 10px; font-size: 11px; border-radius: 4px; border: 1px solid #3182ce; background: #ebf8ff; color: #2b6cb0; cursor: pointer;">相性をチェック</button>
                        <button class="btn-edit" style="padding: 6px 10px; font-size: 11px; border-radius: 4px; border: 1px solid #cbd5e0; background: #edf2f7; cursor: pointer;">編集</button>
                        <button class="btn-delete" style="padding: 6px 10px; font-size: 11px; border-radius: 4px; border: none; background: #fed7d7; color: #9b2c2c; cursor: pointer;">削除</button>
                    </div>
                `;

                // 「相性をチェック」ボタン
                card.querySelector(".btn-check").addEventListener("click", () => {
                    window.location.href = `ai-purchase.html?name=${encodeURIComponent(item.name || '')}&category=${encodeURIComponent(item.category || '')}`;
                });

                card.querySelector(".btn-edit").addEventListener("click", () => openEditModal(item));
                card.querySelector(".btn-delete").addEventListener("click", () => deleteItem(item.id));

                listContainer.appendChild(card);
            });
        } catch (e) {
            console.error("購入候補リストの読み込みエラー:", e);
        }
    }

    // アイテムの削除
    async function deleteItem(id) {
        if (!confirm("この購入候補を削除しますか？")) return;

        try {
            const res = await fetch(`${API_BASE}/purchase-items/${id}?user_id=${userId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                loadPurchaseItems();
                if (typeof window.showToast === "function") {
                    window.showToast("削除しました。");
                }
            }
        } catch (e) {
            console.error("削除エラー:", e);
        }
    }

    // 編集モーダルを開く
    function openEditModal(target) {
        if (itemIdInput) itemIdInput.value = target.id;
        if (nameInput) nameInput.value = target.name || "";
        if (priceInput) priceInput.value = target.price || "";
        if (categoryInput) categoryInput.value = target.category || "";
        if (memoInput) memoInput.value = target.memo || "";
        
        // 既存の画像データを保持
        uploadedImageBase64 = target.image_url || target.imageUrl || target.image || target.path || target.image_path || "";
        if (imageInput) {
            imageInput.value = "";
        }

        if (modalTitle) modalTitle.textContent = "購入候補の編集";
        openModal();
    }

    function openModal() {
        if (modal) modal.style.display = "block";
    }

    function closeModal() {
        if (modal) modal.style.display = "none";
        resetForm();
    }

    function resetForm() {
        if (itemForm) itemForm.reset();
        if (itemIdInput) itemIdInput.value = "";
        uploadedImageBase64 = "";
    }
});