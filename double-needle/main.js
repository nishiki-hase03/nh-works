$(function(){
      
    // 初期画像の表示
    $('.img').attr('src', 'img/' + 'board.drawio.svg');

    $('.nl').attr('src', 'img/' + 'needle.drawio.svg');
    $('.nr').attr('src', 'img/' + 'needle.drawio.svg');


    $('.ll').attr('src', 'img/' + 'center.drawio.svg');
    $('.lr').attr('src', 'img/' + 'center.drawio.svg');
    $('.rl').attr('src', 'img/' + 'center.drawio.svg');
    $('.rr').attr('src', 'img/' + 'center.drawio.svg');

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
            if (characterL[tmp[i]]) {
                for(var j = 0; j < characterL[tmp[i]].length; j++){
                    document.documentElement.style.setProperty("--nldeg", deg[characterL[tmp[i]][j]]);
                    document.documentElement.style.setProperty("--nrdeg", deg[characterR[tmp[i]][j]]);
                    
                    if (characterL[tmp[i]][j] === "l") {
                        if (characterR[tmp[i]][j] === "l") {
                            $('.ll').attr('src', 'img/' + 'blue.drawio.svg');
                            $('.lr').attr('src', 'img/' + 'center.drawio.svg');
                            $('.rl').attr('src', 'img/' + 'blue.drawio.svg');
                            $('.rr').attr('src', 'img/' + 'center.drawio.svg');
                        } else if (characterR[tmp[i]][j] === "r") {
                            $('.ll').attr('src', 'img/' + 'blue.drawio.svg');
                            $('.lr').attr('src', 'img/' + 'center.drawio.svg');
                            $('.rl').attr('src', 'img/' + 'center.drawio.svg');
                            $('.rr').attr('src', 'img/' + 'red.drawio.svg');
                        } else {
                            $('.ll').attr('src', 'img/' + 'blue.drawio.svg');
                            $('.lr').attr('src', 'img/' + 'center.drawio.svg');
                            $('.rl').attr('src', 'img/' + 'center.drawio.svg');
                            $('.rr').attr('src', 'img/' + 'center.drawio.svg');
                        }

                    } else if (characterL[tmp[i]][j] === "r") {
                        if (characterR[tmp[i]][j] === "l") {
                            $('.ll').attr('src', 'img/' + 'center.drawio.svg');
                            $('.lr').attr('src', 'img/' + 'red.drawio.svg');
                            $('.rl').attr('src', 'img/' + 'blue.drawio.svg');
                            $('.rr').attr('src', 'img/' + 'center.drawio.svg');

                        } else if (characterR[tmp[i]][j] === "r") {
                            $('.ll').attr('src', 'img/' + 'center.drawio.svg');
                            $('.lr').attr('src', 'img/' + 'red.drawio.svg');
                            $('.rl').attr('src', 'img/' + 'center.drawio.svg');
                            $('.rr').attr('src', 'img/' + 'red.drawio.svg');

                        } else {
                            $('.ll').attr('src', 'img/' + 'center.drawio.svg');
                            $('.lr').attr('src', 'img/' + 'red.drawio.svg');
                            $('.rl').attr('src', 'img/' + 'center.drawio.svg');
                            $('.rr').attr('src', 'img/' + 'center.drawio.svg');
                            
                        }
                    } else {
                        if (characterR[tmp[i]][j] === "l") {
                            $('.ll').attr('src', 'img/' + 'center.drawio.svg');
                            $('.lr').attr('src', 'img/' + 'center.drawio.svg');
                            $('.rl').attr('src', 'img/' + 'blue.drawio.svg');
                            $('.rr').attr('src', 'img/' + 'center.drawio.svg');

                        } else if (characterR[tmp[i]][j] === "r") {
                            $('.ll').attr('src', 'img/' + 'center.drawio.svg');
                            $('.lr').attr('src', 'img/' + 'center.drawio.svg');
                            $('.rl').attr('src', 'img/' + 'center.drawio.svg');
                            $('.rr').attr('src', 'img/' + 'red.drawio.svg');

                        } else {
                            $('.ll').attr('src', 'img/' + 'center.drawio.svg');
                            $('.lr').attr('src', 'img/' + 'center.drawio.svg');
                            $('.rl').attr('src', 'img/' + 'center.drawio.svg');
                            $('.rr').attr('src', 'img/' + 'center.drawio.svg');
                            
                        }
                    }


                    displayCharacter(tmp[i]);
                    displayCount(i+1);
                    await sleep(displaySpeed);

                    // 元の位置へ
                    document.documentElement.style.setProperty("--nldeg", deg["c"]);
                    document.documentElement.style.setProperty("--nrdeg", deg["c"]);
                    $('.img').attr('src', 'img/' + 'board.drawio.svg');
                    $('.ll').attr('src', 'img/' + 'center.drawio.svg');
                    $('.lr').attr('src', 'img/' + 'center.drawio.svg');
                    $('.rl').attr('src', 'img/' + 'center.drawio.svg');
                    $('.rr').attr('src', 'img/' + 'center.drawio.svg');
                    await sleep(displaySpeed);
                }
            } else {
                console.log("存在しない！！");
                displayCharacter("符号化対象外文字です");
            }
            document.documentElement.style.setProperty("--nldeg", deg["c"]);
            document.documentElement.style.setProperty("--nrdeg", deg["c"]);
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