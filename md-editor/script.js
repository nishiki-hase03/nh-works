/**
 * Premium Markdown Editor - Script
 * このファイルは、Markdownのレンダリング、プレビューとの同期、歴史管理（Undo/Redo）、
 * 数式の処理、およびダイアグラム（Mermaid/PlantUML）の生成を制御します。
 */

const markdownInput = document.getElementById('markdown-input');
const previewOutput = document.getElementById('preview-output');
const syncStatus = document.getElementById('sync-status');
const contextMenu = document.getElementById('context-menu');
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const btnRefresh = document.getElementById('btn-refresh');
const btnSetBefore = document.getElementById('btn-set-before');
const btnSetAfter = document.getElementById('btn-set-after');
const btnTheme = document.getElementById('btn-theme');
const btnCopy = document.getElementById('btn-copy');
const diffOutput = document.getElementById('diff-output');
const lineNumbersGutter = document.getElementById('line-numbers');
const toggleUnderline = document.getElementById('toggle-underline');
const toggleTOC = document.getElementById('toggle-toc');
const tocContainer = document.getElementById('toc-container');
const tocContent = document.getElementById('toc-content');
const paneResizer = document.getElementById('pane-resizer');
const editorPane = document.querySelector('.editor-pane');
const previewPane = document.querySelector('.preview-pane');

// ファイル・フォルダ操作用
const btnOpenFolder = document.getElementById('btn-open-folder');
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const btnOpen = document.getElementById('btn-open');
const btnSave = document.getElementById('btn-save');
const btnSaveAs = document.getElementById('btn-save-as');
const currentFilenameDisplay = document.getElementById('current-filename');
const fileExplorer = document.getElementById('file-explorer');
const fileTree = document.getElementById('file-tree');
const btnCloseFolder = document.getElementById('btn-close-folder');
const explorerResizer = document.getElementById('explorer-resizer');

// 表示モード切替用
const btnViewEditor = document.getElementById('btn-view-editor');
const btnViewSplit = document.getElementById('btn-view-split');
const btnViewPreview = document.getElementById('btn-view-preview');
const tabEditPane = document.getElementById('tab-edit');
const previewPath = document.getElementById('preview-path');

let currentFileHandle = null;
let currentDirectoryHandle = null;
let currentFileRelativePath = []; // 現在のファイルのフォルダ内相対パス
let isFileModified = false;
let isViewingImage = false;
let currentObjectURL = null;
let previewObjectURLs = [];

let debounceTimer;
let currentTargetCell = null;
let isUpdatingFromPreview = false;
let isResizing = false;
let resizeStartX = 0;
let resizeStartWidth = 0;

// 最も確実なイベントキャプチャのためのオーバーレイ
const dragOverlay = document.createElement('div');
dragOverlay.style.position = 'fixed';
dragOverlay.style.top = '0';
dragOverlay.style.left = '0';
dragOverlay.style.width = '100vw';
dragOverlay.style.height = '100vh';
dragOverlay.style.zIndex = '2147483647'; // 最大値
dragOverlay.style.cursor = 'col-resize';
dragOverlay.style.display = 'none';
document.body.appendChild(dragOverlay);

// --- エディタ同期ロジック ---

/**
 * ソースエディタの行番号を更新します。
 */
function updateLineNumbers() {
    const lines = markdownInput.value.split('\n');
    const count = lines.length;
    let numbersHtml = '';
    for (let i = 1; i <= count; i++) {
        numbersHtml += `<div>${i}</div>`;
    }
    lineNumbersGutter.innerHTML = numbersHtml;
}

/**
 * エディタのスクロールに行番号ガターを同期させます。
 */
markdownInput.addEventListener('scroll', () => {
    lineNumbersGutter.scrollTop = markdownInput.scrollTop;
});

/**
 * エディタでのTabキー入力をサポートします（4つのスペースを挿入）。
 */
markdownInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        const value = markdownInput.value;

        // カーソル位置に4つのスペースを挿入
        markdownInput.value = value.substring(0, start) + '    ' + value.substring(end);

        // カーソル位置を挿入したスペースの後に移動
        markdownInput.selectionStart = markdownInput.selectionEnd = start + 4;

        // 入力イベントを手動で発生させて同期をトリガー
        markdownInput.dispatchEvent(new Event('input'));
    }
});

// --- テーマ管理 ---

/**
 * ローカルストレージからテーマを読み込んで初期化します。
 */
function initTheme() {
    const savedTheme = localStorage.getItem('md-editor-theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        btnTheme.innerText = '☀️';
    } else {
        document.body.classList.remove('light-mode');
        btnTheme.innerText = '🌙';
    }
}

/**
 * ライトモードとダークモードを切り替えます。
 */
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('md-editor-theme', isLight ? 'light' : 'dark');
    btnTheme.innerText = isLight ? '☀️' : '🌙';
}

btnTheme.onclick = () => toggleTheme();
initTheme();

// --- プレビュー設定（下線・目次） ---

/**
 * 見出しの下線表示を切り替えます。
 */
toggleUnderline.addEventListener('change', () => {
    if (toggleUnderline.checked) {
        previewOutput.classList.add('show-underline');
    } else {
        previewOutput.classList.remove('show-underline');
    }
    localStorage.setItem('md-editor-show-underline', toggleUnderline.checked);
});

/**
 * 目次の表示・非表示を切り替えます。
 */
toggleTOC.addEventListener('change', () => {
    if (toggleTOC.checked) {
        tocContainer.classList.remove('hidden');
    } else {
        tocContainer.classList.add('hidden');
    }
    localStorage.setItem('md-editor-show-toc', toggleTOC.checked);
});

function initPreviewConfig() {
    const showUnderline = localStorage.getItem('md-editor-show-underline') === 'true';
    const showTOC = localStorage.getItem('md-editor-show-toc') !== 'false'; // デフォルトは表示

    toggleUnderline.checked = showUnderline;
    if (showUnderline) previewOutput.classList.add('show-underline');

    toggleTOC.checked = showTOC;
    if (!showTOC) tocContainer.classList.add('hidden');
}

initPreviewConfig();

// --- File System Access API 実装 ---

function clearPreviewObjectURLs() {
    previewObjectURLs.forEach(url => URL.revokeObjectURL(url));
    previewObjectURLs = [];
}

