// 1.画面に表示
// 2.変数定義（グローバル）
// 3.代入
// 4.繰り返し
// 5.分岐
// 6.足し算
// 7.引き算
// 8.掛け算
// 9.割り算
// 10.一致する（論理演算）
// 11.一致しない（論理演算）
// 12.関数定義
// 13.関数実行

const list = {
    "を表示する" : "display",
    "を定義する" : "declare",
    "は" : "substitute",
    "回繰り返す" : "loop",
    "もし" : "condition",
    "足す" : "plus",
    "引く" : "minus",
    "掛ける" : "multiple",
    "割る" : "divide",
    "である場合" : "equal",
    "でない場合" : "notEqual",
    "ここから" : "start",
    "ここまでを" : "end",
    "とまとめる" : "unify",
};

// リテラル表現
const sSign = {
    "start" : "「",
    "end" : "」",
};

// 変数表現
const vSign = {
    "start" : "＜",
    "end" : "＞",
};

// 配列表現
const aSign = {
    "start" : "≪",
    "end" : "≫",
};

// 関数表現
const fSign = {
    "start" : "（",
    "end" : "）"
};
