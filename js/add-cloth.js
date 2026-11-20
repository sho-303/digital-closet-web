// ==========================================
// add-cloth.js (ユーザー個別登録対応版)
// File: js/add-cloth.js
// Date: 2026-10-22
// Creator: K025C2093 吉川蔣
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const API_URL = `http://${window.location.hostname}:5001/items`;
    const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

    // 1. ログイン中のユーザー情報をチェックしてユーザーIDを取得する
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id;

    if (!userId) {
        alert("ログインしていません。ログイン画面へ移動します。");
        window.location.href = "login.html";
        return;
    }

    const form = document.getElementById("addClothForm");
    const imageInput = document.getElementById("imageInput");
    const imagePreview = document.getElementById("imagePreview");
    const aiClassifyBtn = document.getElementById("aiClassifyBtn");
    const cancelButton = document.getElementById("cancelButton");

    const nameInput = document.getElementById("clothName");
    const categoryInput = document.getElementById("category");
    const colorInput = document.getElementById("color");
    const patternInput = document.getElementById("pattern");
    const brandInput = document.getElementById("brand");
    const seasonInput = document.getElementById("season");
    const styleInput = document.getElementById("style");

    if (!form) {
        console.error("服の登録フォームが見つかりません。");
        return;
    }

    let selectedImage = "";
    let selectedFile = null;
    let isSaving = false;
    let isAnalyzing = false;
    let imageLoadId = 0;

    function showMessage(message) {
        if (typeof window.showToast === "function") {
            window.showToast(message);
        } else {
            alert(message);
        }
    }

    function resetImagePreview(message = "クリックまたはドラッグ＆ドロップで画像を選択") {
        selectedImage = "";
        selectedFile = null;

        if (imagePreview) {
            imagePreview.replaceChildren();
            const messageElement = document.createElement("span");
            messageElement.textContent = message;
            imagePreview.appendChild(messageElement);
        }

        if (aiClassifyBtn) {
            aiClassifyBtn.disabled = true;
        }
    }

    function previewImage(file) {
        if (!file) return;

        const currentLoadId = ++imageLoadId;
        selectedImage = "";
        selectedFile = file;

        if (aiClassifyBtn) {
            aiClassifyBtn.disabled = true;
        }

        if (!file.type.startsWith("image/")) {
            resetImagePreview("画像ファイルを選択してください。");
            showMessage("画像ファイルを選択してください。");
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            resetImagePreview("画像サイズは3MB以下にしてください。");
            showMessage("画像サイズは3MB以下にしてください。");
            return;
        }

        if (!imagePreview) return;

        imagePreview.replaceChildren();
        const loadingMessage = document.createElement("span");
        loadingMessage.textContent = "画像を読み込んでいます...";
        imagePreview.appendChild(loadingMessage);

        const reader = new FileReader();

        reader.onload = () => {
            if (currentLoadId !== imageLoadId) return;

            if (typeof reader.result !== "string") {
                resetImagePreview("画像を読み込めませんでした。");
                showMessage("画像を読み込めませんでした。");
                return;
            }

            selectedImage = reader.result;
            imagePreview.replaceChildren();

            const image = document.createElement("img");
            image.src = selectedImage;
            image.alt = "登録する服のプレビュー";
            image.style.width = "100%";
            image.style.height = "100%";
            image.style.objectFit = "contain";

            image.onerror = () => {
                if (currentLoadId !== imageLoadId) return;
                resetImagePreview("画像を表示できませんでした。");
                showMessage("画像を表示できませんでした。");
            };

            imagePreview.appendChild(image);

            if (aiClassifyBtn) {
                aiClassifyBtn.disabled = false;
                aiClassifyBtn.textContent = "画像から主な色を推定";
            }
        };

        reader.onerror = () => {
            if (currentLoadId !== imageLoadId) return;
            resetImagePreview("画像を読み込めませんでした。もう一度選択してください。");
            showMessage("画像を読み込めませんでした。");
        };

        reader.readAsDataURL(file);
    }

    if (imagePreview && imageInput) {
        imagePreview.addEventListener("click", () => {
            if (!isSaving && !isAnalyzing) imageInput.click();
        });

        imagePreview.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (!isSaving && !isAnalyzing) imageInput.click();
            }
        });

        imageInput.addEventListener("change", () => {
            if (isSaving || isAnalyzing) return;
            const file = imageInput.files?.[0];
            if (file) previewImage(file);
        });

        imagePreview.addEventListener("dragover", event => {
            event.preventDefault();
            if (!isSaving && !isAnalyzing) imagePreview.classList.add("dragging");
        });

        imagePreview.addEventListener("dragleave", event => {
            if (!imagePreview.contains(event.relatedTarget)) {
                imagePreview.classList.remove("dragging");
            }
        });

        imagePreview.addEventListener("drop", event => {
            event.preventDefault();
            imagePreview.classList.remove("dragging");
            if (isSaving || isAnalyzing) return;
            const file = event.dataTransfer?.files?.[0];
            if (file) {
                imageInput.value = "";
                previewImage(file);
            }
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener("click", () => {
            if (!isSaving && !isAnalyzing) {
                window.location.href = "closet.html";
            }
        });
    }

    function getColorName(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const brightness = (r + g + b) / 3;
        const difference = max - min;

        if (brightness >= 238 && difference < 25) return "ホワイト";
        if (brightness <= 45) return "ブラック";
        if (difference < 22) return brightness >= 190 ? "ライトグレー" : "グレー";

        let hue;
        if (max === r) hue = 60 * (((g - b) / difference) % 6);
        else if (max === g) hue = 60 * ((b - r) / difference + 2);
        else hue = 60 * ((r - g) / difference + 4);

        if (hue < 0) hue += 360;
        const saturation = difference / max;

        if (hue >= 15 && hue < 45 && brightness < 185 && saturation >= 0.25) {
            return brightness < 115 ? "ブラウン" : "ベージュ";
        }
        if (hue < 15 || hue >= 345) return brightness < 120 ? "ダークレッド" : "レッド";
        if (hue < 45) return brightness < 140 ? "ブラウン" : "オレンジ";
        if (hue < 70) return "イエロー";
        if (hue < 165) return brightness < 100 ? "ダークグリーン" : "グリーン";
        if (hue < 200) return "シアン";
        if (hue < 255) return brightness < 100 ? "ネイビー" : "ブルー";
        if (hue < 290) return "パープル";
        if (hue < 345) return brightness >= 170 ? "ピンク" : "マゼンタ";

        return "グレー";
    }

    function analyzeImageColor(imageData) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d", { willReadFrequently: true });
                    if (!context) throw new Error("画像を分析できませんでした。");

                    const maxSize = 80;
                    const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
                    canvas.width = Math.max(1, Math.round(image.width * scale));
                    canvas.height = Math.max(1, Math.round(image.height * scale));

                    context.drawImage(image, 0, 0, canvas.width, canvas.height);
                    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
                    const colorCounts = new Map();

                    for (let i = 0; i < pixels.length; i += 4) {
                        if (pixels[i + 3] < 128) continue;
                        const colorName = getColorName(pixels[i], pixels[i + 1], pixels[i + 2]);
                        colorCounts.set(colorName, (colorCounts.get(colorName) || 0) + 1);
                    }

                    if (colorCounts.size === 0) throw new Error("画像から色を取得できませんでした。");
                    const dominantColor = [...colorCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
                    resolve(dominantColor);
                } catch (error) {
                    reject(error);
                }
            };
            image.onerror = () => reject(new Error("画像を読み込めませんでした。"));
            image.src = imageData;
        });
    }

    if (aiClassifyBtn) {
        aiClassifyBtn.disabled = true;
        aiClassifyBtn.textContent = "画像から主な色を推定";

        aiClassifyBtn.addEventListener("click", async () => {
            if (!selectedImage) {
                showMessage("先に服の画像を選択してください。");
                return;
            }

            if (isAnalyzing || isSaving) return;

            isAnalyzing = true;
            aiClassifyBtn.disabled = true;
            aiClassifyBtn.textContent = "色を分析しています...";

            try {
                const colorName = await analyzeImageColor(selectedImage);
                if (colorInput) colorInput.value = colorName;
                showMessage(`主な色を「${colorName}」と推定しました。必要に応じて修正してください。`);
            } catch (error) {
                console.error("画像の色分析に失敗しました:", error);
                showMessage("画像を分析できませんでした。色を手動で入力してください。");
            } finally {
                isAnalyzing = false;
                aiClassifyBtn.disabled = !selectedImage;
                aiClassifyBtn.textContent = "画像から主な色を推定";
            }
        });
    }

    function setSavingState(saving) {
        isSaving = saving;
        const submitButton = form.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = saving;
            submitButton.textContent = saving ? "登録中..." : "登録する";
        }
        if (cancelButton) {
            cancelButton.disabled = saving;
        }
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (isSaving || isAnalyzing) return;

        const name = nameInput?.value.trim() || "";
        const category = categoryInput?.value || "";
        const color = colorInput?.value.trim() || "";

        if (!name || !category || !color) {
            showMessage("服の名称・カテゴリー・主な色を入力してください。");
            return;
        }

        setSavingState(true);

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("category", category);
            formData.append("color", color);
            formData.append("pattern", patternInput?.value.trim() || "");
            formData.append("brand", brandInput?.value.trim() || "");
            formData.append("season", seasonInput?.value || "");
            formData.append("style", styleInput?.value.trim() || "");
            
            // 👈 誰が登録したかを紐付けるために user_id を追加！
            formData.append("user_id", userId);

            if (selectedFile) {
                formData.append("image", selectedFile);
            }

            const response = await fetch(API_URL, {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                showMessage("服を登録しました。");
                window.location.href = "closet.html";
            } else {
                const errorData = await response.json();
                showMessage("登録に失敗しました: " + (errorData.error || "エラーが発生しました"));
                setSavingState(false);
            }
        } catch (error) {
            console.error("服の保存に失敗しました:", error);
            showMessage("サーバーとの通信に失敗しました。バックエンド(http://127.0.0.1:5001)が起動しているか確認してください。");
            setSavingState(false);
        }
    });
});