async function promptUnsavedChanges() {
    if (isFileModified) {
        return confirm('変更が保存されていません。移動してよろしいできますか？');
    }
    return true;
}

// --- リサイズロジック ---
async function openFile() {
    if (!(await promptUnsavedChanges())) return;
    try {
        const [handle] = await window.showOpenFilePicker({
            types: [{ description: 'Markdown Files', accept: { 'text/markdown': ['.md', '.markdown'], 'text/plain': ['.txt'] } }],
        });
        await openFileFromHandle(handle);
    } catch (err) {
        if (err.name !== 'AbortError') console.error('File open error:', err);
    }
}

async function updateCurrentFileRelativePath(fileHandle) {
    if (currentDirectoryHandle) {
        try {
            const relativePath = await currentDirectoryHandle.resolve(fileHandle);
            currentFileRelativePath = relativePath ? relativePath.slice(0, -1) : [];
        } catch (e) {
            console.warn("Could not resolve relative path:", e);
            currentFileRelativePath = [];
        }
    } else {
        currentFileRelativePath = [];
    }
}

async function openFileFromHandle(fileHandle) {
    try {
        currentFileHandle = fileHandle;
        await updateCurrentFileRelativePath(fileHandle);

        const file = await fileHandle.getFile();
        const contents = await file.text();

        isViewingImage = false;
        markdownInput.disabled = false;
        markdownInput.value = contents;
        markdownInput.scrollTop = 0;

        await renderMarkdown(false);
        undoStack = [contents];
        redoStack = [];
        updateHistoryButtons();

        isFileModified = false;
        currentFilenameDisplay.textContent = file.name;
        document.title = `${file.name} - Premium Markdown Editor`;

        updatePreviewPath();
        syncSidebar(fileHandle);
    } catch (err) {
        console.error('File handle open error:', err);
        alert(`ファイルの読み込みに失敗しました。\n詳細: ${err.message}`);
    }
}

async function saveFile() {
    if (isViewingImage) {
        alert("画像ファイルは直接上書き保存できません。");
        return;
    }
    if (!currentFileHandle) return saveFileAs();
    try {
        const writable = await currentFileHandle.createWritable();
        await writable.write(markdownInput.value);
        await writable.close();
        isFileModified = false;
        if (currentFilenameDisplay.textContent.endsWith('*')) {
            currentFilenameDisplay.textContent = currentFilenameDisplay.textContent.slice(0, -1);
        }
        syncStatus.innerText = 'Saved';
        setTimeout(() => syncStatus.innerText = 'Synced', 2000);
    } catch (err) {
        console.error('File save error:', err);
        alert(`保存に失敗しました。\n詳細: ${err.message}`);
    }
}

async function saveFileAs() {
    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: currentFilenameDisplay.textContent.replace('*', '') || 'untitled.md',
            types: [{ description: 'Markdown Files', accept: { 'text/markdown': ['.md'] } }],
        });
        currentFileHandle = handle;
        await saveFile();
    } catch (err) {
        if (err.name !== 'AbortError') console.error('File save as error:', err);
    }
}

async function openFolder() {
    try {
        const dirHandle = await window.showDirectoryPicker();
        currentDirectoryHandle = dirHandle;

        fileExplorer.classList.remove('hidden');
        btnToggleSidebar.classList.remove('hidden');
        if (explorerResizer) explorerResizer.classList.remove('hidden');
        fileTree.innerHTML = '<li style="padding:10px; color:var(--text-secondary)">Loading...</li>';

        await renderDirectoryTree(dirHandle, fileTree);
    } catch (err) {
        if (err.name !== 'AbortError') console.error('Folder open error:', err);
    }
}

async function renderDirectoryTree(dirHandle, containerUl) {
    containerUl.innerHTML = '';
    const entries = [];
    for await (const entry of dirHandle.values()) {
        entries.push(entry);
    }

    entries.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
        const li = document.createElement('li');
        if (entry.kind === 'directory') {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'tree-item directory';
            itemDiv.dataset.name = entry.name;
            itemDiv.innerHTML = `<span class="tree-icon">📁</span>${entry.name}`;

            const childrenUl = document.createElement('ul');
            childrenUl.className = 'tree-children';

            itemDiv.onclick = async (e) => {
                e.stopPropagation();
                const isExpanded = childrenUl.classList.contains('expanded');
                itemDiv.querySelector('.tree-icon').textContent = isExpanded ? '📁' : '📂';
                childrenUl.classList.toggle('expanded');
                if (!isExpanded && childrenUl.innerHTML === '') {
                    await renderDirectoryTree(entry, childrenUl);
                }
            };
            li.appendChild(itemDiv);
            li.appendChild(childrenUl);
        } else {
            const isText = entry.name.match(/\.(md|markdown|txt)$/i);
            const isImage = entry.name.match(/\.(png|jpe?g|gif|svg|webp)$/i);
            if (!isText && !isImage) continue;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'tree-item';
            itemDiv.dataset.name = entry.name;
            itemDiv.innerHTML = `<span class="tree-icon">${isImage ? '🖼️' : '📄'}</span>${entry.name}`;

            itemDiv.onclick = async (e) => {
                e.stopPropagation();
                if (!(await promptUnsavedChanges())) return;
                document.querySelectorAll('.file-tree .tree-item').forEach(el => el.classList.remove('active'));
                itemDiv.classList.add('active');
                if (isImage) {
                    await openImageFromHandle(entry);
                } else {
                    await openFileFromHandle(entry);
                }
            };
            li.appendChild(itemDiv);
        }
        containerUl.appendChild(li);
    }
}

