document.addEventListener("DOMContentLoaded", () => {
    // 1. 「＋ 服を登録する」ボタンのクリックイベントを設定
    const registerBtn = document.querySelector(".register-button");
    if (registerBtn) {
        registerBtn.addEventListener("click", () => {
            window.location.href = "add-cloth.html";
        });
    }

    // 2. 「すべて見る」リンクの遷移先を設定
    const viewAllLink = document.querySelector(".section-title a");
    if (viewAllLink) {
        viewAllLink.setAttribute("href", "closet.html");
    }

    // 3. 各服カードをクリックした時に「服詳細画面」へ遷移する処理
    const clothesCards = document.querySelectorAll(".clothes-card");
    clothesCards.forEach((card, index) => {
        card.style.cursor = "pointer";
        card.addEventListener("click", () => {
            // 例: ダミーID（1, 2, 3...）を渡して詳細画面へ
            window.location.href = `detail.html?id=${index + 1}`;
        });
    });

    console.log("Digital Closet: トップ画面 (index.html) の初期化完了");
});