// ==========================================
// coordinate.js (ユーザー個別管理対応版)
// File: js/coordinate.js
// Date: 2026-10-23
// Creator: K025C2093 吉川蔣
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const API_BASE = `http://${window.location.hostname}:5001`;

    // 1. ログイン中のユーザー情報をチェックしてユーザーIDを取得する
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id;

    if (!userId) {
        alert("ログインしていません。ログイン画面へ移動します。");
        window.location.href = "login.html";
        return;
    }

    const coordForm = document.getElementById("coordForm");
    const coordGrid = document.getElementById("coordGrid");

    const selectOuter = document.getElementById("selectOuter");
    const selectTops = document.getElementById("selectTops");
    const selectBottoms = document.getElementById("selectBottoms");
    const selectShoes = document.getElementById("selectShoes");

    // ログイン中のユーザーの服データのみを読み込む
    async function loadItems() {
        try {
            const res = await fetch(`${API_BASE}/items?user_id=${userId}`);
            if (!res.ok) return;
            const items = await res.json();

            // 既存のセレクトボックスの中身（「選択なし」以外）をクリア
            [selectOuter, selectTops, selectBottoms, selectShoes].forEach(select => {
                if (select) {
                    select.innerHTML = '<option value="">選択なし</option>';
                }
            });

            items.forEach(item => {
                const option = document.createElement("option");
                option.value = item.id;
                option.textContent = `${item.name} (${item.color || '色未設定'})`;

                const cat = (item.category || "").toLowerCase();
                if (cat.includes("アウター") || cat === "outer") {
                    selectOuter.appendChild(option.cloneNode(true));
                } else if (cat.includes("トップ") || cat === "tops") {
                    selectTops.appendChild(option.cloneNode(true));
                } else if (cat.includes("ボトム") || cat.includes("パンツ") || cat === "bottoms") {
                    selectBottoms.appendChild(option.cloneNode(true));
                } else if (cat.includes("シューズ") || cat.includes("靴") || cat === "shoes") {
                    selectShoes.appendChild(option.cloneNode(true));
                }
            });
        } catch (e) {
            console.error("アイテム読み込みエラー", e);
        }
    }

    // ログイン中のユーザーの保存済みコーデのみを読み込む
    async function loadCoordinates() {
        try {
            const res = await fetch(`${API_BASE}/coordinates?user_id=${userId}`);
            if (!res.ok) return;
            const coords = await res.json();

            if (!coordGrid) return;
            coordGrid.replaceChildren();

            if (coords.length === 0) {
                coordGrid.innerHTML = "<p style='color:#777;'>まだコーデが保存されていません。</p>";
                return;
            }

            coords.forEach(c => {
                const card = document.createElement("div");
                card.className = "coord-item-card";

                card.innerHTML = `
                    <h3>${c.title || '無題'} ${c.season ? `<small>(${c.season})</small>` : ''}</h3>
                    <div class="coord-slots">
                        <div>🧥 <b>アウター:</b> ${c.outer ? c.outer.name : 'なし'}</div>
                        <div>👕 <b>トップス:</b> ${c.tops ? c.tops.name : 'なし'}</div>
                        <div>👖 <b>ボトムス:</b> ${c.bottoms ? c.bottoms.name : 'なし'}</div>
                        <div>👟 <b>シューズ:</b> ${c.shoes ? c.shoes.name : 'なし'}</div>
                    </div>
                `;

                const delBtn = document.createElement("button");
                delBtn.className = "delete-coord-btn";
                delBtn.textContent = "削除";
                delBtn.onclick = async () => {
                    if (confirm(`「${c.title}」を削除しますか？`)) {
                        await fetch(`${API_BASE}/coordinates/${c.id}?user_id=${userId}`, { method: "DELETE" });
                        loadCoordinates();
                    }
                };

                card.appendChild(delBtn);
                coordGrid.appendChild(card);
            });
        } catch (e) {
            console.error("コーデ読み込みエラー", e);
        }
    }

    // コーデの新規保存（user_idを含める）
    if (coordForm) {
        coordForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const title = document.getElementById("coordTitle").value.trim();
            const season = document.getElementById("coordSeason").value;

            const payload = {
                user_id: userId, // 👈 誰のコーデか紐付けるために追加！
                title: title,
                season: season,
                outer_id: selectOuter.value ? parseInt(selectOuter.value) : null,
                tops_id: selectTops.value ? parseInt(selectTops.value) : null,
                bottoms_id: selectBottoms.value ? parseInt(selectBottoms.value) : null,
                shoes_id: selectShoes.value ? parseInt(selectShoes.value) : null
            };

            try {
                const res = await fetch(`${API_BASE}/coordinates`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    alert("コーディネートを保存しました！");
                    coordForm.reset();
                    loadCoordinates();
                } else {
                    alert("保存に失敗しました。");
                }
            } catch (err) {
                console.error("保存エラー", err);
            }
        });
    }

    loadItems();
    loadCoordinates();
});