//数据库路径
//C:\Users\LukeSkyWalker\AppData\Local\Google\Chrome\User Data\Default\databases\chrome-extension_kgchcpkfnbhienoecdhbcmhpmoiccpfc_0
var mStork = 0;
var mLiIndex = 0;
var mLi = new Array();
var dataBase = openDatabase("words", "1.0", "起名", 1024 * 1024, function () {
});
function r(min, max) {
    return Math.floor(min + Math.random() * (max - min));
}
function getRandomIp() {
    return r(1, 255) + "." + r(1, 255) + "." + r(1, 255) + "." + r(1, 255);
}
function httpRequest(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    //伪造ip的属性
    var fakeIP = getRandomIp();
    xhr.setRequestHeader("X-Forwarded-For", fakeIP);
    xhr.send();
    callback(xhr.responseText);
}

function save(word, five, stork) {
    if (!dataBase) {
        console.error(stroke + " save");
        console.error("数据库创建失败！");
    } else {
        dataBase.transaction(function (tx) {
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS word (word TEXT UNIQUE,five TEXT,stork INTEGER)",
                [],
                function (tx, result) {
                    tx.executeSql(
                        "INSERT INTO word (word,five,stork) VALUES(?,?,?)",
                        [word, five, stork],
                        function () {
                            // alert('添加数据成功');
                            continueLi();

                        },
                        function (tx, error) {
                            console.error(stroke + " save1");
                            console.error('添加数据失败: ' + error.message);
                            continueLi();
                        });
                },
                function (tx, error) {
                    console.error(stroke + " save2");
                    console.error('创建word表失败:' + error.message);
                    continueLi();
                });
        });
    }
}
function continueLi() {
    mLiIndex++;
    if (mLiIndex == mLi.length) {
        doNext();
    } else {
        handleLi();
    }
}
function doHandleLi(li, word, five) {
    var start = li.indexOf('a href="');
    var end = li.indexOf('" target="_blank"');
    var url = "http://tool.httpcn.com" + li.substring(start + 8, end);
    document.getElementById('ip_div').innerText = word + five + mStork;
    httpRequest(url, function (htmlStr) {
        if (!htmlStr) {
            console.error(stroke + " handleLi1");
            continueLi();
            return;
        }
        var jiIndex = htmlStr.indexOf('吉凶寓意：');
        if (jiIndex > 0) {
            var ji = htmlStr.substring(jiIndex + 5, jiIndex + 6);
            if (ji == "吉") {
                save(word, five, mStork);
                return;
            }
        }
        continueLi();

    });
}
function handleLi() {
    var li = mLi[mLiIndex];
    var start = li.indexOf('"sotab_zi_r"');
    var end = li.lastIndexOf('</span>');
    var five = li.substring(start + 15, end - 1);//五行
    start = li.indexOf('"sotab_zi_l"');
    end = li.indexOf('</span>');
    var word = li.substring(start + 13, end);

    if (!dataBase) {
        console.error(mStork + " handleLi");
        console.error("数据库创建失败！");
    } else {
        dataBase.transaction(function (tx) {
            tx.executeSql(
                "SELECT * FROM word WHERE word='" + word + "'", [],
                function (tx, result) {
                    if (result.rows.length > 0) {
                        continueLi();
                        return
                    }
                    doHandleLi(li, word, five);

                },
                function (tx, error) {
                    console.error(mStork + " handleLi2");
                    console.error('查询失败: ' + error.message);
                    doHandleLi(li, word, five);
                });
        });
    }
}
function getNameWord(stroke) {
    console.log(stroke);
    mStork = stroke;
    httpRequest('http://tool.httpcn.com/KangXi/So.asp?tid=3&wd=' + stroke + '&cy=1', function (htmlStr) {

        if (!htmlStr) {
            console.error(stroke + " getNameWord");
            doNext();
            return;
        }
        var start = htmlStr.indexOf('<ul class="sotab_zi">');
        if (start == -1) {
            console.error(stroke + " getNameWord1");
            console.log(htmlStr);
            doNext();
            return;
        }
        var tmp = htmlStr.substring(start);
        var end = start + tmp.indexOf("</ul>");
        start = start + tmp.indexOf("<li>");
        tmp = htmlStr.substring(start, end);
        mLi.length = 0;
        mLiIndex = 0;
        while (true) {
            var itemStart = tmp.lastIndexOf("<li>");
            if (itemStart == 0) {
                mLi.push(tmp);
                break;
            } else if (itemStart == -1) {
                break;
            }
            var li = tmp.substring(itemStart);
            mLi.push(li);
            tmp = tmp.substring(0, itemStart);
        }
        handleLi();
    });
}
function doNext() {
    mStork++;
    if (mStork > 30) {
        console.error('结束');
        return;
    }
    getNameWord(mStork);
}

getNameWord(1);
