#include <windows.h>
#include <commctrl.h>
#include <stdio.h>
#include <shlwapi.h>

#pragma comment(lib, "user32.lib")
#pragma comment(lib, "gdi32.lib")
#pragma comment(lib, "shlwapi.lib")

#define IDC_ESCAPE 101

HWND g_hEdit;
HFONT g_hFont = NULL;
int g_fontSize = 22;
BYTE g_alpha = 255;
BOOL g_topMost = FALSE;
BOOL g_darkMode = FALSE;
BOOL g_skip_save = FALSE;
WCHAR g_exeDir[MAX_PATH];

// フォントを更新
void UpdateFont() {
    if (g_hFont) DeleteObject(g_hFont);
    g_hFont = CreateFontW(g_fontSize, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
                         DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
                         DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Consolas");
    SendMessageW(g_hEdit, WM_SETFONT, (WPARAM)g_hFont, TRUE);
}

// 透過率を更新
void UpdateTransparency(HWND hwnd) {
    SetLayeredWindowAttributes(hwnd, 0, g_alpha, LWA_ALPHA);
}

// 自動保存処理
void AutoSave() {
    if (g_skip_save) return;
    int lenW = GetWindowTextLengthW(g_hEdit);
    
    if (lenW <= 0) return;

    WCHAR* bufW = (WCHAR*)GlobalAlloc(GPTR, (lenW + 1) * sizeof(WCHAR));
    if (!bufW) return;

    GetWindowTextW(g_hEdit, bufW, lenW + 1);

    // 先頭5文字を取得しサニタイズ
    WCHAR prefix[6] = {0};
    int pLen = 0;
    for (int i = 0; bufW[i] != L'\0' && pLen < 5; i++) {
        WCHAR c = bufW[i];
        if (c == L'\r' || c == L'\n' || c == L'\t') continue; // 改行などは飛ばす
        // ファイル名禁止文字を置換
        if (wcschr(L"\\/:*?\"<>|", c)) c = L'_';
        prefix[pLen++] = c;
    }
    prefix[pLen] = L'\0';

    SYSTEMTIME st;
    GetLocalTime(&st);
    
    WCHAR filename[128];
    if (pLen > 0) {
        swprintf(filename, 128, L"%ls_%04d%02d%02d_%02d%02d%02d.txt", 
                prefix, st.wYear, st.wMonth, st.wDay, st.wHour, st.wMinute, st.wSecond);
    } else {
        swprintf(filename, 128, L"note_%04d%02d%02d_%02d%02d%02d.txt", 
                st.wYear, st.wMonth, st.wDay, st.wHour, st.wMinute, st.wSecond);
    }

    WCHAR path[MAX_PATH];
    PathCombineW(path, g_exeDir, filename);

    HANDLE hF = CreateFileW(path, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (hF != INVALID_HANDLE_VALUE) {
        int len8 = WideCharToMultiByte(CP_UTF8, 0, bufW, lenW, NULL, 0, NULL, NULL);
        char* buf8 = (char*)GlobalAlloc(GPTR, len8);
        if (buf8) {
            WideCharToMultiByte(CP_UTF8, 0, bufW, lenW, buf8, len8, NULL, NULL);
            DWORD written;
            WriteFile(hF, buf8, len8, &written, NULL);
            GlobalFree(buf8);
        }
        CloseHandle(hF);
    }
    GlobalFree(bufW);
}

// 実行ファイルのディレクトリを取得
void InitExeDir() {
    GetModuleFileNameW(NULL, g_exeDir, MAX_PATH);
    WCHAR* p = wcsrchr(g_exeDir, L'\\');
    if (p) *p = L'\0';
}

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
        case WM_CREATE:
            g_hEdit = CreateWindowExW(0, L"EDIT", L"", 
                WS_CHILD | WS_VISIBLE | WS_VSCROLL | ES_MULTILINE | ES_AUTOVSCROLL | ES_WANTRETURN, 
                0, 0, 0, 0, hwnd, NULL, (HINSTANCE)GetWindowLongPtr(hwnd, GWLP_HINSTANCE), NULL);
            UpdateFont();
            return 0;

        case WM_SIZE:
            MoveWindow(g_hEdit, 0, 0, LOWORD(lp), HIWORD(lp), TRUE);
            return 0;

        case WM_SETFOCUS:
            SetFocus(g_hEdit);
            return 0;

        case WM_COMMAND:
            if (LOWORD(wp) == IDC_ESCAPE) {
                // Shiftが押されている場合は保存をスキップ
                if ((GetKeyState(VK_SHIFT) & 0x8000)) {
                    g_skip_save = TRUE;
                }
                SendMessageW(hwnd, WM_CLOSE, 0, 0);
                return 0;
            }
            break;

        case WM_CTLCOLOREDIT:
            {
                HDC hdc = (HDC)wp;
                if (g_darkMode) {
                    SetTextColor(hdc, RGB(220, 220, 220));
                    SetBkColor(hdc, RGB(30, 30, 30));
                    static HBRUSH hbrDark = NULL;
                    if (!hbrDark) hbrDark = CreateSolidBrush(RGB(30, 30, 30));
                    return (LRESULT)hbrDark;
                } else {
                    SetTextColor(hdc, RGB(0, 0, 0));
                    SetBkColor(hdc, RGB(255, 255, 255));
                    return (LRESULT)GetStockObject(WHITE_BRUSH);
                }
            }

        case WM_CLOSE:
            AutoSave();
            DestroyWindow(hwnd);
            return 0;

        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
    }
    return DefWindowProcW(hwnd, msg, wp, lp);
}

