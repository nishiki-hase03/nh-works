$(function(){
      
    // 初期画像の表示
    $('.img').attr('src', 'img/' + 'board.drawio.svg');

    $('.n1').attr('src', 'img/' + 'needle.drawio.svg');
    $('.n2').attr('src', 'img/' + 'needle.drawio.svg');
    $('.n3').attr('src', 'img/' + 'needle.drawio.svg');
    $('.n4').attr('src', 'img/' + 'needle.drawio.svg');
    $('.n5').attr('src', 'img/' + 'needle.drawio.svg');

});

var hideFlg = false;

var displaySpeed = 1000;

// 文字表示
async function display(){
    setDisplaySpeed();
    var TextValue = document.forms.c_form.c_textBox.value;
    var tmp = TextValue.split('');

    (async () => {
        for(var i = 0; i < tmp.length; i++) {
            if (character[tmp[i]]) {
                var num = 1;
                for(c of character[tmp[i]]){
                    document.documentElement.style.setProperty("--n" + num + "deg", deg[c]);
                    num++;
                }
                displayCharacter(tmp[i]);
                displayCount(i+1);
                await sleep(displaySpeed);
            } else {
                console.log("存在しない！！");
                displayCharacter("文字盤にない文字は記入しないでください。");
            }
            var reset = 1;
            for(c of character[" "]){
                document.documentElement.style.setProperty("--n" + reset + "deg", deg[c]);
                reset++;
            }
            await sleep(displaySpeed);
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