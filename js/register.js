// register.js
document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");

    if (!registerForm) return;

    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const confirmPasswordInput = document.getElementById("confirmPassword"); // 確認用

        const name = nameInput ? nameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

        // 入力チェック
        if (!name || !email || !password) {
            alert("すべての項目を入力してください。");
            return;
        }

        // パスワード確認チェック
        if (confirmPasswordInput && password !== confirmPassword) {
            alert("パスワードが一致しません。確認用パスワードを再入力してください。");
            return;
        }

        // ユーザー情報を作成して保存
        const user = {
            name: name,
            email: email,
            password: password // ※実際の開発ではハッシュ化しますが、今回はフロント擬似保存
        };

        // ログイン中のユーザーとして保存
        localStorage.setItem("currentUser", JSON.stringify(user));

        if (typeof showToast === "function") {
            showToast("会員登録が完了しました！");
        } else {
            alert("会員登録が完了しました！");
        }

        // マイページまたは一覧へ遷移
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
    });
});