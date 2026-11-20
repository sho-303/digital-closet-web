// ==========================================
// empty-state.js
// 空データ表示（Empty State）の制御ロジック
// ==========================================

/**
 * リストコンテナ内の空状態をチェックして表示切り替えを行う関数
 * @param {Array} items - データ配列
 * @param {HTMLElement} listContainer - カード一覧を表示する親要素
 * @param {Object} config - 表示用設定（アイコン、メッセージ、ボタン設定など）
 */
function renderEmptyStateIfNeeded(items, listContainer, config = {}) {
    if (!listContainer) return false;

    // 既存の Empty State 表示があれば削除
    const existingEmpty = listContainer.querySelector(".empty-state-card");
    if (existingEmpty) existingEmpty.remove();

    if (!items || items.length === 0) {
        const defaultConfig = {
            icon: "👕",
            title: "まだ服が登録されていません",
            description: "お気に入りの服を登録して、AIコーデ提案や管理を始めましょう！",
            buttonText: "＋ 服を登録する",
            buttonLink: "register.html",
            ...config
        };

        const emptyCard = document.createElement("div");
        emptyCard.className = "empty-state-card";
        emptyCard.style.cssText = `
            text-align: center;
            padding: 48px 20px;
            background-color: var(--card-bg, #ffffff);
            border: 2px dashed var(--border-color, #e2e8f0);
            border-radius: 12px;
            margin: 20px 0;
            width: 100%;
            box-sizing: border-box;
        `;

        emptyCard.innerHTML = `
            <div style="font-size: 56px; margin-bottom: 12px; line-height: 1;">${defaultConfig.icon}</div>
            <h3 style="font-size: 18px; font-weight: bold; margin: 0 0 8px 0; color: var(--text-main, #2d3748);">${defaultConfig.title}</h3>
            <p style="font-size: 14px; color: var(--text-sub, #718096); margin: 0 0 20px 0; line-height: 1.5;">${defaultConfig.description}</p>
            ${defaultConfig.buttonText ? `
                <a href="${defaultConfig.buttonLink}" class="btn-empty-action" style="
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #3182ce;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: bold;
                    transition: background-color 0.2s;
                ">${defaultConfig.buttonText}</a>
            ` : ''}
        `;

        listContainer.appendChild(emptyCard);
        return true; // 空状態であることを返す
    }

    return false; // データが存在する
}