async function openImageFromHandle(fileHandle) {
    try {
        currentFileHandle = fileHandle;
        await updateCurrentFileRelativePath(fileHandle);
        const file = await fileHandle.getFile();
        if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
        currentObjectURL = URL.createObjectURL(file);

        isViewingImage = true;
        markdownInput.value = '';
        markdownInput.disabled = true;

        previewOutput.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; padding: 20px; background: var(--code-bg); border-radius: 8px;">
                <img src="${currentObjectURL}" style="max-width: 100%; max-height: 100%; object-fit: contain; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" alt="${file.name}">
            </div>
        `;
        updateViewMode('preview');
        updatePreviewPath();
        syncSidebar(fileHandle);
        undoStack = [];
        redoStack = [];
        updateHistoryButtons();
        isFileModified = false;
        currentFilenameDisplay.textContent = file.name;
        document.title = `${file.name} - Premium Markdown Editor`;
    } catch (err) {
        console.error('Image open error:', err);
        alert(`画像の読み込みに失敗しました。\n詳細: ${err.message}`);
    }
}

// --- 表示モード切り替えロジック ---
function updateViewMode(mode) {
    // ボタンのアクティブ状態リセット
    [btnViewEditor, btnViewSplit, btnViewPreview].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    // モード切り替え
    tabEditPane.classList.remove('view-editor-only', 'view-preview-only');

    if (mode === 'editor') {
        tabEditPane.classList.add('view-editor-only');
        if (btnViewEditor) btnViewEditor.classList.add('active');
    } else if (mode === 'preview') {
        tabEditPane.classList.add('view-preview-only');
        if (btnViewPreview) btnViewPreview.classList.add('active');
    } else {
        // split (default)
        if (btnViewSplit) btnViewSplit.classList.add('active');
    }
}

/**
 * フォルダ内の相対パスを再帰的に探し、Blob URLを返します。
 */
async function resolveLocalPath(path) {
    if (!currentDirectoryHandle || path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
    }
    try {
        // パスをデコードして正規化
        const decodedPath = decodeURIComponent(path).replace(/\\/g, '/');
        const parts = decodedPath.split('/').filter(p => p && p !== '.');

        // 編集中のファイルがあるディレクトリを起点にする
        let handle = currentDirectoryHandle;

        // まず現在のファイルまでの階層を辿る
        const baseParts = [...currentFileRelativePath];

        // 相対パスの解釈
        const targetParts = [...baseParts];
        for (const part of parts) {
            if (part === '..') {
                if (targetParts.length > 0) targetParts.pop();
            } else {
                targetParts.push(part);
            }
        }

        // ターゲットを特定
        for (let i = 0; i < targetParts.length; i++) {
            const part = targetParts[i];
            if (i === targetParts.length - 1) {
                const fileHandle = await handle.getFileHandle(part);
                const file = await fileHandle.getFile();
                const url = URL.createObjectURL(file);
                previewObjectURLs.push(url);
                return url;
            } else {
                handle = await handle.getDirectoryHandle(part);
            }
        }
    } catch (e) {
        // 見つからなければ透明な画像を返す（404エラー防止）
        console.debug("Resolve local path failed for:", path, e);
        return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }
    return path;
}

/**
 * フォルダ内の相対パスを辿り、ファイルハンドルを返します。
 */
async function findFileHandle(path) {
    if (!currentDirectoryHandle) return null;
    try {
        const decodedPath = decodeURIComponent(path).replace(/\\/g, '/');
        const parts = decodedPath.split('/').filter(p => p && p !== '.');
        let handle = currentDirectoryHandle;
        const targetParts = [...currentFileRelativePath];
        for (const part of parts) {
            if (part === '..') {
                if (targetParts.length > 0) targetParts.pop();
            } else {
                targetParts.push(part);
            }
        }
        for (let i = 0; i < targetParts.length; i++) {
            const part = targetParts[i];
            if (i === targetParts.length - 1) {
                return await handle.getFileHandle(part);
            } else {
                handle = await handle.getDirectoryHandle(part);
            }
        }
    } catch (e) {
        console.debug("Find file handle failed for:", path, e);
    }
    return null;
}

// --- ペインのリサイズ（ドラッグ）ロジック ---

function initResizer() {
    // --- エディタ・プレビュー間のリサイズ ---
    const savedWidth = localStorage.getItem('md-editor-pane-width');
    if (savedWidth) {
        editorPane.style.width = savedWidth;
    }

    paneResizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizeStartX = e.clientX;
        resizeStartWidth = editorPane.offsetWidth;
        document.body.classList.add('resizing');
        paneResizer.classList.add('active');
        dragOverlay.style.display = 'block';
        e.preventDefault();
    });

    // --- エクスプローラーのリサイズ ---
    let isExplorerResizing = false;
    let explorerStartX = 0;
    let explorerStartWidth = 0;

    if (explorerResizer) {
        explorerResizer.addEventListener('mousedown', (e) => {
            isExplorerResizing = true;
            explorerStartX = e.clientX;
            explorerStartWidth = fileExplorer.offsetWidth;
            document.body.classList.add('resizing');
            explorerResizer.classList.add('active');
            dragOverlay.style.display = 'block';
            e.preventDefault();
        });
    }

    document.addEventListener('mousemove', (e) => {
        // エディタ分割のリサイズ
        if (isResizing) {
            e.preventDefault();
            const deltaX = e.clientX - resizeStartX;
            const newWidthPx = resizeStartWidth + deltaX;
            const containerWidth = document.querySelector('#tab-edit').offsetWidth;
            let newWidthPercent = (newWidthPx / containerWidth) * 100;
            if (newWidthPercent > 10 && newWidthPercent < 90) {
                const widthStr = `${newWidthPercent}%`;
                editorPane.style.width = widthStr;
                localStorage.setItem('md-editor-pane-width', widthStr);
            }
        }
        // エクスプローラーのリサイズ
        if (isExplorerResizing) {
            e.preventDefault();
            const deltaX = e.clientX - explorerStartX;
            const newWidth = explorerStartWidth + deltaX;
            if (newWidth > 100 && newWidth < 600) {
                fileExplorer.style.width = `${newWidth}px`;
            }
        }
    });

    const stopResize = () => {
        if (isResizing || isExplorerResizing) {
            isResizing = false;
            isExplorerResizing = false;
            document.body.classList.remove('resizing');
            paneResizer.classList.remove('active');
            if (explorerResizer) explorerResizer.classList.remove('active');
            dragOverlay.style.display = 'none';
        }
    };

    document.addEventListener('mouseup', stopResize);
    dragOverlay.addEventListener('mouseup', stopResize);
}

initResizer();

// 差分計算用の比較データ
let diffBefore = "";
let diffAfter = "";

// --- 履歴管理（Undo/Redo） ---
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 50;

/**
 * 現在の状態を履歴スタックに保存します。
 */
function saveHistory() {
    const currentContent = markdownInput.value;
    // 直前の状態と同じなら保存しない
    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === currentContent) return;
    undoStack.push(currentContent);
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = []; // 新しい操作が行われたらRedoスタックをクリア
    updateHistoryButtons();
}

/**
 * 元に戻す（Undo）操作を実行します。
 */
async function undo() {
    if (undoStack.length <= 1) return;
    const currentState = undoStack.pop();
    redoStack.push(currentState);
    const prevState = undoStack[undoStack.length - 1];
    markdownInput.value = prevState;
    await renderMarkdown(false); // 履歴には記録しない
    updateHistoryButtons();
}

/**
 * やり直し（Redo）操作を実行します。
 */
async function redo() {
    if (redoStack.length === 0) return;
    const nextState = redoStack.pop();
    undoStack.push(nextState);
    markdownInput.value = nextState;
    await renderMarkdown(false); // 履歴には記録しない
    updateHistoryButtons();
}

/**
 * Undo/Redoボタンの有効/無効状態を更新します。
 */
function updateHistoryButtons() {
    btnUndo.disabled = undoStack.length <= 1;
    btnRedo.disabled = redoStack.length === 0;
}

// --- marked.js レンダラー設定 ---
// Markdownの特定の要素（リスト、テーブル、引用、コード）のHTML出力をカスタマイズします。
marked.setOptions({
    breaks: true, // 改行を<br>に変換（StackEdit/GitHubスタイル）
    gfm: true
});

marked.use({
    renderer: {
        // タスクリストを含むリスト項目のカスタマイズ
        listitem(item) {
            const task = item.task;
            const checked = item.checked;
            // item.text をパースした結果、単一の <p> で囲まれている場合は
            // チェックボックスとの間に改行が入らないよう <p> を除去します。
            let content = marked.parse(item.text).trim();
            if (content.startsWith('<p>') && content.endsWith('</p>')) {
                // 内部にさらにブロック要素がないか簡易チェック
                const inner = content.substring(3, content.length - 4);
                if (!inner.includes('<p>') && !inner.includes('<ul') && !inner.includes('<ol')) {
                    content = inner;
                }
            }

            if (task) {
                return `<li class="task-list-item"><input type="checkbox" ${checked ? 'checked' : ''}> ${content}</li>\n`;
            }
            return `<li>${content}</li>\n`;
        },

        // テーブルセルのカスタマイズ（プレビュー上での配置情報を保持）
        tablecell(item) {
            const content = marked.parseInline(item.text);
            const tag = item.header ? 'th' : 'td';
            const align = item.align ? ` style="text-align: ${item.align}"` : '';
            return `<${tag}${align}>${content}</${tag}>`;
        },

        // 引用（blockquote）を利用したGitHubスタイルアラートの処理
        blockquote(item) {
            const text = item.text.trim();
            const alertMatch = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n?([\s\S]*)$/i);

            if (alertMatch) {
                const type = alertMatch[1].toUpperCase();
                const content = marked.parse(alertMatch[2].trim());
                const icon = {
                    NOTE: 'ℹ️',
                    TIP: '💡',
                    IMPORTANT: '📢',
                    WARNING: '⚠️',
                    CAUTION: '🚫'
                }[type];

                return `<blockquote class="alert alert-${type.toLowerCase()}">
                    <div class="alert-title">${icon} ${type}</div>
                    <div class="alert-content">${content}</div>
                </blockquote>`;
            }
            return `<blockquote>${marked.parse(item.text)}</blockquote>`;
        },

        // コードブロックの拡張（Mermaid / PlantUML への対応）
        code(item) {
            const lang = (item.lang || '').trim().toLowerCase();
            const text = item.text || '';

            if (lang === 'mermaid') {
                return `<div class="mermaid">${text}</div>\n`;
            }

            if (lang === 'plantuml' || lang === 'puml') {
                try {
                    if (window.plantumlEncoder) {
                        const encoded = plantumlEncoder.encode(text);
                        return `<div class="plantuml-container"><img class="plantuml-diagram" src="https://www.plantuml.com/plantuml/svg/${encoded}" alt="PlantUML Diagram" /></div>\n`;
                    }
                } catch (e) {
                    console.error('PlantUML rendering error:', e);
                }
            }

            // それ以外の言語はデフォルトのレンダリングに任せる
            return false;
        },

        // 画像のレンダリングをカスタマイズ（404エラー防止のため data-src を使用）
        image(item) {
            const src = item.href || '';
            const alt = item.text || '';
            const title = item.title ? ` title="${item.title}"` : '';
            // 最初は src を空（またはダミー）にし、data-src にパスを保持させます
            return `<img data-src="${src}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="${alt}"${title}>`;
        }
    }
});

