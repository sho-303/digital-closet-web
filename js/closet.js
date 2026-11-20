// ==========================================
// closet.js (完全修正・完全版)
// File: js/closet.js
// Date: 2026-10-23
// Creator: K025C2093 吉川蔣
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const API_BASE = `http://${window.location.hostname}:5001`;

    // 1. ログイン中のユーザー情報をチェックしてユーザーIDを取得する
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id;

    // ログインしていなければログイン画面へ強制送還
    if (!userId) {
        alert("ログインしていません。ログイン画面へ移動します。");
        window.location.href = "login.html";
        return;
    }

    // 2. ユーザーIDを付与したAPIのURLを作成
    const API_URL = `${API_BASE}/items?user_id=${userId}`;

    const clothesGrid = document.getElementById("clothesGrid");
    const clothesCount = document.getElementById("clothesCount");
    const resultCount = document.getElementById("resultCount");
    const emptyState = document.getElementById("emptyState");

    const searchInput = document.getElementById("searchClothes");
    const categoryFilter = document.getElementById("filterCategory");
    const colorFilter = document.getElementById("filterColor");

    if (
        !clothesGrid ||
        !clothesCount ||
        !resultCount ||
        !emptyState ||
        !searchInput ||
        !categoryFilter ||
        !colorFilter
    ) {
        console.error("クローゼット画面に必要なHTML要素が見つかりません。");
        return;
    }

    let allClothes = [];

    // メッセージを表示
    function showMessage(message) {
        if (typeof window.showToast === "function") {
            window.showToast(message);
        } else {
            alert(message);
        }
    }

    // 検索用に文字列を整える
    function normalizeText(value) {
        return String(value ?? "")
            .normalize("NFKC")
            .trim()
            .toLocaleLowerCase("ja");
    }

    // カテゴリー表記を統一
    function normalizeCategory(value) {
        const category = normalizeText(value);

        const categoryMap = {
            "トップス": "tops",
            "トップ": "tops",
            "top": "tops",
            "tops": "tops",

            "ボトムス": "bottoms",
            "ボトム": "bottoms",
            "パンツ": "bottoms",
            "ズボン": "bottoms",
            "bottom": "bottoms",
            "bottoms": "bottoms",

            "アウター": "outer",
            "アウターウェア": "outer",
            "outer": "outer",
            "outerwear": "outer",

            "シューズ": "shoes",
            "靴": "shoes",
            "くつ": "shoes",
            "シューズ類": "shoes",
            "shoes": "shoes",

            "アクセサリー": "accessories",
            "アクセサリ": "accessories",
            "小物": "accessories",
            "accessory": "accessories",
            "accessories": "accessories"
        };

        return categoryMap[category] || category;
    }

    // 服の情報を検索用の文字列にする
    function getSearchableText(item) {
        return [
            item.name,
            item.brand,
            item.color,
            item.pattern,
            item.style,
            item.category,
            item.season
        ]
            .map(normalizeText)
            .join(" ");
    }

    // 色の絞り込み候補を更新
    function updateColorOptions(clothes) {
        const selectedColor = colorFilter.value;

        const colors = [
            ...new Set(
                clothes
                    .map(item => String(item.color || "").trim())
                    .filter(Boolean)
            )
        ].sort((a, b) => a.localeCompare(b, "ja"));

        colorFilter.replaceChildren();

        const allOption = document.createElement("option");
        allOption.value = "";
        allOption.textContent = "すべて";
        colorFilter.appendChild(allOption);

        colors.forEach(color => {
            const option = document.createElement("option");
            option.value = color;
            option.textContent = color;
            colorFilter.appendChild(option);
        });

        colorFilter.value = colors.includes(selectedColor) ? selectedColor : "";
    }

    // 画像表示エリアを作成
    function createImage(item) {
        const container = document.createElement("div");
        container.className = "clothes-image";

        let imageSource = item.image_url || item.image || item.imageUrl || "";

        // 不正なパスや拡張子のみの場合は弾く
        if (!imageSource || imageSource === "/uploads/jpg" || imageSource === "/uploads/png") {
            imageSource = "";
        }

        if (imageSource) {
            if (imageSource.startsWith("http://") || imageSource.startsWith("https://") || imageSource.startsWith("data:")) {
                // そのまま使用
            } else if (imageSource.startsWith("/")) {
                imageSource = `${API_BASE}${imageSource}`;
            } else {
                imageSource = `${API_BASE}/uploads/${imageSource}`;
            }
        }

        if (!imageSource) {
            const placeholder = document.createElement("span");
            placeholder.textContent = "画像なし";
            container.appendChild(placeholder);
            return container;
        }

        const image = document.createElement("img");
        image.src = imageSource;
        image.alt = item.name || "登録した服";
        image.loading = "lazy";
        image.decoding = "async";

        image.addEventListener("error", () => {
            const placeholder = document.createElement("span");
            placeholder.textContent = "画像なし";
            container.replaceChildren(placeholder);
        }, { once: true });

        container.appendChild(image);
        return container;
    }

    // 服のカードを作成
    function createClothCard(item) {
        const card = document.createElement("article");
        card.className = "clothes-card";

        // IDを確実に取得
        const itemId = item.id !== undefined && item.id !== null && item.id !== "" 
            ? item.id 
            : (item.cloth_id !== undefined && item.cloth_id !== null && item.cloth_id !== "" 
                ? item.cloth_id 
                : item._id);

        card.appendChild(createImage(item));

        const info = document.createElement("div");
        info.className = "clothes-info";

        const name = document.createElement("h3");
        name.textContent = item.name || "名称未設定";
        info.appendChild(name);

        const category = document.createElement("p");
        category.className = "clothes-category";
        category.textContent = item.category || "カテゴリー未設定";
        info.appendChild(category);

        const color = document.createElement("p");
        color.textContent = `色：${item.color || "未設定"}`;
        info.appendChild(color);

        if (item.brand) {
            const brand = document.createElement("p");
            brand.textContent = `ブランド：${item.brand}`;
            info.appendChild(brand);
        }

        if (item.season) {
            const season = document.createElement("p");
            season.textContent = `季節：${item.season}`;
            info.appendChild(season);
        }

        // 詳細画面へ飛ぶためのボタンを明示的に作成
        const detailButton = document.createElement("button");
        detailButton.textContent = "詳細・編集を見る";
        detailButton.type = "button";
        detailButton.style.marginTop = "10px";
        detailButton.style.padding = "6px 12px";
        detailButton.style.cursor = "pointer";
        
        detailButton.addEventListener("click", (e) => {
            e.stopPropagation();
            if (itemId === undefined || itemId === null || itemId === "") {
                showMessage("この服には詳細画面を開くためのIDがありません。");
                return;
            }

            const currentPath = window.location.href;
            const basePath = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
            window.location.href = `${basePath}detail.html?id=${encodeURIComponent(itemId)}`;
        });

        info.appendChild(detailButton);
        card.appendChild(info);

        return card;
    }

    // 検索条件に合う服を取得
    function filterClothes(clothes) {
        const keyword = normalizeText(searchInput.value);
        const category = normalizeCategory(categoryFilter.value);
        const color = colorFilter.value.trim();

        return clothes.filter(item => {
            const searchableText = getSearchableText(item);

            const matchesKeyword =
                !keyword || searchableText.includes(keyword);

            const matchesCategory =
                !category ||
                normalizeCategory(item.category) === category;

            const matchesColor =
                !color || String(item.color || "").trim() === color;

            return matchesKeyword && matchesCategory && matchesColor;
        });
    }

    // 空状態を表示
    function showEmptyState(hasAnyClothes, isError = false) {
        emptyState.hidden = false;
        clothesGrid.hidden = true;

        const heading = emptyState.querySelector("h2");
        const message = emptyState.querySelector("p");

        if (heading) {
            if (isError) {
                heading.textContent = "服のデータを読み込めません";
            } else {
                heading.textContent = hasAnyClothes
                    ? "条件に一致する服がありません"
                    : "まだ服が登録されていません";
            }
        }

        if (message) {
            if (isError) {
                message.textContent =
                    "サーバーとの通信に失敗したか、データに問題があります。";
            } else {
                message.textContent = hasAnyClothes
                    ? "キーワードや絞り込み条件を変更してみてください。"
                    : "服を登録すると、ここに一覧で表示されます。";
            }
        }
    }

    // バックエンドから服一覧を取得して表示
    async function renderClothes() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error("サーバーからのデータ取得に失敗しました");
            }

            allClothes = await response.json();

            clothesCount.textContent = allClothes.length;
            updateColorOptions(allClothes);

            const filteredClothes = filterClothes(allClothes);

            clothesGrid.replaceChildren();

            resultCount.textContent =
                `${filteredClothes.length}着表示 / 全${allClothes.length}着`;

            if (filteredClothes.length === 0) {
                showEmptyState(allClothes.length > 0);
                return;
            }

            emptyState.hidden = true;
            clothesGrid.hidden = false;

            filteredClothes.forEach(item => {
                clothesGrid.appendChild(createClothCard(item));
            });

        } catch (error) {
            console.error("服のデータを読み込めませんでした:", error);

            clothesCount.textContent = "—";
            resultCount.textContent = "データを読み込めません";

            clothesGrid.replaceChildren();
            showEmptyState(false, true);
        }
    }

    // 検索・絞り込みイベント
    searchInput.addEventListener("input", () => {
        const filtered = filterClothes(allClothes);
        clothesGrid.replaceChildren();
        resultCount.textContent = `${filtered.length}着表示 / 全${allClothes.length}着`;

        if (filtered.length === 0) {
            showEmptyState(allClothes.length > 0);
        } else {
            emptyState.hidden = true;
            clothesGrid.hidden = false;
            filtered.forEach(item => {
                clothesGrid.appendChild(createClothCard(item));
            });
        }
    });

    categoryFilter.addEventListener("change", () => {
        const filtered = filterClothes(allClothes);
        clothesGrid.replaceChildren();
        resultCount.textContent = `${filtered.length}着表示 / 全${allClothes.length}着`;

        if (filtered.length === 0) {
            showEmptyState(allClothes.length > 0);
        } else {
            emptyState.hidden = true;
            clothesGrid.hidden = false;
            filtered.forEach(item => {
                clothesGrid.appendChild(createClothCard(item));
            });
        }
    });

    colorFilter.addEventListener("change", () => {
        const filtered = filterClothes(allClothes);
        clothesGrid.replaceChildren();
        resultCount.textContent = `${filtered.length}着表示 / 全${allClothes.length}着`;

        if (filtered.length === 0) {
            showEmptyState(allClothes.length > 0);
        } else {
            emptyState.hidden = true;
            clothesGrid.hidden = false;
            filtered.forEach(item => {
                clothesGrid.appendChild(createClothCard(item));
            });
        }
    });

    // 初期表示
    renderClothes();

    // 画面に戻った際に更新
    window.addEventListener("pageshow", renderClothes);
});