// ==========================================
// File: js/login.js
// Date: 2026-11-09
// Creator: K025C2093 吉川蔣
// ==========================================

// ==========================================
// ログイン・会員登録およびログアウト処理（API連携版）
// ==========================================

// アクセスしている端末のホスト名（PCなら127.0.0.1、スマホならテザリングのIP）に自動で合わせる
const API_BASE = `http://${window.location.hostname}:5001`;

document.addEventListener("DOMContentLoaded", () => {
    const authForm = document.getElementById("authForm") || document.getElementById("loginForm");
    const formTitle = document.getElementById("formTitle");
    const nameGroup = document.getElementById("nameGroup");
    const userNameInput = document.getElementById("userName");
    const authSubmitBtn = document.getElementById("authSubmitBtn");
    const toggleAuthModeBtn = document.getElementById("toggleAuthModeBtn");
    const toggleText = document.getElementById("toggleText");

    let isRegisterMode = false;

    // ログイン <-> 新規登録 モード切り替え
    if (toggleAuthModeBtn) {
        toggleAuthModeBtn.addEventListener("click", () => {
            isRegisterMode = !isRegisterMode;
            if (isRegisterMode) {
                if (formTitle) formTitle.textContent = "新規会員登録";
                if (nameGroup) nameGroup.style.display = "block";
                if (userNameInput) userNameInput.required = true;
                if (authSubmitBtn) authSubmitBtn.textContent = "会員登録して始める";
                if (toggleText) toggleText.textContent = "すでにアカウントをお持ちですか？";
                toggleAuthModeBtn.textContent = "ログイン";
            } else {
                if (formTitle) formTitle.textContent = "ログイン";
                if (nameGroup) nameGroup.style.display = "none";
                if (userNameInput) userNameInput.required = false;
                if (authSubmitBtn) authSubmitBtn.textContent = "ログイン";
                if (toggleText) toggleText.textContent = "アカウントをお持ちでないですか？";
                toggleAuthModeBtn.textContent = "新規会員登録";
            }
        });
    }

    // フォーム送信処理（API連携）
    if (authForm) {
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");

            const email = emailInput ? emailInput.value.trim() : "";
            const password = passwordInput ? passwordInput.value : "";
            const userName = (userNameInput && userNameInput.value.trim()) ? userNameInput.value.trim() : email.split('@')[0];

            if (!email || !password) {
                if (typeof showToast === "function") {
                    showToast("メールアドレスとパスワードを入力してください");
                } else {
                    alert("メールアドレスとパスワードを入力してください");
                }
                return;
            }

            // ★ パスワード桁数チェック（6文字以上）
            if (password.length < 6) {
                if (typeof showToast === "function") {
                    showToast("パスワードは6文字以上で入力してください");
                } else {
                    alert("パスワードは6文字以上で入力してください");
                }
                return;
            }

            if (authSubmitBtn) {
                authSubmitBtn.disabled = true;
                authSubmitBtn.textContent = "通信中...";
            }

            try {
                // 新規登録モードかログインモードかでエンドポイントを切り替え
                const endpoint = isRegisterMode ? "/signup" : "/login";
                
                const response = await fetch(`${API_BASE}${endpoint}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: email, // メールアドレスをユーザー名として使用
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    const userData = {
                        id: data.user ? data.user.id : null,
                        name: userName,
                        email: email
                    };
                    handleLoginSuccess(userData, isRegisterMode);
                } else {
                    alert(data.error || "処理に失敗しました。入力内容を確認してください。");
                    if (authSubmitBtn) {
                        authSubmitBtn.disabled = false;
                        authSubmitBtn.textContent = isRegisterMode ? "会員登録して始める" : "ログイン";
                    }
                }

            } catch (error) {
                console.error("認証エラー:", error);
                alert("サーバーとの通信に失敗しました。Pythonサーバー(app.py)が起動しているか確認してください。");
                if (authSubmitBtn) {
                    authSubmitBtn.disabled = false;
                    authSubmitBtn.textContent = isRegisterMode ? "会員登録して始める" : "ログイン";
                }
            }
        });
    }
});

// ------------------------------------------
// ログイン成功時の共通処理関数
// ------------------------------------------
function handleLoginSuccess(userData, isRegister = false) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUser", JSON.stringify(userData));

    if (typeof showToast === "function") {
        showToast(isRegister ? "会員登録が完了しました" : "ログインしました");
    } else {
        alert(isRegister ? "会員登録が完了しました" : "ログインしました");
    }

    // メイン画面へリダイレクト
    setTimeout(() => {
        window.location.href = "closet.html";
    }, 800);
}