// --- 数式サポート (KaTeX) ---

/**
 * テキスト内の数式（$...$ および $$...$$）をプレースホルダーに置き換え、
 * 同時にレンダリングされたHTMLを保持するマップを作成します。
 */
function protectMath(text) {
    const mathMap = [];
    let processedText = text;

    // ブロック数式: $$ ... $$
    processedText = processedText.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
        try {
            const rendered = katex.renderToString(formula, { displayMode: true, throwOnError: false });
            const placeholder = `@@MATH_BLOCK_${mathMap.length}@@`;
            mathMap.push({
                placeholder: placeholder,
                html: `<div class="katex-formula katex-display" data-formula="$$${formula.replace(/"/g, '&quot;')}$$">${rendered}</div>`
            });
            return placeholder;
        } catch (e) {
            return match;
        }
    });

    // インライン数式: $ ... $
    // $ の直後に数字がある場合などは数式と見なさないよう、少し厳密な正規表現を使用
    processedText = processedText.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
        try {
            const rendered = katex.renderToString(formula, { displayMode: false, throwOnError: false });
            const placeholder = `@@MATH_INLINE_${mathMap.length}@@`;
            mathMap.push({
                placeholder: placeholder,
                html: `<span class="katex-formula" data-formula="$${formula.replace(/"/g, '&quot;')}$">${rendered}</span>`
            });
            return placeholder;
        } catch (e) {
            return match;
        }
    });

    return { text: processedText, mathMap };
}

/**
 * プレースホルダーをレンダリング済みの数式HTMLに戻します。
 */
