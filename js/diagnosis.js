// カメラ起動・リアルタイム顔認証および骨格診断ロジック

document.addEventListener("DOMContentLoaded", () => {
    const startCameraBtn = document.getElementById("startCameraBtn");
    const webcam = document.getElementById("webcam");
    const cameraPlaceholder = document.getElementById("cameraPlaceholder");
    const faceGuide = document.getElementById("faceGuide");
    const scanLine = document.getElementById("scanLine");
    const photoCanvas = document.getElementById("photoCanvas");
    const form = document.getElementById("diagnosisForm");
    const resultArea = document.getElementById("diagnosisResultArea");
    const submitBtn = document.getElementById("startDiagnosisBtn");

    let isCameraActive = false;
    let capturedDataUrl = null;

    // 1. Webカメラ起動処理 (navigator.mediaDevices.getUserMedia)
    if (startCameraBtn) {
        startCameraBtn.addEventListener("click", async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user" },
                    audio: false
                });
                webcam.srcObject = stream;
                webcam.style.display = "block";
                cameraPlaceholder.style.display = "none";
                faceGuide.style.display = "block";
                isCameraActive = true;
                showToast("カメラを起動しました。ガイド枠に顔を合わせてください");
            } catch (err) {
                console.warn("カメラへのアクセスが拒否されたか利用できません:", err);
                showToast("カメラを起動できませんでした。そのまま手動で進められます");
            }
        });
    }

    // 2. 診断フォーム送信（スキャンアニメーションと画像キャプチャ）
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const bodyFeature = document.getElementById("bodyFeature").value;
            const impression = document.getElementById("faceImpression").value.trim() || "おまかせ";

            submitBtn.disabled = true;
            submitBtn.textContent = "⌛ 顔パーツの位置・比率を解析中...";

            // カメラが有効な場合はキャンバスに一瞬で静止画を撮影
            if (isCameraActive && webcam.srcObject) {
                const ctx = photoCanvas.getContext("2d");
                photoCanvas.width = webcam.videoWidth || 320;
                photoCanvas.height = webcam.videoHeight || 240;
                ctx.drawImage(webcam, 0, 0, photoCanvas.width, photoCanvas.height);
                capturedDataUrl = photoCanvas.toDataURL("image/jpeg");

                // スキャン線の演出アニメーション
                scanLine.style.display = "block";
                scanLine.animate([
                    { top: '0%' },
                    { top: '100%' }
                ], {
                    duration: 1200,
                    iterations: 2
                });
            }

            // モック解析処理（※B/C担当のAPI完成後は、ここで撮影した画像データを /api/ai/face-diagnose に送信します）
            setTimeout(() => {
                // カメラ停止処理
                if (isCameraActive && webcam.srcObject) {
                    webcam.srcObject.getTracks().forEach(track => track.stop());
                    scanLine.style.display = "none";
                }

                // 顔画像プレビューのセット
                const capturedImgEl = document.getElementById("capturedFaceImg");
                if (capturedDataUrl) {
                    capturedImgEl.src = capturedDataUrl;
                } else {
                    capturedImgEl.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='120' viewBox='0 0 100 120'><rect width='100%' height='100%' fill='%23edf2f7'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23a0aec0' font-size='12'>未撮影</text></svg>";
                }

                // 疑似AI解析計算結果
                const faceTypes = [
                    { type: "フレッシュタイプ（子供顔 × 直線・曲線ミックス）", metrics: "目元: 丸みあり / 輪郭: すっきり / 比率: 若々しい子供顔比率", style: "カジュアルで爽やかなスタイルや、シンプルなTシャツ・シャツコーデが最も引き立ちます。" },
                    { type: "エレガントタイプ（大人顔 × 直線・曲線ミックス）", metrics: "パーツサイズ: 大きめ / 輪郭: 卵型 / 比率: 黄金比大人顔", style: "上品で華やかなスタイルや、適度にハリのある素材・キレイめな着こなしが得意です。" },
                    { type: "クールタイプ（大人顔 × 直線）", metrics: "目元: シャープ / 輪郭: 面長・すっきり / 比率: スタイリッシュ大人顔", style: "シンプルでシャープなデザインや、ジャケットスタイル・モードカジュアルが映えます。" }
                ];

                // ランダムまたは印象に応じた選択
                const randomFace = faceTypes[Math.floor(Math.random() * faceTypes.length)];

                document.getElementById("faceTypeTitle").textContent = randomFace.type;
                document.getElementById("faceDetailMetrics").textContent = randomFace.metrics;

                // 骨格結果のセット
                let skeletonType = "";
                let skeletonDesc = "";
                let itemsList = [];

                if (bodyFeature === "wave") {
                    skeletonType = "骨格ウェーブタイプ";
                    skeletonDesc = "華奢でゆるやかな曲線が特徴。ハイウエスト仕様のボトムスや首元が開いたトップスで重心を上に見せると抜群にスタイルアップします。";
                    itemsList = ["ハイウエストスキニー/スラックス", "クロップド丈のトップス", "ソフトなニット・開襟シャツ"];
                } else if (bodyFeature === "natural") {
                    skeletonType = "骨格ナチュラルタイプ";
                    skeletonDesc = "フレーム感が美しくスタイリッシュなタイプ。ゆったりとしたオーバーサイズや質感のある服をラフに着こなすのが得意です。";
                    itemsList = ["オーバーサイズTシャツ・シャツ", "ワイドストレートデニム", "ロングコート・ロング丈カーディガン"];
                } else {
                    skeletonType = "骨格ストレートタイプ";
                    skeletonDesc = "全体的に立体感のあるメリハリボディ。Iラインを意識したジャストサイズでシンプルな服を着こなすことで質感が高見えします。";
                    itemsList = ["ジャストサイズのV/クルーネックT", "ストレートスラックス", "テーラードジャケット"];
                }

                document.getElementById("skeletonResult").textContent = skeletonType;
                document.getElementById("skeletonDesc").textContent = skeletonDesc;
                document.getElementById("styleTitle").textContent = `顔×骨格のおすすめ: ${randomFace.type.split('（')[0]} × ${skeletonType.split('タイプ')[0]}`;
                document.getElementById("styleDesc").textContent = `${randomFace.style} 骨格の特徴を活かしつつ、「${impression}」のテイストを取り入れたワンランク上のコーディネートをご提案します。`;

                const ul = document.getElementById("recommendedItemsList");
                ul.innerHTML = "";
                itemsList.forEach(item => {
                    const li = document.createElement("li");
                    li.textContent = item;
                    ul.appendChild(li);
                });

                resultArea.style.display = "block";
                resultArea.scrollIntoView({ behavior: "smooth" });

                submitBtn.disabled = false;
                submitBtn.textContent = "✨ カメラ画像と骨格から詳細診断する";
                showToast("AI顔認証・詳細診断が完了しました！");
            }, 2000);
        });
    }
});

