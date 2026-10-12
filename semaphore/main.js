const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
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
var preChar = "";

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
        }, 0);
    });
    
}

// 文字表示
async function display(){
    setRotateSpeed();
    setDisplaySpeed();
    var TextValue = document.forms.c_form.c_textBox.value;
    TextValue = TextValue.toUpperCase();
    var tmp = TextValue.split("");
    var arr = [...tmp];
    var cnt = 0;
    // 前の文字をリセット
    preChar = "";

    for (const i of arr) {      
        var nowChar = i;
        for (const c of nowPattern) {
            if (c[0] === i) {
                
                // 同じ文字が続く場合の処理
                if (preChar === nowChar) {
                    // 垂直状態（例：90, 180, -180）へ移動し、完了を待つ
                    await rotateAll(90, 180, -180); 
                    await sleep(displaySpeed/5);
                }

                cnt++;
                // 本来の文字の形へ移動し、完了を待つ
                await rotateAll(c[1], c[2], c[3]);
                
                if (c[0] === " ") {
                    displayCharacter("blank");
                } else {
                    displayCharacter(i);
                }
                displayCount(cnt);
                await sleep(displaySpeed);

                // 文字が見つかったら内側のループを抜ける
                break; 
            }
        }
        preChar = nowChar;
    }
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

// 選択された番目の文字を表示する
function displaySelectedCharacter(){
    var nowChar = nowPattern[num - 1][0];
    var num = sc_form.elements['selectedNum'].value;
    if(nowChar === " "){
        displayCharacter("blank");
    } else {
        displayCharacter(nowChar);
        console.log(nowPattern);
    }
    if (preChar === nowChar) {
        console.log("同じ文字")
        rotateRegulator(" ");
        rotateIndicatorL(" ");
        rotateIndicatorR(" ");
    }
    preChar = nowChar;
    displayCount(num);
    rotateRegulator(nowPattern[num - 1][1]);
    rotateIndicatorL(nowPattern[num - 1][2]);
    rotateIndicatorR(nowPattern[num - 1][3]);
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