function restoreMath(html, mathMap) {
    let finalHtml = html;
    mathMap.forEach(item => {
        // String.replace の第2引数に文字列を渡すと $ が特殊文字として解釈されるため、
        // 関数を渡して安全に置換するようにします。
        finalHtml = finalHtml.replace(item.placeholder, () => item.html);
    });
    return finalHtml;
}

// 初期表示用のリッチなサンプルテキスト
const defaultText = `# 🚀 Premium Markdown Editor: 全機能ショーケース

このエディタは、あらゆるMarkdown記法とインタラクティブ機能を統合した次世代の執筆ツールです。

---

## 💎 1. テキスト装飾（インライン要素）

### 基本的な強調
- **太字 (Bold)** : \`**太字**\` または \`__太字__\`
- *斜体 (Italic)* : \`*斜体*\` または \`_斜体_\`
- ***太字かつ斜体*** : \`***強調***\`
- ~~打ち消し線~~ : \`~~取り消し~~\`
- <u>下線 (Underline)</u> : \`<u>下線</u>\`
- <span style="color: #ff4757; font-weight: bold;">文字色の指定</span> : HTMLタグで自由自在。
- <mark>ハイライト</mark> : \`<mark>タグ\`

### インラインコード
プログラミングの語句などは \`const editor = new PremiumEditor()\` のように表現。

---

## 📊 2. インタラクティブ・テーブル

プレビュー上の表を**直接クリック**して編集でき、その結果はソースに**同期**されます。

| カテゴリ | 機能詳細 | 進捗 |
| :--- | :--- | :--- |
| 装飾 | *イタリック* も **ボールド** もOK | 100% |
| **構造** | 行・列の動的な追加・削除 | 100% |
| **改行** | セル内で \`Enter\` による改行可能 | 100% |
| **数式** | $ \\sqrt{a^2 + b^2} = c $ | 100% |
| **情報** | [!TIP] アラート機能 | 100% |

> [!TIP]
> プレビュー側の表を**右クリック**してメニューを開き、行や列を追加してみてください！

---

## ⚠️ 3. アラート (GitHub スタイル)

> [!NOTE]
> 重要な背景情報を伝えるノートです。

> [!IMPORTANT]
> ユーザーが見逃してはいけない重要な指示です。

> [!WARNING]
> 注意が必要な操作やリスクについての警告です。

---

## 🧮 4. 高度な数学 (KaTeX)

数学や物理の概念を、LaTeX記法で美しくレンダリングします。

**ブロック数式:**
$$ \\int_{a}^{b} f(x) \\,dx = F(b) - F(a) $$

---

## 🛠️ 5. その他の機能

### 折りたたみ (Details)
<details>
<summary>ここをクリックして詳細を展開</summary>

折りたたみの中身もリッチに表現可能です。
1. リスト項目
2. 画像を表示したり
3. [リンク](https://google.com)を貼ったり

</details>

### タスクリスト
- [x] インタラクティブなチェックボックス
- [x] Undo/Redo 機能
- [ ] 独自テーマの作成

### コードブロック
\`\`\`javascript
function welcome() {
    console.log("Welcome to the Premium Markdown Editor!");
}
\`\`\`

### 画像の埋め込み
![Sample Image](https://picsum.photos/600/300)

---

## 📝 6. テキスト差分（新機能！）

上部のタブから「テキスト差分」画面に切り替えられます。
1. 編集画面の「**変更前に反映**」ボタンを押して、現在の状態を比較元にセット。
2. テキストを書き換える。
3. 「**変更後に反映**」ボタンを押して、比較先にセット。
4. タブを切り替えて差分（赤と緑）を確認！

---

## 🎨 7. ダイアグラム描画（新機能！）

### Mermaid.js
\`\`\`mermaid
sequenceDiagram
    participant User
    participant Editor
    participant CSS
    User->>Editor: Edit Markdown
    Editor->>CSS: Apply Theme
    CSS-->>Editor: Beautiful Result
    Editor-->>User: Visual Feedback
\`\`\`

### PlantUML
\`\`\`plantuml
@startuml
skinparam handwritten true
actor User
participant "Premium MD Editor" as Editor
User -> Editor: Type UML
Editor -> Editor: Encode base64
Editor -> PlantUML_API: Request SVG
PlantUML_API --> Editor: Return SVG
Editor --> User: Display Diagram
@enduml
\`\`\`
`;

markdownInput.value = defaultText;
undoStack.push(defaultText);
updateHistoryButtons();

// --- レンダリング処理 ---

/**
 * MarkdownテキストをHTMLに変換してプレビュー領域を更新します。
 * @param {boolean} recordHistory 履歴に保存するかどうか
 * @param {boolean} shouldSkipRender レンダリング処理自体をスキップするか（同期のみの場合など）
 */
async function renderMarkdown(recordHistory = true, shouldSkipRender = false) {
    if (!shouldSkipRender) {
        let rawValue = markdownInput.value;

        // 1. 数式を保護（プレースホルダーに置換）
        const { text: protectedText, mathMap } = protectMath(rawValue);

        // 2. MarkdownをHTMLにパース
        let htmlResult = marked.parse(protectedText);

        // 3. 数式を復元
        htmlResult = restoreMath(htmlResult, mathMap);

        // --- ローカル画像パスの解決 ---
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlResult;
        const imgs = tempDiv.querySelectorAll('img');

        if (currentDirectoryHandle) {
            clearPreviewObjectURLs();
            for (const img of imgs) {
                // data-src からパスを取得して解決を試みる
                const src = img.getAttribute('data-src');
                if (src) {
                    const resolved = await resolveLocalPath(src);
                    img.src = resolved;
                    // data-src は不要になるので削除（CSSセレクタ用などで残しても良いがここでは削除）
                    img.removeAttribute('data-src');
                }
            }
        } else {
            // フォルダが開かれていない場合でも、data-src を src に戻す（通常のURLなどのため）
            for (const img of imgs) {
                const src = img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                }
            }
        }
        htmlResult = tempDiv.innerHTML;

        previewOutput.innerHTML = htmlResult;
        applyInteractiveFeatures();
        updateTOC(); // 目次を更新

        // Mermaid ダイアグラムの描画
        try {
            if (window.mermaid) {
                const isLight = document.body.classList.contains('light-mode');
                mermaid.initialize({ startOnLoad: false, theme: isLight ? 'default' : 'dark' });
                await mermaid.run({ querySelector: '.mermaid' });
            }
        } catch (e) {
            console.error("Mermaid init error:", e);
        }
    }
    if (recordHistory) {
        saveHistory();
    }
    syncStatus.innerText = 'Synced';
}

