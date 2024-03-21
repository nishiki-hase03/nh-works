var nowPattern = DefaultPattern;

var nowRe = 0;
var nowIL = 0;
var nowIR = 0;

var classRe;
var classIL;
var classIR;

var displaySpeed = 2000;

const splitChar = ',';
const partitionChar = ":";

var hideFlg = false;

// 調整器の角度変更
function rotateRegulator(r) {
    nowRe = r;
    console.log("調節器の角度：" + nowRe);
    document.getElementById("regulator").classList.remove(classRe);
    classRe = "rotate_" + String(nowRe);
    document.getElementById("regulator").classList.add(classRe);
}

// 左指示器の角度変更
function rotateIndicatorL(il) {
    nowIL = il;
    console.log("左指示器の角度：" + nowIL);
    document.getElementById("l_indicator").classList.remove(classIL);
    classIL = "rotate_" + String(nowIL);
    document.getElementById("l_indicator").classList.add(classIL);
}


// 右指示器の角度変更
function rotateIndicatorR(ir) {
    nowIR = ir;
    console.log("右指示器の角度：" + nowIR);
    document.getElementById("r_indicator").classList.remove(classIR);
    classIR = "rotate_" + String(nowIR);
    document.getElementById("r_indicator").classList.add(classIR);
}

// 腕木の回転
const rotateAll = (r,il,ir) => {
    return new Promise(resolve => {
        setTimeout(() => {
            rotateRegulator(r);
            rotateIndicatorL(il);
            rotateIndicatorR(ir);
            resolve("OK");
        }, displaySpeed);
    });
    
}

// 文字表示
async function display(){
    setRotateSpeed();
    setDisplaySpeed();
    var TextValue = document.forms.c_form.c_textBox.value;
    TextValue = TextValue.toUpperCase();
    var tmp = TextValue.split(" ");
    var arr = [...tmp];
    var cnt = 0;
    (async () => {
        for await (i of arr) {      
            for(c of nowPattern){
                if(c[0] === i){
                    cnt++;
                    await rotateAll(c[1], c[2], c[3]);
                    if(c[0] === " "){
                        displayCharacter("blank");
                    } else {
                        displayCharacter(i);
                    }
                    displayCount(cnt);
                }
            }
        }
    })();
}

// 腕木回転速度設定
function setRotateSpeed(){
    var rspeed = rs_form.elements['rspeed'].value;
    document.documentElement.style.setProperty('--speed',rspeed);
}

// 表示速度設定
function setDisplaySpeed(){
    var dspeed = ds_form.elements['dspeed'].value;
    displaySpeed = Number(dspeed);
}
// 腕木の位置をリセット
function reset(){
    document.getElementById("regulator").classList.remove(classRe);
    document.getElementById("l_indicator").classList.remove(classIL);
    document.getElementById("r_indicator").classList.remove(classIR);
    displayCharacter("腕木が表している文字を表示します");
    displayCount("？");
}

// ユーザ定義リストの設定を行う
function setUserPattern(){
    var userC = sc_form.elements['user_c'].value;
    var num = sc_form.elements['selectedNum'].value;
    nowPattern[num - 1][0] = userC;
    console.log(userC);
}

// 表示する腕木のパターン（リスト）を変更する
function changePattern(){
    var selectedPattern = sp_form.elements['selectedPattern'].value;
    // プルダウン再構築
    var selectNumber = document.getElementById('selectedNum');
    while( selectNumber.firstChild ){
        selectNumber.removeChild( selectNumber.firstChild );
    }
    
    if (selectedPattern === "default"){
        nowPattern = DefaultPattern;
        // デフォルトパターンに変更
        document.getElementById('pattern').textContent = "デフォルト";
        document.getElementById('setUserPatternButton').setAttribute("disabled", true);
        document.getElementById('downloadButton').setAttribute("disabled", true);
    }  else if (selectedPattern === "user") {
        nowPattern = userPattern;
        // ユーザ定義パターンに変更
        document.getElementById('pattern').textContent = "ユーザ定義（92）";
        document.getElementById('setUserPatternButton').removeAttribute("disabled");
        document.getElementById('downloadButton').removeAttribute("disabled");
    } else if (selectedPattern === "all") {
        nowPattern = allPattern;
        // allパターンに変更
        document.getElementById('pattern').textContent = "ユーザ定義（185）";
        document.getElementById('setUserPatternButton').removeAttribute("disabled");
        document.getElementById('downloadButton').removeAttribute("disabled");
    }
    for (var i = 0; i < nowPattern.length; i++){
        var userOption = document.createElement('option');
        userOption.value = String(i+1);
        userOption.textContent = String(i+1);
        selectNumber.appendChild(userOption);
    }
}

// 選択された番目の文字を表示する
function displaySelectedCharacter(){
    var num = sc_form.elements['selectedNum'].value;
    if(nowPattern[num - 1][0] === " "){
        displayCharacter("blank");
    } else {
        displayCharacter(nowPattern[num - 1][0]);
        console.log(nowPattern);
    }
    displayCount(num);
    rotateRegulator(nowPattern[num - 1][1]);
    rotateIndicatorL(nowPattern[num - 1][2]);
    rotateIndicatorR(nowPattern[num - 1][3]);
}