int WINAPI WinMain(HINSTANCE hI, HINSTANCE hP, LPSTR lpC, int nS) {
    WNDCLASSW wc = {0};
    InitExeDir();
    wc.lpfnWndProc = WndProc; 
    wc.hInstance = hI; 
    wc.lpszClassName = L"E";
    wc.hIcon = LoadIconW(hI, L"MAINICON");
    wc.hCursor = LoadCursorW(NULL, (LPCWSTR)IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    
    if (!RegisterClassW(&wc)) return 0;
    
    HWND hn = CreateWindowExW(WS_EX_LAYERED, L"E", L"Slim Editor", 
        WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 600, 400, NULL, NULL, hI, NULL);

    UpdateTransparency(hn);

    HACCEL hAccel = LoadAcceleratorsW(hI, L"IDR_ACCELERATOR");

    MSG m;
    while (GetMessageW(&m, NULL, 0, 0)) {
        if (hAccel && TranslateAcceleratorW(hn, hAccel, &m)) continue;

        if (m.message == WM_KEYDOWN || m.message == WM_SYSKEYDOWN) {
            if (m.wParam == VK_F1) {
                g_topMost = !g_topMost;
                SetWindowPos(hn, g_topMost ? HWND_TOPMOST : HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
                SetWindowTextW(hn, g_topMost ? L"Slim Editor [Topmost]" : L"Slim Editor");
                continue;
            } else if (m.wParam == VK_UP) {
                if (GetKeyState(VK_CONTROL) & 0x8000) {
                    g_fontSize += 2; if (g_fontSize > 72) g_fontSize = 72;
                    UpdateFont(); continue;
                } else if (GetKeyState(VK_MENU) & 0x8000) {
                    int n = (int)g_alpha + 15; if (n > 255) n = 255; g_alpha = (BYTE)n;
                    UpdateTransparency(hn); continue;
                }
            } else if (m.wParam == VK_DOWN) {
                if (GetKeyState(VK_CONTROL) & 0x8000) {
                    g_fontSize -= 2; if (g_fontSize < 8) g_fontSize = 8;
                    UpdateFont(); continue;
                } else if (GetKeyState(VK_MENU) & 0x8000) {
                    int n = (int)g_alpha - 15; if (n < 30) n = 30; g_alpha = (BYTE)n;
                    UpdateTransparency(hn); continue;
                }
            } else if (m.wParam == VK_F6) {
                g_darkMode = !g_darkMode;
                InvalidateRect(g_hEdit, NULL, TRUE);
                continue;
            }
        } else if (m.message == WM_MOUSEWHEEL) {
            short delta = (short)HIWORD(m.wParam);
            if (GetKeyState(VK_CONTROL) & 0x8000) {
                g_fontSize += (delta > 0 ? 2 : -2);
                if (g_fontSize < 8) g_fontSize = 8; if (g_fontSize > 72) g_fontSize = 72;
                UpdateFont(); continue;
            } else if (GetKeyState(VK_MENU) & 0x8000) {
                int n = (int)g_alpha + (delta > 0 ? 15 : -15);
                if (n < 30) n = 30; if (n > 255) n = 255; g_alpha = (BYTE)n;
                UpdateTransparency(hn); continue;
            }
        }
        TranslateMessage(&m);
        DispatchMessageW(&m);
    }
    return (int)m.wParam;
}