// クローゼット分析画面のロジック

document.addEventListener("DOMContentLoaded", () => {
    const runBtn = document.getElementById("runAnalysisBtn");
    const resultArea = document.getElementById("analysisResultArea");
    const commentEl = document.getElementById("analysisComment");

    if (runBtn) {
        runBtn.addEventListener("click", () => {
            runBtn.disabled = true;
            runBtn.textContent = "⌛ 所有服を集計・分析中...";

            // モック処理（B/C担当のAPI完成後は fetch("/api/ai/analyze-closet") へ接続します）
            setTimeout(() => {
                const mockAnalysis = {
                    total: "5着",
                    category: "トップス (40%)",
                    color: "ホワイト / ブラック",
                    comment: "全体的にシンプルで回ししやすい基本アイテムが揃っています。モノトーン系の服が多いため着回し力は非常に高いですが、アクセントになる中間色（ベージュやカーキ）や羽織ものを追加すると、さらにコーディネートの幅が広がります。"
                };

                document.getElementById("totalCount").textContent = mockAnalysis.total;
                document.getElementById("topCategory").textContent = mockAnalysis.category;
                document.getElementById("topColor").textContent = mockAnalysis.color;
                commentEl.textContent = mockAnalysis.comment;

                resultArea.style.display = "block";
                runBtn.disabled = false;
                runBtn.textContent = "📊 クローゼットの傾向を再分析する";

                showToast("クローゼット分析が完了しました！");
            }, 1200);
        });
    }
});