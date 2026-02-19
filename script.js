document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 🔧 ULTRA-MODERN CONFIGURATION (2026)
    // ==========================================
    const CONFIG = {
        PROJECT_ID: "gen-lang-client-0680898805",
        API_KEY: "AIzaSyCNzZ7zsmJf16WkcU8oGeUdbl1jsaoT6ac",
        PRIMARY_MODEL: "models/gemini-3-flash-preview",
        API_VERSION: "v1beta"
    };

    let currentModel = CONFIG.PRIMARY_MODEL;

    // ==========================================
    // 🧠 CONVERSATION STATE (Multi-turn)
    // ==========================================
    let chatHistory = [];

    // ==========================================
    // 🏗️ DOM ELEMENTS
    // ==========================================
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const resultsArea = document.getElementById('results-area');
    const aiSection = document.getElementById('ai-section');
    const aiResponse = document.getElementById('ai-response');
    const quickMenuGrid = document.querySelector('.quick-menu-grid');

    // ==========================================
    // 🔘 QUICK MENU (20 ITEMS)
    // ==========================================
    const QUICK_TOPICS = [
        "💰 예산 편성 기준", "✅ 신청 자격 요건", "📄 필수 제출 서류", "📅 공모 신청 기간",
        "⚖️ 심사 및 선정 기준", "👥 참여 인력 자격", "🎓 슈퍼바이저 역할", "🎨 예술치료사 자격",
        "🏢 협력 시설 유형", "🖥️ e나라도움 신청", "💸 강사비 지급 기준", "🚗 교통비 지급 기준",
        "📊 회계 검증 수수료", "📢 결과 발표회", "🛠️ 역량 강화 워크숍", "👮 보조 인력 활용",
        "💵 일용 임금 기준", "🚫 선정 제외 사유", "📝 협력 의향 확인서", "📉 사업 포기 패널티"
    ];

    function renderQuickMenu() {
        if (!quickMenuGrid) return;
        quickMenuGrid.innerHTML = '';
        QUICK_TOPICS.forEach(topic => {
            const btn = document.createElement('button');
            btn.className = 'quick-btn';
            btn.textContent = topic;
            btn.onclick = () => searchWithAI(topic + "에 대해 설명해줘");
            quickMenuGrid.appendChild(btn);
        });
    }

    // ==========================================
    // 🚀 ORCHESTRATOR
    // ==========================================
    window.searchWithAI = (query) => {
        if (searchInput) searchInput.value = '';
        if (searchInput) searchInput.placeholder = "추가 질문을 입력하세요...";

        executeChat(query);
    };

    async function executeChat(query) {
        if (!window.PROJECT_DATA) {
            alert("❌ 데이터 파일 로드 실패");
            return;
        }

        // 1. Show Local Snippets
        const docs = findDocuments(query);
        renderDocumentResults(docs);

        // 2. Append User Message
        appendMessage(query, 'user');

        // 3. Show Loading Skeleton
        const loaderId = showLoading();

        // 4. RAG & API
        try {
            const context = getRelevantContext(query, docs);
            const aiResponseText = await tryGenerateContentWithHistory(query, context);

            removeLoading(loaderId);
            appendMessage(aiResponseText, 'ai', query);

        } catch (error) {
            removeLoading(loaderId);
            appendMessage(`⚠️ 오류가 발생했습니다: ${error.message}`, 'ai');
        }
    }

    // ==========================================
    // 💬 UI FUNCTIONS (Chat Bubbles)
    // ==========================================
    function appendMessage(text, type, queryForKey = '') {
        if (!aiSection) return;
        aiSection.classList.remove('hidden');

        const div = document.createElement('div');
        div.className = `chat-message chat-${type}`;

        if (type === 'ai') {
            // 1. Markdown Parsing
            let html = parseMarkdown(text);

            // 2. Smart Highlighting
            if (queryForKey && queryForKey.length > 1) {
                const keywords = queryForKey.replace(/[?.]/g, '').split(/\s+/);
                keywords.forEach(k => {
                    if (k.length < 2) return;
                    const regex = new RegExp(`(${k})`, 'gi');
                    html = html.replace(regex, '<mark>$1</mark>');
                });
            }

            // 3. Download Button Logic (Fixed)
            // Regex to capture filename from [출처: Filename Page ...]
            const citationMatch = text.match(/\[출처:\s*([^0-9]+?)(?=\s+\d+페이지|\s*\])/);
            // Matches "filename.hwpx" before " 5페이지" or end bracket

            if (citationMatch && citationMatch[1]) {
                const rawFilename = citationMatch[1].trim();
                // Find exact filename in PROJECT_DATA to ensure extension accuracy
                const matchedDoc = window.PROJECT_DATA.find(d => d.filename.includes(rawFilename) || rawFilename.includes(d.filename));
                const finalFilename = matchedDoc ? matchedDoc.filename : rawFilename;

                // Unique ID for the button
                const btnId = `dl-btn-${Date.now()}`;

                html += `
                    <br>
                    <button id="${btnId}" class="download-btn" data-file="${finalFilename}">
                        📄 ${finalFilename} 원본 다운로드
                    </button>
                `;

                // Add event listener after appending
                setTimeout(() => {
                    const btn = document.getElementById(btnId);
                    if (btn) {
                        btn.onclick = (e) => handleDownload(e.target.dataset.file);
                    }
                }, 0);
            }

            div.innerHTML = html;
        } else {
            div.textContent = text;
        }

        aiResponse.appendChild(div);
        aiResponse.scrollTop = aiResponse.scrollHeight;
        div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    // 📂 Download Handler (Existence Check)
    async function handleDownload(filename) {
        if (!filename) {
            alert("파일명을 찾을 수 없습니다.");
            return;
        }

        const encodedFilename = encodeURIComponent(filename);
        const relativePath = `./${filename}`; // Relative path as requested

        // Verify Existence via HEAD request (if server) or simple check
        // Note: For local filesystem (file://), fetch might fail or return status 0.
        // We will try a fetch. If it fails seriously, we fallback to simple link click.

        try {
            const response = await fetch(relativePath, { method: 'HEAD' });
            if (response.ok || response.status === 0) { // status 0 for local file success sometimes
                // File exists, trigger download
                const link = document.createElement('a');
                link.href = relativePath;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert(`❌ 파일을 찾을 수 없습니다.\n파일명: ${filename}\n\n서버에 해당 파일이 업로드되었는지 확인해주세요.`);
            }
        } catch (e) {
            // If fetch fails (e.g. CORS on some local setups), try direct open as fallback
            console.warn("Exist check failed, trying direct link:", e);
            const link = document.createElement('a');
            link.href = relativePath;
            link.download = filename;
            link.click();
        }
    }

    function showLoading() {
        if (!aiSection) return;
        aiSection.classList.remove('hidden');
        const id = 'loader-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'loading-skeleton';
        div.innerHTML = `
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
        `;
        aiResponse.appendChild(div);
        div.scrollIntoView({ behavior: 'smooth', block: 'end' });
        return id;
    }

    function removeLoading(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // ==========================================
    // 🤖 SMART API LAYER
    // ==========================================
    async function tryGenerateContentWithHistory(query, context) {
        const systemInstruction = `당신은 '2026 마음치유, 봄처럼' 공모사업의 전문 상담 AI입니다.
**핵심 지침**:
1. 사용자의 질문 의도를 명확히 파악하여 답변하세요.
2. 이전 대화 맥락을 고려하여 답변하세요.
3. 반드시 제공된 [문서 내용]을 근거로 답변하세요.

**답변 형식 (엄수)**:
1. **📌 핵심 요약**: 질문의 핵심에 대한 명확한 결론.
2. **📖 상세 설명**: 글머리 기호 사용.
3. **🔍 관련 근거**: 반드시 **[출처: 문서명 00페이지 - 키워드]** 형식 기재.

문서에 없는 내용은 "관련 정보를 문서에서 찾을 수 없습니다"라고 답하세요.`;

        const currentContextBlock = `[관련 문서 내용]:
${context}

[사용자 질문]:
${query}`;

        const recentHistory = chatHistory.slice(-6);
        const contents = [
            ...recentHistory,
            { role: 'user', parts: [{ text: currentContextBlock }] }
        ];

        try {
            const url = `https://generativelanguage.googleapis.com/${CONFIG.API_VERSION}/${currentModel}:generateContent?key=${CONFIG.API_KEY}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemInstruction }] },
                    contents: contents
                })
            });

            if (!response.ok) {
                if (response.status === 404 || response.status === 400) throw new Error("MODEL_RETRY_NEEDED");
                throw new Error(`HTTP ${response.status}`);
            }

            const json = await response.json();
            const aiText = json.candidates[0].content.parts[0].text;

            chatHistory.push({ role: 'user', parts: [{ text: query }] });
            chatHistory.push({ role: 'model', parts: [{ text: aiText }] });

            return aiText;

        } catch (e) {
            if (e.message === "MODEL_RETRY_NEEDED") {
                const newModel = await discoverValidModel();
                if (newModel) {
                    currentModel = newModel;
                    return await tryGenerateContentWithHistory(query, context);
                }
            }
            throw e;
        }
    }

    async function discoverValidModel() {
        try {
            const listUrl = `https://generativelanguage.googleapis.com/${CONFIG.API_VERSION}/models?key=${CONFIG.API_KEY}`;
            const res = await fetch(listUrl);
            const data = await res.json();
            if (!data.models) return null;
            const flash = data.models.find(m => m.name.includes("flash") && m.supportedGenerationMethods?.includes("generateContent"));
            return flash ? flash.name : data.models[0].name;
        } catch (e) { return null; }
    }

    // ==========================================
    // 🧠 RAG & UTILS
    // ==========================================
    function getRelevantContext(query, relevantDocs) {
        const targets = relevantDocs.length > 0 ? relevantDocs : window.PROJECT_DATA;
        let chunks = [];
        const keywords = query.replace(/[?.]/g, '').split(/\s+/);

        targets.forEach(doc => {
            if (!doc.content) return;
            const sentences = doc.content.split(/(?<=[.?!])\s+/);
            sentences.forEach(sent => {
                if (sent.length < 15) return;
                let score = 0;
                keywords.forEach(k => { if (sent.includes(k)) score += 2; });
                if (score > 0) chunks.push({ text: sent.trim(), score, source: doc.filename });
            });
        });

        chunks.sort((a, b) => b.score - a.score);
        return chunks.slice(0, 30).map(c => `[출처: ${c.source}] ${c.text}`).join('\n\n');
    }

    function findDocuments(query) {
        const results = [];
        if (!window.PROJECT_DATA) return [];
        window.PROJECT_DATA.forEach(doc => {
            if (doc.content && doc.content.includes(query)) {
                const idx = doc.content.indexOf(query);
                const start = Math.max(0, idx - 60);
                const end = Math.min(doc.content.length, idx + 120);

                let snippetRaw = doc.content.substring(start, end);
                const keywords = query.split(/\s+/);
                keywords.forEach(k => {
                    if (k.length > 1) {
                        const regex = new RegExp(`(${k})`, 'gi');
                        snippetRaw = snippetRaw.replace(regex, '<mark>$1</mark>');
                    }
                });

                results.push({
                    filename: doc.filename,
                    snippet: "..." + snippetRaw + "..."
                });
            }
        });
        return results;
    }

    function renderDocumentResults(docs) {
        if (!resultsArea) return;
        resultsArea.innerHTML = '';
        if (docs.length === 0) {
            resultsArea.innerHTML = '<div class="empty-state">관련 문서 내용 없음</div>';
            return;
        }
        docs.forEach(d => {
            const div = document.createElement('div');
            div.className = 'result-card';
            div.innerHTML = `
                <div class="card-header">📄 ${d.filename}</div>
                <div class="card-body">...${d.snippet}...</div>
            `;
            resultsArea.appendChild(div);
        });
    }

    function parseMarkdown(text) {
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^(-|\*) (.*$)/gm, '<li>$2</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n/g, '<br>');

        return html
            .replace(/1\. 📌 핵심 요약/g, '<div class="ans-step"><b>1. 📌 핵심 요약</b></div>')
            .replace(/2\. 📖 상세 설명/g, '<div class="ans-step"><b>2. 📖 상세 설명</b></div>')
            .replace(/3\. 🔍 관련 근거/g, '<div class="ans-step"><b>3. 🔍 관련 근거</b></div>');
    }

    // ==========================================
    // 🖱️ MAIN EVENT LISTENERS
    // ==========================================
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const val = searchInput ? searchInput.value.trim() : "";
            if (val) window.searchWithAI(val);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = searchInput.value.trim();
                if (e.isComposing || e.keyCode === 229) return;
                if (val) window.searchWithAI(val);
            }
        });
    }

    renderQuickMenu();
});
