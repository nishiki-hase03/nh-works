var variableList = [
    ["", ""],
];

var line = [];

var subFlg = false;

// 表示領域、変数をクリア
function clearText() {
    document.getElementById('displayArea').innerHTML = "";
    variableList = [
        ["", ""],
    ];
}

// プログラムを実行
function execute() {
    // 入力内容を読み込む
    var program = document.forms.c_form.c_textBox.value;
    
    // 構文解析を行う
    analyze(program);

}

// 構文解析
function analyze(program) {

    // 1行ずつ取り出す。
    var tokens = program.split("\n");
    var cnt = 0;
    tokens.forEach(element => {
        cnt++;
        if (element.indexOf("※") != 0) {
            // コメント行ではない
            analyzeSentence(element, cnt);
        } else {
            // コメント行
            console.log(cnt + "行目はコメント");
        }
    });    
}

// 1行ずつ処理する
function analyzeSentence(tokens, cnt) {
    var token = tokens.split(" ");
    line.push(splitSign(tokens, sSign));
    var firstFlg = true;
    if (token.includes("足す")) {
        console.log("足すがあるよ");
        tokens = functionList[list["足す"]](tokens, cnt);
        token = tokens.split(" ");
    }
    console.log("token:" + token);
    console.log("tokens:" + tokens);
    token.forEach(element => {
        if(list[element] && firstFlg){
            functionList[list[element]](tokens, cnt);
            firstFlg = false;
        }
    });
}

// 文字列かどうかの確認
function isStr (txt){
    if ( txt.match(sSign["start"]) && txt.match(sSign["end"]) ) {
        return true;
    } else {
        return false;
    }
}

// 変数化どうかの確認
function isVar (txt){
    if ( txt.match(vSign["start"]) && txt.match(vSign["end"]) ) {
        return true;
    } else {
        return false;
    }
}

// 文字列、変数の取り出し
function splitSign(txt, sign) {
    var target = txt.substr( txt.indexOf(sign["start"]) + 1, txt.indexOf(sign["end"]) - 1 );
    return target;
}

//関数を格納する配列
var functionList = new Array();

// コンソールに出力
functionList.display = function(tokens, cnt){
    var token = tokens.split(" ");
    console.log(token);
    if ( isStr(token[0]) ) {
        // 文字列の場合
        var target = splitSign(token[0], sSign);
    } else if ( isVar(token[0]) ) {
        // 変数の場合
        var target = splitSign(token[0], vSign);
        variableList.forEach(element => {
            if (element[0] === target) {
                // 変数が存在する
                target = element[1];
            } 
        });

        if (target === splitSign(token[0], vSign)) {
            // 変数が存在しない
            target = cnt +"行目：ERROR! '" + token[0] + "' は定義されていません。";
        }
    } else {
        // 文法に誤りがある
        target = cnt +"行目：ERROR! 文法に誤りがあります。";
    }
    target = "<br />" + target;
    document.getElementById('displayArea').innerHTML += target;
}

// 変数定義
functionList.declare = function(tokens, cnt){
    var token = tokens.split(" ");

    // 変数の場合
    if ( token[0].match(vSign["start"]) && token[0].match(vSign["end"]) ){
        var target = splitSign(token[0], vSign);
        var eFlg = false;
        for (var i = 0; i < variableList.length; i++) {
            element = variableList[i][0];
            if(element === target) {
                // 変数が存在する
                console.log("変数リストに存在する");
                eFlg = true;
                break;
            } 
        }
    }
    

    // 変数が存在しない場合⇒定義する
    if (!eFlg) {
        variableList.push([target, ""]);
    } else {
        // 変数が存在する場合⇒エラー
        target = cnt +"行目：ERROR! '" + target + "' は定義済みです。";
        target = "<br />" + target;
        document.getElementById('displayArea').innerHTML += target;
    }
    console.log("定義する");
}

