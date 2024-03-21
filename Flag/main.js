$(function(){
      
    // 初期画像の表示
    $('.img').attr('src', 'img/' + '0g.drawio.svg');

});

var hideFlg = false;

var displaySpeed = 1000;

// 文字表示
async function display(){
    setDisplaySpeed();
    var TextValue = document.forms.c_form.c_textBox.value;
    var tmp = TextValue.split('');
    var numFlag = false;
    var cnt = 1;
    (async () => {
        for(var i = 0; i < tmp.length; i++) {
            if (character[tmp[i]]) {
                // 入力が数字か否か
                if (!isNaN(tmp[i]) && !numFlag) {
                    // 数字開始合図
                    numFlag = true;
                    $('.img').attr('src', 'img/' + '13.drawio.svg');
                    displayCharacter("数字開始");
                    await sleep(displaySpeed * 3);
                } else if (isNaN(tmp[i]) && numFlag) {
                    // 数字終了合図
                    numFlag = false;
                    $('.img').attr('src', 'img/' + '13.drawio.svg');
                    displayCharacter("数字終了");
                    await sleep(displaySpeed * 3);

                    // 原姿
                    $('.img').attr('src', 'img/'  + '0g.drawio.svg');
                    await sleep(displaySpeed * 2);
                }
                for(c of character[tmp[i]]){
                    $('.img').attr('src', 'img/' + c + '.drawio.svg');
                    displayCharacter(tmp[i]);
                    displayCount(cnt);
                    if (tmp[i] === "0") {                    
                        await sleep(displaySpeed * 0.125);
                    } else { 
                        await sleep(displaySpeed);
                    }
                }

                // 連続した数字は原姿を挟まない
                if (!numFlag) {
                    // 数字エリア以外は原姿を挟む
                    $('.img').attr('src', 'img/'  + '0g.drawio.svg');
                    await sleep(displaySpeed * 2);
                }
                
            } else {
                console.log("存在しない！！");
                displayCharacter("五十音カタカナ・数字以外は入力しないでください。");
            }
            cnt++;
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