/**
 * プレビュー内の見出しを走査して目次を生成します。
 */
function updateTOC() {
    const headings = previewOutput.querySelectorAll('h1, h2, h3');
    if (headings.length === 0) {
        tocContent.innerHTML = '<div style="color: var(--text-secondary); opacity: 0.5;">No headings</div>';
        return;
    }

    const tocList = document.createElement('ul');
    headings.forEach((heading, index) => {
        // 見出しにIDがない場合は付与する（スクロール用）
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }

        const li = document.createElement('li');
        li.className = `toc-${heading.tagName.toLowerCase()}`;

        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.textContent = heading.innerText.replace(/#+/, '').trim(); // 行頭の#などを除去

        a.onclick = (e) => {
            e.preventDefault();
            // scrollIntoView がページ全体を動かさないよう、コンテナ内で完結させるか、
            // ターゲット要素を特定してコンテナのscrollTopを直接操作する手法を採ります。
            const targetTop = heading.offsetTop;
            previewOutput.scrollTo({
                top: targetTop,
                behavior: 'smooth'
            });
        };

        li.appendChild(a);
        tocList.appendChild(li);
    });

    tocContent.innerHTML = '';
    tocContent.appendChild(tocList);
}

/**
 * プレビュー画面上の要素にインタラクティブな機能（テーブル編集、チェックボックス等）を適用します。
 */
function applyInteractiveFeatures() {
    const cells = previewOutput.querySelectorAll('td, th');
    cells.forEach(cell => {
        // 全てのセル（TH, TDの両方）を編集可能にする
        cell.contentEditable = 'true';

        // 入力時の同期処理
        cell.addEventListener('input', () => {
            syncStatus.innerText = 'Updating...';
            isUpdatingFromPreview = true;
            updateSourceFromPreview(true); // ソースに同期するが再レンダリングは抑制
            isUpdatingFromPreview = false;
        });

        // キー操作のハンドル（改行処理など）
        cell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // 改行タグを挿入
                // 文末に改行を入れる場合、ブラウザが描画するために2つの<br>が必要になる場合がある
                // または、末尾の<br>の後ろにカーソルを置けるように制御する
                document.execCommand('insertHTML', false, '<br><br>');
                // 明示的にインプットイベントを発生させてソースに即時同期
                cell.dispatchEvent(new Event('input'));

                // 2つ入れた<br>のうち1つ分戻る（または末尾の隠しBRとして機能させる）
                // ただし execCommand は古い技術なため、より確実な方法として
                // 末尾の空行をブラウザが認識できるようにします。
            }
        });

        // 右クリックメニュー（テーブル操作）
        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            currentTargetCell = cell;
            showContextMenu(e.pageX, e.pageY);
        });

        // フォーカスが外れた際の最終レンダリング（装飾の整形など）
        cell.addEventListener('blur', () => {
            setTimeout(async () => {
                // メニュー操作中などでなければ、入力を確定させて再レンダリング
                if (contextMenu.style.display === 'none') {
                    await renderMarkdown(true, false);
                }
            }, 200);
        });
    });

    // タスクリストのチェックボックス
    const checkboxes = previewOutput.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb, index) => {
        cb.disabled = false;
        cb.addEventListener('change', () => {
            handleCheckboxToggle(index, cb.checked);
        });
    });

    // プレビュー内のリンク制御（相対パスのMDファイルならエディタで開く）
    const links = previewOutput.querySelectorAll('a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        // 相対パスのMDファイル (.md, .markdown) かどうか判定
        const isRelativeMd = href &&
            !href.startsWith('http') &&
            !href.startsWith('//') &&
            !href.startsWith('#') &&
            (href.endsWith('.md') || href.indexOf('.md#') !== -1 || href.endsWith('.markdown'));

        if (isRelativeMd) {
            // ブラウザの遷移を防止
            link.removeAttribute('target');
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // アンカー（#）を除去してファイルパスのみ抽出
                const filePath = href.split('#')[0];
                const fileHandle = await findFileHandle(filePath);

                if (fileHandle) {
                    if (await promptUnsavedChanges()) {
                        await openFileFromHandle(fileHandle);
                    }
                } else {
                    console.warn("Target file not found for relative link:", filePath);
                    alert(`ファイルが見つかりません: ${filePath}`);
                }
            });
        }
    });
}

/**
 * プレビューヘッダーのパス表示を更新します。
 */
function updatePreviewPath() {
    if (!previewPath) return;
    if (currentDirectoryHandle) {
        const rootName = currentDirectoryHandle.name;
        const pathStr = currentFileRelativePath.length > 0
            ? `[${rootName}] / ${currentFileRelativePath.join(' / ')} / ${currentFileHandle?.name || ''}`
            : `[${rootName}] / ${currentFileHandle?.name || ''}`;
        previewPath.textContent = pathStr;
    } else {
        previewPath.textContent = currentFileHandle?.name || '';
    }
}

/**
 * サイドバーの状態を現在のファイルに同期させます。
 */
async function syncSidebar(fileHandle) {
    if (!currentDirectoryHandle || !fileHandle) return;
    try {
        const relativePath = await currentDirectoryHandle.resolve(fileHandle);
        if (!relativePath) return;

        let currentUl = fileTree;
        // 階層を順に展開
        for (let i = 0; i < relativePath.length; i++) {
            const name = relativePath[i];
            const isLast = i === relativePath.length - 1;

            const items = currentUl.querySelectorAll(':scope > li > .tree-item');
            let targetItem = null;
            for (const item of items) {
                if (item.dataset.name === name) {
                    targetItem = item;
                    break;
                }
            }

            if (targetItem) {
                if (isLast) {
                    // ファイルをハイライト
                    document.querySelectorAll('.file-tree .tree-item').forEach(el => el.classList.remove('active'));
                    targetItem.classList.add('active');
                    targetItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                } else {
                    // フォルダを展開
                    const childrenUl = targetItem.nextElementSibling;
                    if (childrenUl && childrenUl.tagName === 'UL') {
                        if (!childrenUl.classList.contains('expanded')) {
                            targetItem.click();

                            // ロード完了を待つ（Loading... が消えるまで）
                            let retries = 0;
                            while ((childrenUl.innerHTML === '' || childrenUl.innerHTML.includes('Loading...')) && retries < 30) {
                                await new Promise(r => setTimeout(r, 50));
                                retries++;
                            }
                        }
                        currentUl = childrenUl;
                    }
                }
            } else {
                // 見つからない場合は展開を諦める
                break;
            }
        }
    } catch (e) {
        console.warn("Sidebar sync failed:", e);
    }
}