// 代入
functionList.substitute = function(tokens, cnt){
    var token = tokens.split(" ");

    // 代入先に変数が指定されているか
    if ( token[0].match(vSign["start"]) && token[0].match(vSign["end"]) ) {
        var target = splitSign(token[0], vSign);
        var value = token[2];

        var existFlg = false;
        variableList.forEach(element => {
            // 代入先の変数が存在する
            if (element[0] === target) {
                existFlg = true;
                // 代入する値を確認
                if ( value.match(sSign["start"]) && value.match(sSign["end"]) ) {
                    // 文字列の場合
                    var v = splitSign(value, sSign);
                    element[1] = v;
                } else  if ( value.match(vSign["start"]) && value.match(vSign["end"]) ) {
                    // 変数の場合
                    var v = splitSign(value, vSign);
                    variableList.forEach(e => {
                        if (e[0] === v) {
                            // 変数が存在する
                            element[1] = e[1];
                        } 
                    });
                }
            } 
        });

        // 変数が存在しない場合
        if (!existFlg) {
            if ( value.match(sSign["start"]) && value.match(sSign["end"]) ) {
                // 文字列の場合
                var v = splitSign(value, sSign);
                variableList.push([target, v]);
            } else  if ( value.match(vSign["start"]) && value.match(vSign["end"]) ) {
                // 変数の場合
                var v = splitSign(value, vSign);
                variableList.forEach(e => {
                    if (e[0] === v) {
                        // 変数が存在する
                        variableList.push([target, e[1]]);
                    } 
                });
            }
        }
    }
    
    subFlg = true;
    console.log("代入する");
}

functionList.loop = function(tokens, cnt){
    console.log("繰り返す");
}

functionList.condition = function(tokens, cnt){
    console.log("分岐する");
}

// 加算（文字列、数字）
functionList.plus = function(tokens, cnt){
    var token = tokens.split(" ");
    var cnt = 0;
    var plusTxt = "";
    var final = 0;

    var flg = false;
    console.log(token);

    for (var i = 0; i < token.length; i++) {
        if (token[i] === "足す") {
            if (i > 2 && cnt == 0) {
                flg = true;
            }
            cnt++;
            if(cnt == 1) {
                if (isStr(token[i - 1])) {
                    // 前が文字列
                    var s = splitSign(token[i - 1], sSign);
                    plusTxt = s;
                } else if (isVar(token[i - 1])) {
                    // 前が変数
                    var v = splitSign(token[i - 1], vSign);
                    variableList.forEach(e => {
                        if (e[0] === v) {
                            // 変数が存在する
                            plusTxt = e[1];
                        } 
                    });
                }

                if (isStr(token[i + 1])) {
                    // 次が文字列
                    var s = splitSign(token[i + 1], sSign);
                    plusTxt += s;
                } else if (isVar(token[i + 1])) {
                    // 変数
                    var v = splitSign(token[i + 1], vSign);
                    variableList.forEach(e => {
                        if (e[0] === v) {
                            // 変数が存在する
                            plusTxt += e[1];
                        } 
                    });
                }
            } else {
                if (isStr(token[i + 1])) {
                    // 前が文字列
                    var s = splitSign(token[i + 1], sSign);
                    plusTxt += s;
                } else if (isVar(token[i + 1])) {
                    // 前が変数
                    var v = splitSign(token[i + 1], vSign);
                    variableList.forEach(e => {
                        if (e[0] === v) {
                            // 変数が存在する
                            plusTxt += e[1];
                        } 
                    });
                }
            }
            final = i + 1;
        }
    }
    
    console.log(token);
    var newTokenLength = token.length - final;
    var newToken = "「" + plusTxt + "」";
    console.log(newToken);
    
    if (!flg) {
        newToken += " " + token[token.length - 1]
        console.log("こっち");
        console.log(token);
        console.log(newToken);
    } else {
        newToken = token[0] + " ";
        newToken += token[1] + " ";
        newToken += "「" + plusTxt + "」";
    }
    
    console.log(newToken);
    return newToken;
    // analyzeSentence(newToken, cnt);
}

functionList.minus = function(tokens, cnt){
    console.log("引く");
}

functionList.multiple = function(tokens, cnt){
    console.log("掛ける");
}

functionList.divide = function(tokens, cnt){
    console.log("割る");
}

functionList.unify = function(tokens, cnt){
    console.log("まとめる");
}
