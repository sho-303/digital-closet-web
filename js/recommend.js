// EC連携・トレンドおすすめ画面のロジック

document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("recommendGrid");
    const filterBtns = document.querySelectorAll(".filter-btn");

    // モックデータ：ZOZO・ユニクロ・GUのトレンド＆診断おすすめアイテム
    const items = [
        {
            id: 1,
            brand: "uniqlo",
            brandName: "ユニクロ",
            title: "オックスフォードシャツ（長袖）",
            price: "¥2,990",
            category: "トップス",
            matchTag: "骨格ストレート・きれいめ",
            imageUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='100%' height='100%' fill='%23edf2f7'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%234a5568' font-size='14'>UNIQLO Shirt</text></svg>",
            link: "https://www.uniqlo.com"
        },
        {
            id: 2,
            brand: "gu",
            brandName: "GU",
            title: "バギージーンズ",
            price: "¥2,990",
            category: "パンツ",
            matchTag: "骨格ナチュラル・ストリート",
            imageUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='100%' height='100%' fill='%23e2e8f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%234a5568' font-size='14'>GU Denim</text></svg>",
            link: "https://www.gu-global.com"
        },
        {
            id: 3,
            brand: "zozo",
            brandName: "ZOZOTOWN",
            title: "ルーズシルエット クロップドTシャツ",
            price: "¥3,520",
            category: "トップス",
            matchTag: "骨格ウェーブ・フレッシュ",
            imageUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='100%' height='100%' fill='%23feebc8'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23744210' font-size='14'>ZOZO T-Shirt</text></svg>",
            link: "https://zozo.jp"
        },
        {
            id: 4,
            brand: "uniqlo",
            brandName: "ユニクロ",
            title: "タックワイドパンツ",
            price: "¥3,990",
            category: "パンツ",
            matchTag: "大人顔・トレンドNo.1",
            imageUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='100%' height='100%' fill='%23e9d8fd'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23553c9a' font-size='14'>UNIQLO Pants</text></svg>",
            link: "https://www.uniqlo.com"
        },
        {
            id: 5,
            brand: "zozo",
            brandName: "ZOZOTOWN",
            title: "オーバーサイズ テーラードジャケット",
            price: "¥8,800",
            category: "アウター",
            matchTag: "クール顔・相性抜群",
            imageUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='100%' height='100%' fill='%23c6f6d5'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%22543d' font-size='14'>ZOZO Jacket</text></svg>",
            link: "https://zozo.jp"
        }
    ];

    // アイテムレンダリング関数
    const renderItems = (brandFilter = "all") => {
        grid.innerHTML = "";
        const filtered = brandFilter === "all" ? items : items.filter(item => item.brand === brandFilter);

        if (filtered.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #a0aec0; padding: 40px 0;">該当するアイテムが見つかりませんでした。</p>`;
            return;
        }

        filtered.forEach(item => {
            const card = document.createElement("div");
            card.className = "clothes-card";
            card.innerHTML = `
                <div style="position: relative;">
                    <img src="${item.imageUrl}" alt="${item.title}" class="clothes-image">
                    <span style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.7); color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px;">${item.brandName}</span>
                </div>
                <div class="clothes-info">
                    <span style="font-size: 11px; color: #3182ce; font-weight: bold;">✨ ${item.matchTag}</span>
                    <h3 class="clothes-name" style="font-size: 14px; margin: 4px 0;">${item.title}</h3>
                    <p class="clothes-category" style="font-size: 15px; font-weight: bold; color: #2d3748;">${item.price}</p>
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer" style="display: block; margin-top: 8px; text-align: center; background: #f7fafc; border: 1px solid #cbd5e0; color: #4a5568; padding: 6px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: bold;">ショップで見る ↗</a>
                </div>
            `;
            grid.appendChild(card);
        });
    };

    // 初期表示
    renderItems("all");

    // フィルターボタン切り替え
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => {
                b.style.background = "#fff";
                b.style.color = "#4a5568";
            });
            btn.style.background = "#3182ce";
            btn.style.color = "#fff";

            const selectedBrand = btn.getAttribute("data-brand");
            renderItems(selectedBrand);
        });
    });
});