// --- タスクリスト（チェックボックス）ロジック ---

/**
 * タスクリストのチェック状態をソースMarkdownに反映します。
 * @param {number} index 何番目のチェックボックスか
 * @param {boolean} isChecked チェックされたかどうか
 */
async function handleCheckboxToggle(index, isChecked) {
    const lines = markdownInput.value.split('\n');
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^\s*[-*+]\s+\[[\sxX]\]/)) {
            if (count === index) {
                lines[i] = lines[i].replace(/\[[\sxX]\]/, isChecked ? '[x]' : '[ ]');
                break;
            }
            count++;
        }
    }
    markdownInput.value = lines.join('\n');
    await renderMarkdown();
}

// --- テーブル操作（コンテキストメニュー）ロジック ---

function showContextMenu(x, y) {
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
}
function hideContextMenu() {
    contextMenu.style.display = 'none';
}
document.addEventListener('click', () => hideContextMenu());

// ツールバーボタンのクリックイベント
btnUndo.onclick = () => undo();
btnRedo.onclick = () => redo();
btnRefresh.onclick = async () => await renderMarkdown(true, false);
btnCopy.onclick = () => {
    markdownInput.select();
    document.execCommand('copy');
    syncStatus.innerText = "Copied to Clipboard!";
    setTimeout(() => syncStatus.innerText = "Synced", 2000);
};

// 差分計算用アクション
btnSetBefore.onclick = () => {
    diffBefore = markdownInput.value;
    syncStatus.innerText = "Before State Set";
    setTimeout(() => syncStatus.innerText = "Synced", 2000);
};
btnSetAfter.onclick = () => {
    diffAfter = markdownInput.value;
    syncStatus.innerText = "After State Set";
    setTimeout(() => syncStatus.innerText = "Synced", 2000);
};

// メニュー項目のクリックイベント
document.getElementById('menu-add-row-above').onclick = () => addRow('above');
document.getElementById('menu-add-row-below').onclick = () => addRow('below');
document.getElementById('menu-delete-row').onclick = () => deleteRow();
document.getElementById('menu-add-col-left').onclick = () => addColumn('left');
document.getElementById('menu-add-col-right').onclick = () => addColumn('right');
document.getElementById('menu-delete-col').onclick = () => deleteColumn();

/**
 * 指定した位置に新しい行を追加します。
 */
function addRow(position) {
    if (!currentTargetCell) return;
    const row = currentTargetCell.parentElement;
    const tableContainer = row.closest('table');
    const tableBody = tableContainer.querySelector('tbody') || tableContainer;

    const newRow = document.createElement('tr');
    const colCount = row.children.length;
    for (let i = 0; i < colCount; i++) {
        const td = document.createElement('td');
        td.innerText = 'New';
        newRow.appendChild(td);
    }

    if (position === 'above') {
        row.parentElement.insertBefore(newRow, row);
    } else {
        row.parentElement.insertBefore(newRow, row.nextSibling);
    }
    updateSourceFromPreview();
}

/**
 * 現在の行を削除します。
 */
function deleteRow() {
    if (!currentTargetCell) return;
    const row = currentTargetCell.parentElement;
    row.remove();
    updateSourceFromPreview();
}

/**
 * 指定した位置に新しい列を追加します。
 */
function addColumn(position) {
    if (!currentTargetCell) return;
    const table = currentTargetCell.closest('table');
    const rows = Array.from(table.querySelectorAll('tr'));
    const colIndex = Array.from(currentTargetCell.parentElement.children).indexOf(currentTargetCell);
    const insertIndex = position === 'left' ? colIndex : colIndex + 1;

    rows.forEach(row => {
        const isHeaderRow = row.parentElement.tagName === 'THEAD';
        const tag = isHeaderRow ? 'th' : 'td';
        const newCell = document.createElement(tag);
        newCell.innerText = 'New';
        row.insertBefore(newCell, row.children[insertIndex]);
    });
    updateSourceFromPreview();
}

/**
 * 現在の列を削除します。
 */
function deleteColumn() {
    if (!currentTargetCell) return;
    const table = currentTargetCell.closest('table');
    const rows = Array.from(table.querySelectorAll('tr'));
    const colIndex = Array.from(currentTargetCell.parentElement.children).indexOf(currentTargetCell);
    rows.forEach(row => {
        if (row.children[colIndex]) row.children[colIndex].remove();
    });
    updateSourceFromPreview();
}

// --- ソース同期（プレビュー -> Markdown） ---

/**
 * プレビュー上のテーブルの内容を読み取り、Markdownソースを更新します。
 * 数式や強調記法の復元もここで行います。
 */