// diagnosis.js
document.addEventListener("DOMContentLoaded", () => {
    const saveBtn = document.getElementById("saveDiagnosisBtn");
    const bodyTypeSelect = document.getElementById("bodyTypeSelect");
    const faceTypeSelect = document.getElementById("faceTypeSelect");

    // 保存済みの診断結果があれば初期セット
    const savedDiagnosis = JSON.parse(localStorage.getItem("userDiagnosis") || "{}");
    if (bodyTypeSelect && savedDiagnosis.bodyType) {
        bodyTypeSelect.value = savedDiagnosis.bodyType;
    }
    if (faceTypeSelect && savedDiagnosis.faceType) {
        faceTypeSelect.value = savedDiagnosis.faceType;
    }

    // 診断結果の保存処理
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const bodyType = bodyTypeSelect ? bodyTypeSelect.value : "";
            const faceType = faceTypeSelect ? faceTypeSelect.value : "";

            if (!bodyType && !faceType) {
                alert("骨格タイプまたは顔タイプを選択してください。");
                return;
            }

            const diagnosisData = {
                bodyType: bodyType,
                faceType: faceType,
                updatedAt: new Date().toLocaleDateString()
            };

            localStorage.setItem("userDiagnosis", JSON.stringify(diagnosisData));

            if (typeof showToast === "function") {
                showToast("診断結果を保存しました！");
            } else {
                alert("診断結果を保存しました！");
            }
        });
    }
});