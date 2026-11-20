// ==========================================
// index.js (バックエンド＆ユーザー個別対応版)
// File: js/index.js
// Date: 2026-10-22
// Creator: K025C2093 吉川蔣
// ==========================================

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = `http://${window.location.hostname}:5001`;

    // 1. ログイン中のユーザー情報をチェックしてユーザーIDを取得する
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id;

    if (!userId) {
        // ログインしていなければ共通の common.js 側で弾かれますが念のため
        return;
    }

    const API_URL = `${API_BASE}/items?user_id=${userId}`;

    const closetGrid = document.getElementById("closetGrid");
    const emptyState = document.getElementById("emptyState");

    if (!closetGrid) {
        return;
    }

    // HTML要素を安全に作成
    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        if (text !== undefined && text !== null) {
            element.textContent = text;
        }
        return element;
    }

    // 服の画像を作成
    function createClothImage(item) {
        const imageContainer = createElement("div", "item-image-placeholder");
        imageContainer.setAttribute("aria-label", "服の画像");

        let imageSource = item.image_url || item.image || item.imageUrl || "";
        if (imageSource && imageSource.startsWith("/")) {
            imageSource = `${API_BASE}${imageSource}`;
        }

        if (!imageSource) {
            imageContainer.textContent = "NO IMAGE";
            return imageContainer;
        }

        const image = document.createElement("img");
        image.src = imageSource;
        image.alt = item.name || "登録した服";
        image.loading = "lazy";
        image.decoding = "async";

        image.addEventListener("error", () => {
            image.remove();
            imageContainer.textContent = "NO IMAGE";
        });

        imageContainer.appendChild(image);
        return imageContainer;
    }

    // 服のカードを作成
    function createClothCard(item) {
        const card = createElement("article", "item-card");

        card.appendChild(createClothImage(item));

        const info = createElement("div", "item-info");

        const category = createElement(
            "p",
            "item-category",
            item.category || "カテゴリー未設定"
        );

        const name = createElement(
            "h2",
            "item-name",
            item.name || "名称未設定"
        );

        const color = createElement(
            "p",
            "item-color",
            `色：${item.color || "未設定"}`
        );

        info.append(category, name, color);

        if (item.brand) {
            info.appendChild(
                createElement("p", "item-brand", `ブランド：${item.brand}`)
            );
        }

        if (item.season) {
            info.appendChild(
                createElement("p", "item-season", `季節：${item.season}`)
            );
        }

        card.appendChild(info);

        card.tabIndex = 0;
        card.setAttribute("role", "link");
        card.setAttribute("aria-label", `${item.name || "名称未設定"}の詳細を表示`);

        function openDetail() {
            if (item.id === undefined || item.id === null) {
                if (typeof window.showToast === "function") {
                    window.showToast("この服にはIDがないため、詳細を開けません。");
                } else {
                    alert("この服にはIDがないため、詳細を開けません。");
                }
                return;
            }

            window.location.href = `detail.html?id=${encodeURIComponent(item.id)}`;
        }

        card.addEventListener("click", openDetail);

        card.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openDetail();
            }
        });

        return card;
    }

    // 空状態の表示切り替え
    function updateEmptyState(hasClothes) {
        if (!emptyState) return;
        emptyState.hidden = hasClothes;
        emptyState.style.display = hasClothes ? "none" : "";
    }

    // バックエンドから服を取得してホーム画面に反映
    async function renderClothes() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error("サーバーからのデータ取得に失敗しました");
            }

            const clothes = await response.json();

            closetGrid.replaceChildren();

            if (!Array.isArray(clothes) || clothes.length === 0) {
                closetGrid.hidden = true;
                updateEmptyState(false);
                return;
            }

            closetGrid.hidden = false;
            updateEmptyState(true);

            // ホーム画面には最大4着を表示（新しい順、またはそのまま先頭4件）
            clothes.slice(0, 4).forEach(item => {
                closetGrid.appendChild(createClothCard(item));
            });

        } catch (error) {
            console.error("ホーム画面の服データを読み込めませんでした:", error);
            closetGrid.hidden = true;
            updateEmptyState(false);
        }
    }

    // 初期表示
    renderClothes();

    // 画面に戻ったときに更新
    window.addEventListener("pageshow", renderClothes);
});