async function updateSourceFromPreview(shouldSkipRender = false) {
    const currentMarkdown = markdownInput.value;
    const tables = Array.from(previewOutput.querySelectorAll('table'));

    const tableMarkdowns = tables.map(table => {
        const rows = Array.from(table.querySelectorAll('tr'));
        const mdRows = rows.map(row => {
            const cells = Array.from(row.children);
            return '| ' + cells.map(c => {
                let tempDiv = document.createElement('div');
                const inner = c.innerHTML;

                // 空行（<br>のみなど）を適切に保つための処理
                // 改行直後の入力不具合を避けるため、内容が空に近い場合はゼロ幅スペース等を一時的に検討
                tempDiv.innerHTML = inner.replace(/^<br\s*\/?>$/i, '');

                // 数式の復元（data-formula属性から）
                const mathElements = tempDiv.querySelectorAll('.katex-formula');
                mathElements.forEach(el => {
                    const formula = el.getAttribute('data-formula');
                    el.replaceWith(document.createTextNode(formula));
                });

                // HTML要素をMarkdown記法に変換
                let content = tempDiv.innerHTML
                    .replace(/&nbsp;/g, ' ')
                    .replace(/<br\s*\/?>/gi, '<br>') // セル内改行
                    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
                    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
                    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
                    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
                    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
                    .replace(/<del>(.*?)<\/del>/gi, '~~$1~~')
                    .replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
                    .replace(/\u200B/g, '') // ゼロ幅スペースの除去
                    .replace(/\|/g, '\\|') // パイプ文字のエスケープ
                    .trim();

                return content || ' '; // 空セルはスペース一個にする
            }).join(' | ') + ' |';
        });

        // 区切り行（---）の生成と配置の復元
        if (mdRows.length > 0) {
            const firstRowCells = Array.from(rows[0].children);
            const seps = '| ' + firstRowCells.map(c => {
                const align = c.style.textAlign || getComputedStyle(c).textAlign;
                if (align === 'center') return ':---:';
                if (align === 'right') return '---:';
                return ':---';
            }).join(' | ') + ' |';
            mdRows.splice(1, 0, seps);
        }
        return mdRows.join('\n');
    });

    // 既存のMarkdown内のテーブル部分を置換
    let sourceLines = currentMarkdown.split('\n');
    let tableIndex = 0;
    let resultLines = [];
    let inTable = false;

    for (let i = 0; i < sourceLines.length; i++) {
        const isTableRow = sourceLines[i].trim().startsWith('|');
        if (isTableRow && !inTable) {
            inTable = true;
            if (tableMarkdowns[tableIndex]) {
                resultLines.push(tableMarkdowns[tableIndex]);
                tableIndex++;
            }
        } else if (!isTableRow && inTable) {
            inTable = false;
        }
        if (!inTable) {
            resultLines.push(sourceLines[i]);
        }
    }

    const newVal = resultLines.join('\n');
    if (markdownInput.value !== newVal) {
        markdownInput.value = newVal;
        updateLineNumbers();
    }
    if (!shouldSkipRender) await renderMarkdown();
}

// --- タブシステム ---
const tabItems = document.querySelectorAll('.tab-item');
const tabContents = document.querySelectorAll('.tab-content');

tabItems.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');

        tabItems.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(`tab-${target}`).classList.add('active');

        // 差分タブに切り替わったときに表示を更新
        if (target === 'diff') {
            updateDiffView();
        }
    });
});

/**
 * 変更前との差分を計算し、GitHubスタイルの構造化テーブルとして表示します。
 */
function updateDiffView() {
    const diff = Diff.diffLines(diffBefore, diffAfter);
    diffOutput.innerHTML = "";

    const table = document.createElement('div');
    table.className = 'diff-table';

    let oldLine = 1;
    let newLine = 1;

    diff.forEach((part) => {
        // 各行を分割（末尾の改行による空文字を防ぐ）
        const actualLines = part.value.endsWith('\n') ?
            part.value.split('\n').slice(0, -1) :
            part.value.split('\n');

        actualLines.forEach((line) => {
            const tr = document.createElement('div');
            tr.className = 'diff-tr';
            if (part.added) tr.classList.add('diff-line-added');
            if (part.removed) tr.classList.add('diff-line-removed');

            // 変更前の行番号
            const tdOld = document.createElement('div');
            tdOld.className = 'diff-td diff-num';
            tdOld.textContent = part.added ? "" : oldLine++;

            // 変更後の行番号
            const tdNew = document.createElement('div');
            tdNew.className = 'diff-td diff-num';
            tdNew.textContent = part.removed ? "" : newLine++;

            // インジケータ (+ / - / 空白)
            const tdInd = document.createElement('div');
            tdInd.className = 'diff-td diff-indicator';
            tdInd.textContent = part.added ? "+" : part.removed ? "-" : " ";

            // コンテンツ本体
            const tdContent = document.createElement('div');
            tdContent.className = 'diff-td diff-content';
            tdContent.textContent = line || " ";

            tr.appendChild(tdOld);
            tr.appendChild(tdNew);
            tr.appendChild(tdInd);
            tr.appendChild(tdContent);
            table.appendChild(tr);
        });
    });

    const container = document.createElement('div');
    container.className = 'diff-body';
    container.appendChild(table);
    diffOutput.appendChild(container);
}

// --- エディタ・イベント ---

/**
 * エディタへの入力（タイピング）を検出し、デバウンス処理を挟んでレンダリングを実行します。
 */
markdownInput.addEventListener('input', () => {
    if (isUpdatingFromPreview) return;
    syncStatus.innerText = 'Typing...';
    updateLineNumbers();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        await renderMarkdown();
    }, 600);
});

// グローバルなショートカットキー (Undo/Redo)
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
            e.preventDefault();
            undo();
        } else if (e.key === 'y') {
            e.preventDefault();
            redo();
        }
    }
});

// --- 初期化 ---
(async () => {
    // ファイル操作ボタンのイベントリスナー
    if (btnOpenFolder) btnOpenFolder.addEventListener('click', openFolder);
    if (btnOpen) btnOpen.addEventListener('click', openFile);
    if (btnSave) btnSave.addEventListener('click', saveFile);
    if (btnSaveAs) btnSaveAs.addEventListener('click', saveFileAs);

    if (btnCloseFolder) btnCloseFolder.addEventListener('click', () => {
        fileExplorer.classList.add('hidden');
        // btnToggleSidebar.classList.add('hidden'); // ヘッダーのボタンは消さない
        // currentDirectoryHandle = null; // フォルダ機能自体は維持する
        // fileTree.innerHTML = '';
    });

    if (btnToggleSidebar) btnToggleSidebar.addEventListener('click', () => {
        fileExplorer.classList.toggle('hidden');
    });

    // 表示モード切り替え
    if (btnViewEditor) btnViewEditor.addEventListener('click', () => updateViewMode('editor'));
    if (btnViewSplit) btnViewSplit.addEventListener('click', () => updateViewMode('split'));
    if (btnViewPreview) btnViewPreview.addEventListener('click', () => updateViewMode('preview'));

    // 初期レンダリング
    await renderMarkdown(false);
    updateLineNumbers();
    updateViewMode('split'); // 初期表示モードをセット
    undoStack = [defaultText]; // 履歴スタックを初期状態でリセット
    updateHistoryButtons();
})();
