var words = new Array()
var commWordDataBase = openDatabase("comm_word", "1.0", "常用字", 1024 * 1024, function () {
});
var zdicWordDataBase = openDatabase("zdic_word", "1.0", "汉典详情", 1024 * 1024, function () {
});
//http://tool.chinaz.com/tools/unicode.aspx 中文转unicode
function r(min, max) {
    return Math.floor(min + Math.random() * (max - min));
}
function getRandomIp() {
    return r(1, 255) + "." + r(1, 255) + "." + r(1, 255) + "." + r(1, 255);
}
function httpRequest(url, params, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    //伪造ip的属性
    var fakeIP = getRandomIp();
    xhr.setRequestHeader("X-Forwarded-For", fakeIP);
    xhr.onreadystatechange = function () {
        console.error(xhr.readyState);
        console.log(xhr.responseText);
        if (xhr.readyState == 4) {
            callback(xhr.responseText);
        }
    }
    //Send the proper header information along with the request
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    // xhr.setRequestHeader("Content-length", params.length);
    // xhr.setRequestHeader("Connection", "close");
    xhr.send(params);
}

function createDB() {
    if (!commWordDataBase) {
        console.error("数据库创建失败！");
    } else {
        commWordDataBase.transaction(function (tx) {
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS word (word TEXT UNIQUE,five TEXT,stork INTEGER)",
                [],
                function (tx, result) {
                    console.log("create success");
                },
                function (tx, error) {
                    console.error('创建word表失败:' + error.message);
                });
        });
    }
}
function saveNewWord(word, tone) {

    if (!zdicWordDataBase) {
        console.error("数据库创建失败！");
    } else {
        zdicWordDataBase.transaction(function (tx) {
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS new_word (word TEXT UNIQUE,five TEXT,stork INTEGER,tone INTEGER,pinyin TEXT)",
                [],
                function (tx, result) {
                    tx.executeSql(
                        "REPLACE INTO new_word (word,five,stork,tone,pinyin) VALUES(?,?,?,?,?)",
                        [word.word, word.five, word.stork, tone.tone, tone.pinyin],
                        function () {
                            // alert('添加数据成功');
                            doNext();
                        },
                        function (tx, error) {
                            doNext();
                        });
                },
                function (tx, error) {
                    console.error('创建score表失败:' + error.message);
                });
        });
    }
}

function getTone(htmlStr) {
    var start = htmlStr.indexOf('<script>spz("');
    var tmp = htmlStr.substring(start);
    var end = tmp.indexOf('");</script>');
    var tone = {
        tone: tmp.substring(end - 1, end),
        pinyin: tmp.substring(13, end-1)
    };
    return tone;
}
function doGetWord(word) {
    var wordStr = word;
    httpRequest('http://www.zdic.net/sousuo/', "q=" + wordStr, function (htmlStr) {
        var tone = getTone(htmlStr);
        document.getElementById('ip_div').innerText = wordStr + tone.pinyin+tone.tone;
        saveNewWord(word, tone);
    });
}
function getWord(word) {
    if (!zdicWordDataBase) {
        console.error("数据库创建失败！");
    } else {
        zdicWordDataBase.transaction(function (tx) {
            tx.executeSql(
                "SELECT * FROM word WHERE word='"+word.word+"'", [],
                function (tx, result) {
                    console.log("select success");
                    if (result.rows.length > 0) {
                        if(result.rows[0].pinyin) {
                            console.log(word.word);
                            doNext();
                        }else{
                            doGetWord(word)
                        }
                    }else{
                        doGetWord(word);
                        // console.log(word);
                    }

                },
                function (tx, error) {
                    // console.error('查询失败: ' + error.message);
                    doGetWord(word);
                });
        });
    }
}
function handleWords(rows) {
    console.log("handleWords");
    for (var i = 0; i < rows.length; i++) {
        var item = rows[i];
        words[i] = item.word;
    }
    // console.log(words);
    doNext();
}
function fillArray() {
    if (!commWordDataBase) {
        console.error("数据库创建失败！");
    } else {
        commWordDataBase.transaction(function (tx) {
            tx.executeSql(
                "SELECT * FROM word", [],
                function (tx, result) {
                    console.log("select success");
                    if (result.rows.length > 0) {
                        handleWords(result.rows);
                        return
                    }

                },
                function (tx, error) {
                    console.error('查询失败: ' + error.message);
                });
        });
    }
}
var index = -1;
function doNext() {
    index++;
    if (index < words.length) {
        getWord(words[index]);
    }else{
        console.log("finish");
    }
}
// fillArray();
doGetWord("晓");