// 選択されているリストの文字をすべて表示する
async function displayAll(){
    var cnt = 0;
    setRotateSpeed();
    setDisplaySpeed();
    for(c of nowPattern){
        cnt++;
        await rotateAll(c[1], c[2], c[3]);
        if(c[0] === " "){
            displayCharacter("blank");
        } else {
            displayCharacter(c[0]);
        }
        displayCount(cnt);
    }
}

// ユーザ定義のcsvファイル出力
function download() {
    var str = "";
    for(i of nowPattern){
        var cnt = 0;
        for(j of i){
            if (cnt != i.length - 1){
                str += j + ",";
            } else {
                str += j;
            }
            cnt++;
        }
        str += "\n";
    }
    console.log(str);
    var blob =new Blob([str],{type:"text/csv"}); //配列に上記の文字列(str)を設定
    var link =document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download ="codeBook.csv";
    link.click();
}

// ファイルアップロード時の処理
window.onload = function() {
    $inputFile.onchange = async (e) => {
        // ファイルオブジェクトを取得
        var file = e.currentTarget.files[0];
        if (!file) return ;
        
        // 中身を取得
        var text = await fetchAsText(file);
        var tmp = text.split("\n");
        var result = [];
 
        // 各行ごとにカンマで区切った文字列を要素とした二次元配列を生成
        for(var i=0;i<tmp.length;++i){
            result[i] = tmp[i].split(',');
        }
        nowPattern = result;
    };
};

// ファイルから内容をテキストとして取得する Promise を返す
var fetchAsText = (file) => {
    return new Promise((resolve) => {
      var fr = new FileReader();
      fr.onload = (e) => {
        // 読み込んだ結果を resolve する
        resolve(e.currentTarget.result);
      };
      // 読み込む
      fr.readAsText(file);
    });
};

// 文字から信号へ変換
function changeSign() {
    var TextValue = document.forms.c_form.c_textBox.value;
    TextValue = TextValue.toUpperCase();
    var tmp = TextValue.split(" ");
    var arr = [...tmp];
    var cnt = 0;
    var str = "";
    for (i of arr) {
        for (c of nowPattern) {
            if (c[0] === i) {
                cnt++;
                
                var deg1, deg2, deg3;
                for (j of degPattern) {
                    if(j[0] === c[1]) {
                        deg1 = j[1];
                    }
                    if(j[0] === c[2]) {
                        deg2 = j[1];
                    }
                    if(j[0] === c[3]) {
                        deg3 = j[1];
                    }
                }
                str += deg1 + deg2 + deg3;
            }
        }
    }
    document.forms.s_form.s_textBox.value = str;
}

// 信号をもとに表示
function displaySign() {
    setRotateSpeed();
    setDisplaySpeed();
    var TextValue = document.forms.s_form.s_textBox.value;
    var tmp = TextValue.match(/.{12}/g);
    var cnt = 0;
    (async () => {
        for await (i of tmp) {
            var dtmp = i.match(/.{4}/g);
            if (degPattern.some(v => v.includes(dtmp[0])) && 
                degPattern.some(v => v.includes(dtmp[1])) && 
                degPattern.some(v => v.includes(dtmp[2]))) {

                var deg1, deg2, deg3;
                for (j of degPattern) {
                    if(j[1] === dtmp[0]) {
                        deg1 = j[0];
                    }
                    if(j[1] === dtmp[1]) {
                        deg2 = j[0];
                    }
                    if(j[1] === dtmp[2]) {
                        deg3 = j[0];
                    }
                }
                for (j of nowPattern) {
                    if(j[1]==deg1 && j[2]==deg2 && j[3]==deg3) {
                        cnt++;
                        await rotateAll(deg1, deg2, deg3);
                        displayCharacter(j[0]);
                        displayCount(cnt);
                    }
                }
                
                
            } else {
                displayCharacter("存在しないパターンです");
                displayCount("存在しないパターンです");
            }
        }
    })();
}

// 信号を出力
function exportSign() {
    var TextValue = document.forms.s_form.s_textBox.value;
    var blob =new Blob([TextValue],{type:"text/plain"}); //配列に上記の文字列(str)を設定
    var link =document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download ="sign.txt";
    link.click();
}

// 文字を隠す
function hideChar() {
    hideFlg = !hideFlg;
    if(hideFlg) {
        document.getElementById('displayCharacter').textContent = "■";
    }
}

// 文字を表示する
function displayCharacter(c) {
    if(hideFlg) {
        document.getElementById('displayCharacter').textContent = "■";
    } else {
        document.getElementById('displayCharacter').textContent = c;
    }
}

// 何文字目かを表示する
function displayCount(n) {
    document.getElementById('displayCount').textContent = n;
    document.getElementById("displayCount").className = "";
    window.requestAnimationFrame(function(time) {
        window.requestAnimationFrame(function(time) {
    document.getElementById("displayCount").className = "displayCount";
        });
    });
}