// ==========================================
// profile.js
// プロフィール管理・手動診断設定・データバックアップ・ダークモード切り替えロジック
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. DOM要素の取得
    const profName = document.getElementById("profName");
    const profEmail = document.getElementById("profEmail");
    const profileForm = document.getElementById("profileForm");
    
    const bodyType = document.getElementById("bodyType");
    const faceType = document.getElementById("faceType");
    const saveDiagnosisBtn = document.getElementById("saveDiagnosisBtn");
    
    const exportDataBtn = document.getElementById("exportDataBtn");
    const darkModeToggle = document.getElementById("darkModeToggle");
    const profileLogoutBtn = document.getElementById("profileLogoutBtn");

    // 2. 初期データの読み込みと画面反映
    try {
        // ユーザー情報
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
        if (profName && currentUser.name) profName.value = currentUser.name;
        if (profEmail && currentUser.email) profEmail.value = currentUser.email;

        // 診断設定
        const savedDiagnosis = JSON.parse(localStorage.getItem("userDiagnosis") || "{}");
        if (bodyType && savedDiagnosis.bodyType) bodyType.value = savedDiagnosis.bodyType;
        if (faceType && savedDiagnosis.faceType) faceType.value = savedDiagnosis.faceType;

        // ダークモード設定の同期
        const isDark = localStorage.getItem("appTheme") === "dark";
        if (darkModeToggle) {
            darkModeToggle.checked = isDark;
        }
        if (isDark) {
            document.body.classList.add("dark-theme");
        } else {
            document.body.classList.remove("dark-theme");
        }
    } catch (e) {
        console.error("データ初期化エラー:", e);
    }

    // 3. ダークモード切り替えイベント
    if (darkModeToggle) {
        darkModeToggle.addEventListener("change", (e) => {
            if (e.target.checked) {
                document.body.classList.add("dark-theme");
                localStorage.setItem("appTheme", "dark");
                if (typeof showToast === "function") showToast("ダークモードに切り替えました 🌙");
            } else {
                document.body.classList.remove("dark-theme");
                localStorage.setItem("appTheme", "light");
                if (typeof showToast === "function") showToast("ライトモードに切り替えました ☀️");
            }
        });
    }

    // 4. プロフィール情報更新
    if (profileForm) {
        profileForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const updatedName = profName ? profName.value.trim() : "";
            const updatedEmail = profEmail ? profEmail.value.trim() : "";

            if (!updatedName || !updatedEmail) {
                alert("名前とメールアドレスを入力してください。");
                return;
            }

            const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
            const updatedUser = {
                ...currentUser,
                name: updatedName,
                email: updatedEmail
            };

            localStorage.setItem("currentUser", JSON.stringify(updatedUser));
            
            if (typeof showToast === "function") {
                showToast("ユーザー情報を更新しました！");
            } else {
                alert("ユーザー情報を更新しました！");
            }
        });
    }

    // 5. 診断データ手動保存
    if (saveDiagnosisBtn) {
        saveDiagnosisBtn.addEventListener("click", () => {
            const diagnosisData = {
                bodyType: bodyType ? bodyType.value : "",
                faceType: faceType ? faceType.value : "",
                updatedAt: new Date().toLocaleDateString()
            };
            localStorage.setItem("userDiagnosis", JSON.stringify(diagnosisData));
            if (typeof showToast === "function") showToast("診断設定を保存しました！");
        });
    }

    // 6. データのエクスポート（JSONバックアップ機能）
    if (exportDataBtn) {
        exportDataBtn.addEventListener("click", () => {
            try {
                const exportData = {
                    user: JSON.parse(localStorage.getItem("currentUser") || "{}"),
                    diagnosis: JSON.parse(localStorage.getItem("userDiagnosis") || "{}"),
                    clothes: JSON.parse(localStorage.getItem("closetItems") || "[]"),
                    exportDate: new Date().toISOString()
                };

                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
                const downloadAnchor = document.createElement("a");
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `digital_closet_backup_${new Date().toISOString().slice(0, 10)}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();

                if (typeof showToast === "function") showToast("データをダウンロードしました");
            } catch (e) {
                console.error("エクスポートエラー:", e);
                if (typeof showToast === "function") showToast("エクスポートに失敗しました");
            }
        });
    }

    // 7. ログアウト処理の実行
    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener("click", () => {
            if (typeof logout === "function") {
                logout();
            } else {
                localStorage.removeItem("currentUser");
                alert("ログアウトしました");
                window.location.href = "login.html";
            }
        });
    }
});