$(function(){
      
    // 初期画像の表示
    $('.img').attr('src', 'img/' + 'board.drawio.svg');

    $('.needle').attr('src', 'img/' + 'needle.drawio.svg');

});

var hideFlg = false;

var displaySpeed = 500;

var character = character1;

// 文字表示
async function display(){
    setDisplaySpeed();
    var TextValue = document.forms.c_form.c_textBox.value;
    var tmp = TextValue.split('');

    (async () => {
        for(var i = 0; i < tmp.length; i++) {
            if (character[tmp[i]]) {
                for(c of character[tmp[i]]){
                    document.documentElement.style.setProperty("--ndeg", deg[c]);
                    $('.img').attr('src', 'img/' + 'board_' + c +'.drawio.svg');
                    displayCharacter(tmp[i]);
                    displayCount(i+1);
                    await sleep(displaySpeed);
                    document.documentElement.style.setProperty("--ndeg", deg["c"]);
                    $('.img').attr('src', 'img/' + 'board.drawio.svg');
                    await sleep(displaySpeed);
                }
            } else {
                console.log("存在しない！！");
                displayCharacter("符号化対象外文字です");
            }
            document.documentElement.style.setProperty("--ndeg", deg["c"]);
            await sleep(displaySpeed * 2);
        }
    })();
}

// スリーブ関数
const sleep = waitTime => new Promise( resolve => setTimeout(resolve, waitTime) );

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
    document.getElementById('displayCount').textContent = n + "文字目";
}

// 表示速度設定
function setDisplaySpeed(){
    var dspeed = ds_form.elements['dspeed'].value;
    displaySpeed = Number(dspeed);
}

// 文字を隠し切り替え
function hideChar() {
    hideFlg = !hideFlg;
    if(hideFlg) {
        document.getElementById('displayCharacter').textContent = "■";
    }
}

function changePattern() {
    if (character == character1) {
        character = character2;
        document.getElementById('displayPattern').textContent = "符号化パターン2";
    } else {
        character = character1;
        document.getElementById('displayPattern').textContent = "符号化パターン1";
    }
}