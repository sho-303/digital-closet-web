// ==========================================
// ai-purchase.js (バックエンド連携・購入候補リスト保存＆画像表示対応版)
// File: js/ai-purchase.js
// Date: 2026-10-29
// Creator: K025C2093 吉川蔣
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const API_BASE = `http://${window.location.hostname}:5001`;
    const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

    // ログイン中のユーザー情報をチェック
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id;

    if (!userId) {
        alert("ログインしていません。ログイン画面へ移動します。");
        window.location.href = "login.html";
        return;
    }

    const form = document.getElementById("purchaseCheckForm");
    const preview = document.getElementById("purchaseImagePreview");
    const imageInput = document.getElementById("purchaseImageInput");
    const nameInput = document.getElementById("purchaseItemName");
    const categoryInput = document.getElementById("purchaseCategory");
    const colorInput = document.getElementById("purchaseColor");
    const resultArea = document.getElementById("purchaseResultArea");
    const checkBtn = document.getElementById("checkPurchaseBtn");
    const retryBtn = document.getElementById("retryPurchaseBtn");

    const matchScoreTitle = document.getElementById("matchScoreTitle");
    const purchaseAdvice = document.getElementById("purchaseAdvice");
    const scoreDescription = document.getElementById("purchaseScoreDescription");
    const matchItemsGrid = document.getElementById("matchItemsGrid");

    let selectedImage = "";
    let isChecking = false;
    let imageLoadId = 0;

    if (!form) {
        console.error("購入候補チェックフォームが見つかりません。");
        return;
    }

    // バックエンドから手持ちの服を取得
    async function getClothes() {
        try {
            const res = await fetch(`${API_BASE}/items?user_id=${userId}`);
            if (!res.ok) {
                throw new Error("サーバーからのデータ取得に失敗しました");
            }
            const clothes = await res.json();
            return Array.isArray(clothes) ? clothes : [];
        } catch (error) {
            console.error("手持ち服の読み込みに失敗しました。", error);
            throw new Error("手持ち服のデータを読み込めませんでした。");
        }
    }

    // 文字列の正規化などのユーティリティ関数
    function normalizeText(value) {
        return String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase("ja");
    }

    function normalizeCategory(value) {
        const category = normalizeText(value);
        const aliases = {
            tops: ["tops", "トップス"],
            bottoms: ["bottoms", "ボトムス"],
            outer: ["outer", "outerwear", "アウター"],
            shoes: ["shoes", "シューズ", "靴"],
            accessories: ["accessories", "アクセサリー"]
        };
        for (const [key, values] of Object.entries(aliases)) {
            if (values.some((item) => normalizeText(item) === category)) {
                return key;
            }
        }
        return "";
    }

    function normalizeColor(value) {
        const color = normalizeText(value);
        const groups = {
            black: ["ブラック", "黒", "black"],
            white: ["ホワイト", "白", "white", "アイボリー", "生成り"],
            gray: ["グレー", "灰色", "gray", "grey", "チャコール"],
            beige: ["ベージュ", "beige", "エクリュ"],
            brown: ["ブラウン", "茶色", "brown", "キャメル"],
            khaki: ["カーキ", "オリーブ", "khaki"],
            navy: ["ネイビー", "紺", "navy"],
            blue: ["ブルー", "青", "水色", "blue", "デニム"],
            red: ["レッド", "赤", "ボルドー", "red"],
            pink: ["ピンク", "pink"],
            green: ["グリーン", "緑", "green"],
            yellow: ["イエロー", "黄色", "yellow"],
            purple: ["パープル", "紫", "purple"],
            orange: ["オレンジ", "orange"]
        };
        for (const [key, values] of Object.entries(groups)) {
            if (values.some((item) => color.includes(normalizeText(item)))) {
                return key;
            }
        }
        return "";
    }

    function inferCategory(text) {
        const value = normalizeText(text);
        const keywords = {
            tops: ["トップス", "tシャツ", "t-shirt", "シャツ", "ニット", "セーター", "スウェット", "パーカー", "カーディガン", "ブラウス", "ポロシャツ", "ロンt"],
            bottoms: ["bottoms", "パンツ", "ズボン", "デニム", "ジーンズ", "スラックス", "チノパン", "スカート"],
            outer: ["アウター", "ジャケット", "コート", "ブルゾン", "ダウン", "トラックジャケット", "マウンテンパーカー"],
            shoes: ["シューズ", "スニーカー", "靴", "ブーツ", "ローファー", "サンダル"],
            accessories: ["アクセサリー", "バッグ", "ベルト", "帽子", "キャップ", "ネックレス", "時計", "マフラー"]
        };
        for (const [category, words] of Object.entries(keywords)) {
            if (words.some((word) => value.includes(normalizeText(word)))) {
                return category;
            }
        }
        return "";
    }

    function inferColor(text) {
        const value = normalizeText(text);
        const keywords = [
            ["black", ["ブラック", "黒", "black"]],
            ["white", ["ホワイト", "白", "アイボリー", "生成り", "white"]],
            ["gray", ["グレー", "灰色", "チャコール", "gray", "grey"]],
            ["beige", ["ベージュ", "エクリュ", "beige"]],
            ["brown", ["ブラウン", "茶色", "キャメル", "brown"]],
            ["khaki", ["カーキ", "オリーブ", "khaki"]],
            ["navy", ["ネイビー", "紺", "navy"]],
            ["blue", ["ブルー", "青", "水色", "blue", "デニム"]],
            ["red", ["レッド", "赤", "ボルドー", "red"]],
            ["pink", ["ピンク", "pink"]],
            ["green", ["グリーン", "緑", "green"]],
            ["yellow", ["イエロー", "黄色", "yellow"]],
            ["purple", ["パープル", "紫", "purple"]],
            ["orange", ["オレンジ", "orange"]]
        ];
        for (const [color, words] of keywords) {
            if (words.some((word) => value.includes(normalizeText(word)))) {
                return color;
            }
        }
        return "";
    }

    function getItemText(item) {
        return normalizeText([
            item.name, item.category, item.color, item.pattern, item.brand, item.season, item.style
        ].filter(Boolean).join(" "));
    }

    function getItemColor(item) {
        return normalizeColor(item.color) || inferColor(getItemText(item));
    }

    function getColorCompatibility(candidateColor, itemColor) {
        if (!candidateColor || !itemColor) return 0;
        if (candidateColor === itemColor) return 1;
        const neutralColors = ["black", "white", "gray", "beige", "brown", "navy"];
        if (neutralColors.includes(candidateColor) || neutralColors.includes(itemColor)) return 2;
        const relatedColors = [
            ["blue", "navy"], ["green", "khaki"], ["brown", "beige"], ["red", "pink"], ["yellow", "orange"]
        ];
        if (relatedColors.some((pair) => pair.includes(candidateColor) && pair.includes(itemColor))) return 2;
        return 0;
    }

    function getCandidate() {
        const name = nameInput.value.trim();
        const category = categoryInput.value || inferCategory(name);
        const color = colorInput.value ? normalizeColor(colorInput.value) : inferColor(name);
        return { name, category, color, text: normalizeText(name), image: selectedImage };
    }

    function getDuplicateScore(candidate, item) {
        const itemText = getItemText(item);
        let score = 0;
        if (candidate.category && normalizeCategory(item.category) && candidate.category === normalizeCategory(item.category)) score += 2;
        if (candidate.color && getItemColor(item) && candidate.color === getItemColor(item)) score += 2;
        const candidateWords = candidate.text.split(/[\s、。，・/]+/).filter((word) => word.length >= 2);
        if (candidateWords.some((word) => itemText.includes(word))) score += 1;
        return score;
    }

    function calculateItemMatch(candidate, item) {
        let score = 0;
        const reasons = [];
        const candidateCategory = candidate.category;
        const itemCategory = normalizeCategory(item.category);
        const candidateColor = candidate.color;
        const itemColor = getItemColor(item);

        if (candidateCategory && itemCategory && candidateCategory !== itemCategory) {
            score += 3;
            reasons.push("カテゴリーが異なり、組み合わせに使いやすい");
        }

        const colorCompatibility = getColorCompatibility(candidateColor, itemColor);
        if (colorCompatibility === 2) {
            score += 3;
            reasons.push("色の組み合わせが比較的合わせやすい");
        } else if (colorCompatibility === 1) {
            score += 1;
            reasons.push("同系色のコーディネートに使える");
        }

        if (!candidateCategory || !itemCategory) {
            score += 1;
        }

        return { item, score, reasons };
    }

    function resetPreview() {
        selectedImage = "";
        preview.replaceChildren();
        const guide = document.createElement("div");
        guide.className = "purchase-upload-guide";
        const title = document.createElement("p");
        title.textContent = "画像を選択";
        const description = document.createElement("span");
        description.textContent = "クリックまたはドラッグ＆ドロップ";
        const note = document.createElement("span");
        note.textContent = "JPEG・PNG・WebPなど / 3MB以下";
        guide.append(title, description, note);
        preview.appendChild(guide);
    }

    function loadImage(file) {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("画像ファイルを選択してください。");
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            alert("画像サイズは3MB以下にしてください。");
            return;
        }

        const currentId = ++imageLoadId;
        const reader = new FileReader();

        reader.onload = () => {
            if (currentId !== imageLoadId) return;
            selectedImage = reader.result;
            preview.replaceChildren();
            const image = document.createElement("img");
            image.src = selectedImage;
            image.alt = "購入候補の服";
            image.style.width = "100%";
            image.style.height = "100%";
            image.style.objectFit = "contain";
            preview.appendChild(image);
        };
        reader.readAsDataURL(file);
    }

    if (preview && imageInput) {
        preview.addEventListener("click", () => { if (!isChecking) imageInput.click(); });
        imageInput.addEventListener("change", () => {
            const file = imageInput.files?.[0];
            if (file) loadImage(file);
        });
    }

    // 💡 すべての画像プロパティ名をチェックして確実に画像を表示する関数
    function createItemCard(item, reasons) {
        const card = document.createElement("article");
        card.className = "purchase-match-card";
        const imageContainer = document.createElement("div");
        imageContainer.className = "purchase-match-image";

        const imageSource = item.image_url || item.imageUrl || item.image || item.path || item.image_path || "";

        if (imageSource) {
            const image = document.createElement("img");
            image.src = imageSource.startsWith("/") ? `${API_BASE}${imageSource}` : imageSource;
            image.alt = item.name || "手持ちの服";
            image.style.width = "100%";
            image.style.height = "100%";
            image.style.objectFit = "cover";
            imageContainer.appendChild(image);
        } else {
            imageContainer.textContent = "画像なし";
        }

        const title = document.createElement("h4");
        title.textContent = item.name || "名称未設定";
        const category = document.createElement("p");
        category.textContent = `カテゴリー：${item.category || "未設定"}`;
        const color = document.createElement("p");
        color.textContent = `色：${item.color || "未設定"}`;
        const reason = document.createElement("p");
        reason.textContent = reasons.length ? reasons.join("。") : "組み合わせの候補として表示しています。";

        card.append(imageContainer, title, category, color, reason);
        return card;
    }

    async function renderResult(candidate, clothes) {
        const rankedItems = clothes.map((item) => calculateItemMatch(candidate, item)).sort((a, b) => b.score - a.score);
        const duplicates = clothes.filter((item) => getDuplicateScore(candidate, item) >= 4);
        const recommendations = rankedItems.slice(0, 6);
        const matchCount = recommendations.filter((entry) => entry.score >= 3).length;
        const duplicateCount = duplicates.length;

        let grade, advice;
        if (clothes.length === 0) {
            grade = "判定保留";
            advice = "まだ手持ち服が登録されていないため、相性を十分に判定できません。";
        } else if (duplicateCount >= 3) {
            grade = "重複に注意";
            advice = "似たカテゴリーや色の服が複数見つかりました。";
        } else if (matchCount >= 3 && duplicateCount === 0) {
            grade = "相性良好";
            advice = "手持ち服の中に組み合わせ候補が複数あり、重複も少ない結果です。";
        } else {
            grade = "購入候補";
            advice = "組み合わせに使えそうな手持ち服が見つかりました。";
        }

        matchScoreTitle.textContent = `チェック結果：${grade}`;
        purchaseAdvice.textContent = advice;
        scoreDescription.textContent = `登録済みの服：${clothes.length}着 / 組み合わせ候補：${recommendations.length}着`;

        matchItemsGrid.replaceChildren();
        recommendations.forEach((entry) => {
            matchItemsGrid.appendChild(createItemCard(entry.item, entry.reasons));
        });

        resultArea.hidden = false;
        resultArea.scrollIntoView({ behavior: "smooth", block: "start" });

        try {
            await fetch(`${API_BASE}/purchase-items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    name: candidate.name,
                    category: candidate.category,
                    color: candidate.color,
                    image: candidate.image,
                    grade: grade
                })
            });
        } catch (e) {
            console.log("購入候補リストへの自動保存:", e);
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (isChecking) return;

        const candidate = getCandidate();
        if (!candidate.name) {
            alert("購入候補の名称を入力してください。");
            nameInput.focus();
            return;
        }

        isChecking = true;
        checkBtn.disabled = true;
        checkBtn.textContent = "手持ち服を分析しています...";

        try {
            const clothes = await getClothes();
            await renderResult(candidate, clothes);
        } catch (error) {
            console.error("購入候補チェックに失敗しました:", error);
            alert("手持ち服を読み込めませんでした。");
        } finally {
            isChecking = false;
            checkBtn.disabled = false;
            checkBtn.textContent = "相性をチェックする";
        }
    });

    if (retryBtn) {
        retryBtn.addEventListener("click", () => {
            resultArea.hidden = true;
            nameInput.focus();
            form.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    resetPreview();
});