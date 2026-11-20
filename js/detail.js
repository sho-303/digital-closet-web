// ==========================================
// detail.js (ユーザーID連携・完全修正版)
// File: js/detail.js
// Date: 2026-10-23
// Creator: K025C2093 吉川蔣
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const API_BASE = `http://${window.location.hostname}:5001`;
    const API_URL = `${API_BASE}/items`;

    // 1. ログイン中のユーザー情報をチェックしてユーザーIDを取得する
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id;

    // ログインしていなければログイン画面へ強制送還
    if (!userId) {
        alert("ログインしていません。ログイン画面へ移動します。");
        window.location.href = "login.html";
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const clothId = params.get("id");

    // フォーム要素
    const form = document.getElementById("editClothForm");
    const imageInput = document.getElementById("editImage");
    const nameInput = document.getElementById("editName");
    const categoryInput = document.getElementById("editCategory");
    const colorInput = document.getElementById("editColor");
    const patternInput = document.getElementById("editPattern");
    const brandInput = document.getElementById("editBrand");
    const seasonInput = document.getElementById("editSeason");
    const styleInput = document.getElementById("editStyle");

    // 表示要素
    const detailTitle = document.getElementById("detailTitle");
    const imageElement = document.getElementById("detailImageElement");
    const imagePlaceholder = document.getElementById("detailImagePlaceholder");
    const deleteButton = document.getElementById("deleteBtn");
    const backButton = document.getElementById("backButton");

    if (
        !form ||
        !nameInput ||
        !categoryInput ||
        !colorInput ||
        !patternInput ||
        !brandInput ||
        !seasonInput ||
        !styleInput ||
        !deleteButton
    ) {
        console.error("詳細画面に必要なHTML要素が見つかりません。");
        return;
    }

    let isProcessing = false;

    // カテゴリーの表記ゆれを統一
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

    // 季節の表記ゆれを統一
    const SEASON_ALIASES = {
        spring: ["spring", "春"],
        summer: ["summer", "夏"],
        autumn: ["autumn", "fall", "秋"],
        winter: ["winter", "冬"],
        "spring/autumn": [
            "spring/autumn",
            "春・秋",
            "春/秋",
            "春秋"
        ],
        "all-season": [
            "all-season",
            "all season",
            "通年",
            "オールシーズン",
            "すべての季節"
        ]
    };

    // 文字列を比較しやすい形に変換
    function normalize(value) {
        return String(value ?? "")
            .normalize("NFKC")
            .trim()
            .toLocaleLowerCase("ja");
    }

    // メッセージを表示
    function showMessage(message) {
        if (typeof window.showToast === "function") {
            window.showToast(message);
        } else {
            alert(message);
        }
    }

    // 一覧画面に戻る
    function returnToCloset(message) {
        showMessage(message);
        window.location.replace("closet.html");
    }

    // セレクトボックスから対応する値を探す
    function findSelectValue(selectElement, value, aliases) {
        const normalizedValue = normalize(value);

        const matchedAlias = aliases.find(alias =>
            normalize(alias) === normalizedValue
        );

        if (!matchedAlias) {
            return "";
        }

        const matchedOption = Array.from(selectElement.options).find(option => {
            const normalizedOption = normalize(option.value);
            const normalizedLabel = normalize(option.textContent);

            return (
                normalizedOption === normalizedValue ||
                normalizedOption === normalize(matchedAlias) ||
                normalizedLabel === normalizedValue ||
                normalizedLabel === normalize(matchedAlias) ||
                aliases.some(alias =>
                    normalize(alias) === normalizedOption ||
                    normalize(alias) === normalizedLabel
                )
            );
        });

        return matchedOption ? matchedOption.value : "";
    }

    // カテゴリーを設定
    function setCategoryValue(value) {
        const normalizedValue = normalize(value);

        for (const aliases of Object.values(CATEGORY_ALIASES)) {
            if (
                aliases.some(alias =>
                    normalize(alias) === normalizedValue
                )
            ) {
                categoryInput.value = findSelectValue(
                    categoryInput,
                    value,
                    aliases
                );
                return;
            }
        }

        categoryInput.value = "";
    }

    // 季節を設定
    function setSeasonValue(value) {
        const normalizedValue = normalize(value);

        if (!normalizedValue) {
            seasonInput.value = "";
            return;
        }

        for (const aliases of Object.values(SEASON_ALIASES)) {
            if (
                aliases.some(alias =>
                    normalize(alias) === normalizedValue
                )
            ) {
                seasonInput.value = findSelectValue(
                    seasonInput,
                    value,
                    aliases
                );
                return;
            }
        }

        seasonInput.value = "";
    }

    // IDを確認
    if (!clothId) {
        returnToCloset("服のIDを取得できませんでした。");
        return;
    }

    // 画像を表示
    function displayImage(imageSource) {
        if (!imageElement || !imagePlaceholder) {
            return;
        }

        imageElement.hidden = true;
        imageElement.removeAttribute("src");

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
            imagePlaceholder.textContent = "画像は登録されていません";
            imagePlaceholder.hidden = false;
            return;
        }

        imagePlaceholder.textContent = "画像を読み込んでいます";
        imagePlaceholder.hidden = false;

        imageElement.onload = () => {
            imageElement.hidden = false;
            imagePlaceholder.hidden = true;
        };

        imageElement.onerror = () => {
            imageElement.hidden = true;
            imagePlaceholder.textContent = "画像を表示できません";
            imagePlaceholder.hidden = false;
        };

        imageElement.src = imageSource;
    }

    // 新しい画像ファイルが選択されたらプレビュー表示
    if (imageInput) {
        imageInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    displayImage(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // APIから個別の服データを取得 (user_idを付与)
    async function fetchClothDetail() {
        try {
            const response = await fetch(`${API_URL}/${clothId}?user_id=${userId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    returnToCloset("指定された服が見つかりませんでした。");
                    return;
                }
                throw new Error("サーバーからのデータ取得に失敗しました");
            }

            const cloth = await response.json();

            // フォームに反映
            nameInput.value = cloth.name || "";
            setCategoryValue(cloth.category);
            colorInput.value = cloth.color || "";
            patternInput.value = cloth.pattern || "";
            brandInput.value = cloth.brand || "";
            setSeasonValue(cloth.season);
            styleInput.value = cloth.style || "";

            if (detailTitle) {
                detailTitle.textContent = cloth.name || "服の詳細";
            }

            displayImage(cloth.image_url || cloth.image || cloth.imageUrl);

        } catch (error) {
            console.error("服のデータを読み込めませんでした:", error);
            returnToCloset("服のデータを読み込めませんでした。サーバーが起動しているか確認してください。");
        }
    }

    // 入力内容を検証
    function validateForm() {
        const name = nameInput.value.trim();
        const category = categoryInput.value;
        const color = colorInput.value.trim();

        if (!name || !category || !color) {
            showMessage(
                "服の名称・カテゴリー・主な色を入力してください。"
            );
            return false;
        }

        const limits = [
            [nameInput, 100, "服の名称"],
            [colorInput, 50, "主な色"],
            [patternInput, 50, "柄・デザイン"],
            [brandInput, 100, "ブランド"],
            [styleInput, 100, "テイスト・系統"]
        ];

        for (const [input, limit, label] of limits) {
            if (input.value.trim().length > limit) {
                showMessage(
                    `${label}は${limit}文字以内で入力してください。`
                );

                input.focus();
                return false;
            }
        }

        return true;
    }

    // 処理中のボタンを制御
    function setProcessingState(processing) {
        isProcessing = processing;

        const submitButton = form.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = processing;
            submitButton.textContent = processing
                ? "保存中..."
                : "変更を保存する";
        }

        deleteButton.disabled = processing;

        if (backButton) {
            backButton.disabled = processing;
        }
    }

    // 一覧に戻るボタン
    if (backButton) {
        backButton.addEventListener("click", () => {
            if (!isProcessing) {
                window.location.href = "closet.html";
            }
        });
    }

    // 編集内容を保存 (PUT)
    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (isProcessing || !validateForm()) {
            return;
        }

        setProcessingState(true);

        try {
            const formData = new FormData();
            formData.append("user_id", userId); // ユーザーIDを付与
            formData.append("name", nameInput.value.trim());
            formData.append("category", categoryInput.value);
            formData.append("color", colorInput.value.trim());
            formData.append("pattern", patternInput.value.trim());
            formData.append("brand", brandInput.value.trim());
            formData.append("season", seasonInput.value);
            formData.append("style", styleInput.value.trim());

            // 画像ファイルが選ばれていれば追加添付
            if (imageInput && imageInput.files.length > 0) {
                formData.append("image", imageInput.files[0]);
            }

            const response = await fetch(`${API_URL}/${clothId}`, {
                method: "PUT",
                body: formData
            });

            if (response.ok) {
                showMessage("変更を保存しました。");
                window.location.href = "closet.html";
            } else {
                const errorData = await response.json();
                showMessage("保存に失敗しました: " + (errorData.error || "エラーが発生しました"));
                setProcessingState(false);
            }
        } catch (error) {
            console.error("服の保存に失敗しました:", error);
            showMessage("保存に失敗しました。サーバーとの通信状態を確認してください。");
            setProcessingState(false);
        }
    });

    // 服を削除 (DELETE)
    deleteButton.addEventListener("click", async () => {
        if (isProcessing) {
            return;
        }

        const confirmed = window.confirm(
            `「${nameInput.value.trim() || "名称未設定"}」を削除しますか？\nこの操作は取り消せません。`
        );

        if (!confirmed) {
            return;
        }

        setProcessingState(true);

        try {
            const response = await fetch(`${API_URL}/${clothId}?user_id=${userId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                showMessage("服を削除しました。");
                window.location.href = "closet.html";
            } else {
                showMessage("削除に失敗しました。");
                setProcessingState(false);
            }
        } catch (error) {
            console.error("服の削除に失敗しました:", error);
            showMessage("削除に失敗しました。通信状態を確認してください。");
            setProcessingState(false);
        }
    });

    // 初期実行
    fetchClothDetail();
});