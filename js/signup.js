// ==========================================
// File: js/signup.js
// Date: 2026-11-09
// Creator: K025C2093 吉川蔣
// ==========================================

// ==========================================
// signup.js / register-user.js
// 新規登録時の入力チェック・パスワード確認処理（API連携対応版）
// ==========================================

// アクセスしている端末のホスト名（PCなら127.0.0.1、スマホならテザリングのIP）に自動で合わせる
const API_BASE = `http://${window.location.hostname}:5001`;

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    const passwordInput = document.getElementById("signupPassword");
    const confirmPasswordInput = document.getElementById("signupPasswordConfirm");
    const errorMessage = document.getElementById("passwordMatchError");

    // 1. リアルタイムでパスワードの一致チェックを行う（入力中に警告を出す）
    if (passwordInput && confirmPasswordInput) {
        const checkPasswordMatch = () => {
            const pass = passwordInput.value;
            const confirmPass = confirmPasswordInput.value;

            // 確認用がまだ未入力の場合はエラーを表示しない
            if (!confirmPass) {
                if (errorMessage) errorMessage.style.display = "none";
                confirmPasswordInput.style.borderColor = "";
                return;
            }

            if (pass !== confirmPass) {
                if (errorMessage) {
                    errorMessage.textContent = "⚠️ パスワードが一致しません";
                    errorMessage.style.display = "block";
                    errorMessage.style.color = "#e53e3e";
                }
                confirmPasswordInput.style.borderColor = "#e53e3e";
            } else {
                if (errorMessage) errorMessage.style.display = "none";
                confirmPasswordInput.style.borderColor = "#38a169"; // 一致したら緑枠線
            }
        };

        passwordInput.addEventListener("input", checkPasswordMatch);
        confirmPasswordInput.addEventListener("input", checkPasswordMatch);
    }

    // 2. フォーム送信時の最終チェックとユーザー登録処理（API通信）
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("signupName")?.value.trim() || "";
            const email = document.getElementById("signupEmail")?.value.trim() || "";
            const password = passwordInput ? passwordInput.value : "";
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

            // 未入力チェック
            if (!name || !email || !password || !confirmPassword) {
                alert("すべての項目を入力してください。");
                return;
            }

            // パスワード一致チェック
            if (password !== confirmPassword) {
                alert("パスワードと確認用パスワードが一致していません。");
                confirmPasswordInput.focus();
                return;
            }

            // パスワードの文字数チェック（例: 6文字以上）
            if (password.length < 6) {
                alert("パスワードは6文字以上で設定してください。");
                passwordInput.focus();
                return;
            }

            try {
                // バックエンドの /signup API へデータを送信
                const response = await fetch(`${API_BASE}/signup`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: email, // メールアドレスをユーザー識別子として送信
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // ログイン成功情報やユーザー情報を localStorage にも一時保持
                    const currentUser = {
                        id: data.user.id,
                        name: name,
                        email: email
                    };
                    localStorage.setItem("currentUser", JSON.stringify(currentUser));

                    if (typeof showToast === "function") {
                        showToast("🎉 アカウント登録が完了しました！");
                    } else {
                        alert("🎉 アカウント登録が完了しました！");
                    }

                    // ログイン完了後にログイン画面またはメイン画面へ遷移
                    setTimeout(() => {
                        window.location.href = "login.html";
                    }, 1000);

                } else {
                    // サーバーからエラーが返ってきた場合（例：すでに登録されているなど）
                    alert(data.error || "アカウント登録に失敗しました。");
                }

            } catch (error) {
                console.error("登録エラー:", error);
                alert("サーバーとの通信に失敗しました。Pythonサーバー(app.py)が起動しているか確認してください。");
            }
        });
    }
});