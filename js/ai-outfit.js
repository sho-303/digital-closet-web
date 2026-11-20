javascript
// コーディネート提案機能
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const STORAGE_KEY = "closetItems";

    const form = document.getElementById("aiOutfitForm");
    const seasonInput = document.getElementById("outfitSeason");
    const sceneInput = document.getElementById("outfitScene");
    const tasteInput = document.getElementById("outfitTaste");

    const resultArea = document.getElementById("outfitResultArea");
    const outfitTitle = document.getElementById("outfitTitle");
    const outfitAdvice = document.getElementById("outfitAdvice");
    const grid = document.getElementById("outfitItemsGrid");

    const submitBtn = document.getElementById("generateOutfitBtn");
    const retryBtn = document.getElementById("retryOutfitBtn");
    const status = document.getElementById("outfitStatus");

    if (
        !form ||
        !seasonInput ||
        !sceneInput ||
        !tasteInput ||
        !resultArea ||
        !outfitTitle ||
        !outfitAdvice ||
        !grid ||
        !submitBtn ||
        !status
    ) {
        console.error("コーデ提案画面に必要なHTML要素が見つかりません。");
        return;
    }

    let previousCombination = "";

    const CATEGORY_ALIASES = {
        tops: ["tops", "top", "トップス"],
        bottoms: ["bottoms", "bottom", "ボトムス"],
        outer: ["outer", "outerwear", "アウター", "アウターウェア"],
        shoes: ["shoes", "シューズ", "靴", "シューズ類"],
        accessories: [
            "accessories",
            "accessory",
            "アクセサリー",
            "小物"
        ]
    };

    const SEASON_ALIASES = {
        spring: ["spring", "春", "春・秋", "春/秋", "spring/autumn", "春秋"],
        summer: ["summer", "夏"],
        autumn: ["autumn", "fall", "秋", "春・秋", "春/秋", "spring/autumn", "春秋"],
        winter: ["winter", "冬"],
        "all-season": [
            "all-season",
            "all season",
            "通年",
            "オールシーズン",
            "すべての季節"
        ]
    };

    function normalize(value) {
        return String(value ?? "")
            .normalize("NFKC")
            .trim()
            .toLocaleLowerCase("ja");
    }

    function getClothes() {
        try {
            const rawData = localStorage.getItem(STORAGE_KEY);
            const data = rawData ? JSON.parse(rawData) : [];

            if (!Array.isArray(data)) {
                throw new Error("服のデータが配列ではありません。");
            }

            return data.filter(item =>
                item &&
                typeof item === "object" &&
                !Array.isArray(item)
            );
        } catch (error) {
            console.error("服のデータを読み込めませんでした:", error);
            return null;
        }
    }

    function normalizeCategory(value) {
        const normalizedValue = normalize(value);

        for (const [category, aliases] of Object.entries(CATEGORY_ALIASES)) {
            if (aliases.some(alias => normalize(alias) === normalizedValue)) {
                return category;
            }
        }

        return "";
    }

    function categoryMatches(item, category) {
        return normalizeCategory(item.category) === category;
    }

    function normalizeSeason(value) {
        const normalizedValue = normalize(value);

        for (const [season, aliases] of Object.entries(SEASON_ALIASES)) {
            if (aliases.some(alias => normalize(alias) === normalizedValue)) {
                return season;
            }
        }

        return normalizedValue;
    }

    function seasonMatches(item, selectedSeason) {
        if (selectedSeason === "指定なし") {
            return true;
        }

        const itemSeason = normalizeSeason(item.season);

        if (!itemSeason) {
            return false;
        }

        if (itemSeason === "all-season") {
            return true;
        }

        if (
            itemSeason === "spring" &&
            selectedSeason === "spring"
        ) {
            return true;
        }

        if (
            itemSeason === "autumn" &&
            selectedSeason === "autumn"
        ) {
            return true;
        }

        if (
            itemSeason === "spring/autumn" &&
            ["spring", "autumn"].includes(selectedSeason)
        ) {
            return true;
        }

        return itemSeason === selectedSeason;
    }

    function getSeasonCandidates(clothes, category, selectedSeason) {
        const categoryItems = clothes.filter(item =>
            categoryMatches(item, category)
        );

        if (selectedSeason === "指定なし") {
            return categoryItems;
        }

        const matched = categoryItems.filter(item =>
            seasonMatches(item, selectedSeason)
        );

        // 季節に合う服があれば、その服を優先する
        if (matched.length > 0) {
            return matched;
        }

        // 季節が未設定の服は代替候補にする
        const unspecified = categoryItems.filter(item =>
            !normalizeSeason(item.season)
        );

        if (unspecified.length > 0) {
            return unspecified;
        }

        // 該当する服がない場合は、別の季節の服を候補にする
        return categoryItems;
    }

    function getStyleText(item) {
        return normalize([
            item.style,
            item.pattern,
            item.name,
            item.brand
        ].filter(Boolean).join(" "));
    }

    function getSceneKeywords(scene) {
        const keywords = {
            "通学": ["カジュアル", "シンプル", "ベーシック"],
            "デート": ["きれいめ", "シンプル", "韓国系"],
            "友達との外出": ["カジュアル", "ストリート"],
            "ビジネス": ["きれいめ", "シンプル", "フォーマル"],
            "旅行": ["カジュアル", "シンプル", "スポーツ"],
            "普段使い": ["カジュアル", "シンプル"]
        };

        return keywords[scene] || [];
    }

    function scoreItem(item, taste, scene) {
        const text = getStyleText(item);
        let score = Math.random();

        if (taste !== "おまかせ" && taste) {
            const desiredStyle = normalize(taste);

            if (text.includes(desiredStyle)) {
                score += 5;
            }

            // スタイルの部分一致にも対応
            const styleKeywords = {
                "カジュアル": ["カジュアル", "ラフ", "デニム"],
                "きれいめ": ["きれいめ", "シャツ", "スラックス"],
                "ストリート": ["ストリート", "オーバーサイズ"],
                "韓国系": ["韓国系", "韓国", "シンプル"],
                "シンプル": ["シンプル", "無地", "ベーシック"],
                "スポーティー": ["スポーティー", "スポーツ", "ジャージ"]
            };

            const keywords = styleKeywords[taste] || [];

            if (
                keywords.some(keyword =>
                    text.includes(normalize(keyword))
                )
            ) {
                score += 2;
            }
        }

        const sceneKeywords = getSceneKeywords(scene);

        if (
            sceneKeywords.some(keyword =>
                text.includes(normalize(keyword))
            )
        ) {
            score += 1;
        }

        return score;
    }

    function chooseItem(items, taste, scene, excludedIds = new Set()) {
        const available = items.filter(item => {
            if (item.id == null) {
                return true;
            }

            return !excludedIds.has(String(item.id));
        });

        const candidates = available.length > 0 ? available : items;

        if (candidates.length === 0) {
            return null;
        }

        return [...candidates].sort(
            (a, b) => scoreItem(b, taste, scene) - scoreItem(a, taste, scene)
        )[0];
    }

    function selectOutfit(clothes, season, scene, taste) {
        const tops = getSeasonCandidates(clothes, "tops", season);
        const bottoms = getSeasonCandidates(clothes, "bottoms", season);
        const outers = getSeasonCandidates(clothes, "outer", season);
        const shoes = getSeasonCandidates(clothes, "shoes", season);
        const accessories = getSeasonCandidates(clothes, "accessories", season);

        if (tops.length === 0 || bottoms.length === 0) {
            return {
                error: "コーデを提案するには、トップスとボトムスを最低1着ずつ登録してください。"
            };
        }

        const selectedItems = [];
        const usedIds = new Set();

        function addItem(item) {
            if (!item) return;

            const id = item.id == null ? null : String(item.id);

            if (id !== null && usedIds.has(id)) {
                return;
            }

            selectedItems.push(item);

            if (id !== null) {
                usedIds.add(id);
            }
        }

        addItem(chooseItem(tops, taste, scene, usedIds));
        addItem(chooseItem(bottoms, taste, scene, usedIds));

        // 秋・冬はアウターを優先する
        if (
            outers.length > 0 &&
            ["autumn", "winter"].includes(season)
        ) {
            addItem(chooseItem(outers, taste, scene, usedIds));
        } else if (outers.length > 0 && Math.random() < 0.4) {
            addItem(chooseItem(outers, taste, scene, usedIds));
        }

        if (shoes.length > 0) {
            addItem(chooseItem(shoes, taste, scene, usedIds));
        }

        if (accessories.length > 0 && Math.random() < 0.5) {
            addItem(chooseItem(accessories, taste, scene, usedIds));
        }

        return { items: selectedItems };
    }

    function getColorAdvice(items) {
        const colors = items
            .map(item => String(item.color || "").trim())
            .filter(Boolean);

        const uniqueColors = [...new Set(colors)];

        if (uniqueColors.length <= 1) {
            return "色数を抑えた、まとまりのあるコーディネートにしやすい組み合わせです。";
        }

        return `使用する色は${uniqueColors.join("・")}です。靴や小物の色を服のどれかに合わせると、統一感が出やすくなります。`;
    }

    function buildAdvice(items, season, scene, taste) {
        const parts = [];

        parts.push(
            `利用シーンは「${scene}」、希望する雰囲気は「${taste}」です。`
        );

        if (season === "winter") {
            parts.push("冬はアウターや重ね着を活用し、暖かさも意識しましょう。");
        } else if (season === "summer") {
            parts.push("夏は通気性のよい服や軽い素材を意識すると快適です。");
        } else if (season === "spring") {
            parts.push("春は薄手の羽織りを組み合わせると、気温の変化に対応しやすくなります。");
        } else if (season === "autumn") {
            parts.push("秋は落ち着いた色や軽めのアウターを取り入れると季節感が出ます。");
        } else {
            parts.push("当日の気温や天候に合わせて、羽織りものなどを調整しましょう。");
        }

        parts.push(getColorAdvice(items));

        if (items.some(item => !normalizeSeason(item.season))) {
            parts.push("季節が未設定の服も候補に含まれています。必要に応じてクローゼットで季節を設定してください。");
        }

        return parts.join("\n\n");
    }

    function createImage(item) {
        const container = document.createElement("div");
        container.className = "outfit-card-image";

        const imageSource = item.image || item.imageUrl || "";

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
            image.remove();

            const placeholder = document.createElement("span");
            placeholder.textContent = "画像を表示できません";
            container.appendChild(placeholder);
        }, { once: true });

        container.appendChild(image);

        return container;
    }

    function createClothCard(item) {
        const card = document.createElement("article");
        card.className = "outfit-card";

        card.appendChild(createImage(item));

        const title = document.createElement("h3");
        title.textContent = item.name || "名称未設定";
        card.appendChild(title);

        const category = document.createElement("p");
        category.textContent = `カテゴリー：${item.category || "未設定"}`;
        card.appendChild(category);

        const color = document.createElement("p");
        color.textContent = `色：${item.color || "未設定"}`;
        card.appendChild(color);

        if (item.brand) {
            const brand = document.createElement("p");
            brand.textContent = `ブランド：${item.brand}`;
            card.appendChild(brand);
        }

        if (item.season) {
            const season = document.createElement("p");
            season.textContent = `季節：${item.season}`;
            card.appendChild(season);
        }

        return card;
    }

    function getCombination(items) {
        return items
            .map(item => String(item.id ?? item.name ?? "unknown"))
            .sort()
            .join("|");
    }

    function renderResult(items, season, scene, taste) {
        previousCombination = getCombination(items);

        outfitTitle.textContent = `${scene}向け・${taste}スタイル`;
        outfitAdvice.textContent = buildAdvice(items, season, scene);

        grid.replaceChildren();

        items.forEach(item => {
            grid.appendChild(createClothCard(item));
        });

        resultArea.hidden = false;
        status.textContent = `${items.length}着を組み合わせて提案しました。`;

        resultArea.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function generateOutfit() {
        if (submitBtn.disabled) {
            return;
        }

        const season = seasonInput.value;
        const scene = sceneInput.value;
        const taste = tasteInput.value;

        const clothes = getClothes();

        if (clothes === null) {
            status.textContent = "服のデータを読み込めませんでした。ページを再読み込みしてください。";
            resultArea.hidden = true;
            return;
        }

        if (clothes.length === 0) {
            status.textContent = "クローゼットに服がありません。先に服を登録してください。";
            resultArea.hidden = true;
            return;
        }

        submitBtn.disabled = true;

        if (retryBtn) {
            retryBtn.disabled = true;
        }

        submitBtn.textContent = "コーデを選定しています...";
        status.textContent = "手持ちの服からコーディネートを選んでいます。";

        try {
            let result = selectOutfit(clothes, season, scene, taste);

            if (result.error) {
                status.textContent = result.error;
                resultArea.hidden = true;
                return;
            }

            // 可能であれば、前回と違う組み合わせを選ぶ
            for (let attempt = 0; attempt < 12; attempt++) {
                if (getCombination(result.items) !== previousCombination) {
                    break;
                }

                const retryResult = selectOutfit(clothes, season, scene, taste);

                if (retryResult.error) {
                    break;
                }

                result = retryResult;
            }

            renderResult(result.items, season, scene, taste);
        } catch (error) {
            console.error("コーデ提案に失敗しました:", error);
            status.textContent = "コーデ提案中にエラーが発生しました。服の登録内容を確認してください。";
            resultArea.hidden = true;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "コーデを提案する";

            if (retryBtn) {
                retryBtn.disabled = false;
            }
        }
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        generateOutfit();
    });

    if (retryBtn) {
        retryBtn.addEventListener("click", generateOutfit);
    }
});