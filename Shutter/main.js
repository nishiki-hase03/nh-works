$(function(){
      
    // 初期画像の表示
    $('.img').attr('src', 'img/' + 'board.drawio.svg');

    $('.s1').attr('src', 'img/' + 'close.drawio.svg');
    $('.s2').attr('src', 'img/' + 'close.drawio.svg');
    $('.s3').attr('src', 'img/' + 'close.drawio.svg');
    $('.s4').attr('src', 'img/' + 'close.drawio.svg');
    $('.s5').attr('src', 'img/' + 'close.drawio.svg');
    $('.s6').attr('src', 'img/' + 'close.drawio.svg');

});

var hideFlg = false;

var displaySpeed = 500;

// 文字表示
async function display(){
    setDisplaySpeed();
    var TextValue = document.forms.c_form.c_textBox.value;
    var tmp = TextValue.split('');

    (async () => {
        for(var i = 0; i < tmp.length; i++) {
            if (character[tmp[i]]) {
                var num = 1;
                for(var j = 0; j < character[tmp[i]].length; j++){
                    if (character[tmp[i]][j] == 1) {
                        $('.s' + num).attr('src', 'img/' + 'open.drawio.svg');
                    } 
                    

                    displayCharacter(tmp[i]);
                    displayCount(i+1);

                    
                    num ++;
                }
                
                await sleep(displaySpeed);
            } else {
                console.log("存在しない！！");
                displayCharacter("符号化対象外文字です");
            }
            // 元の位置へ
            $('.s1').attr('src', 'img/' + 'close.drawio.svg');
            $('.s2').attr('src', 'img/' + 'close.drawio.svg');
            $('.s3').attr('src', 'img/' + 'close.drawio.svg');
            $('.s4').attr('src', 'img/' + 'close.drawio.svg');
            $('.s5').attr('src', 'img/' + 'close.drawio.svg');
            $('.s6').attr('src', 'img/' + 'close.drawio.svg');
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