var names = new Array()
var scoreDataBase = openDatabase("score", "1.0", "姓名评分", 1024 * 1024, function () {
});
var nameDataBase = openDatabase("names", "1.0", "起名", 1024 * 1024, function () {
});
var errNameDataBase = openDatabase("errName", "1.0", "笔画错误", 1024 * 1024, function () {
});

function r(min, max) {
    return Math.floor(min + Math.random() * (max - min));
}
function getRandomIp() {
    return r(1, 255) + "." + r(1, 255) + "." + r(1, 255) + "." + r(1, 255);
}
function httpRequest(url, name, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    //伪造ip的属性
    var fakeIP = getRandomIp();
    xhr.setRequestHeader("X-Forwarded-For", fakeIP);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            callback(xhr.responseText);
        }
    }
    var params = "xing=刘&ming=" + name + "&nian=2016&yue=12&ri=15&hh=0&mm=0&submit=立即测算";
//Send the proper header information along with the request
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    // xhr.setRequestHeader("Content-length", params.length);
    // xhr.setRequestHeader("Connection", "close");
    xhr.send(params);
}

function save(name, score) {

    if (!scoreDataBase) {
        console.error("数据库创建失败！");
    } else {
        scoreDataBase.transaction(function (tx) {
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS score (name TEXT UNIQUE,total_three TEXT,total_five TEXT,score INTEGER)",
                [],
                function (tx, result) {
                    tx.executeSql(
                        "INSERT INTO score (name,total_three,total_five,score) VALUES(?,?,?,?)",
                        [name.name, name.total_three, name.total_five, score],
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
function saveErrName(name, midStork, lastStork, score) {
    if (!errNameDataBase) {
        console.error("数据库创建失败！");
        doNext();
    } else {
        errNameDataBase.transaction(function (tx) {
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS err_name (name TEXT UNIQUE,mid_stork INTEGER,last_stork INTEGER,net_mid_stork INTEGER,net_last_stork INTEGER,score INTEGER)",
                [],
                function (tx, result) {
                    tx.executeSql(
                        "INSERT INTO err_name (name,mid_stork,last_stork,net_mid_stork,net_last_stork,score) VALUES(?,?,?,?,?,?)",
                        [name.name, name.mid_stork, name.last_stork, midStork, lastStork, score],
                        function () {
                            // alert('添加数据成功');
                            doNext();
                        },
                        function (tx, error) {
                            console.error('插入err_name表失败:' + error.message);
                            doNext();
                        });
                },
                function (tx, error) {
                    console.error('创建err_name表失败:' + error.message);
                    doNext();
                });
        });
    }
}
function getStork(name, html) {
    var start = html.indexOf('class="new2">'+name+'</td>');
    var tmp = html.substring(start +155, start + 172);
    var stork = tmp.substring(0, tmp.indexOf("</td>"));
    console.log(stork);
    return stork;
}
function getScore(htmlStr) {
    var start = htmlStr.indexOf('"pf"') + 5;
    var end = start + 10;
    var tmp = htmlStr.substring(start, end);
    end = start + tmp.indexOf("分");
    return htmlStr.substring(start, end);
}
function doGetNameScore(name) {
    var nameStr = name.name;
    httpRequest('http://ceming.yw11.com/ceming.asp', nameStr, function (htmlStr) {
        var midStork = getStork(nameStr.substring(0, 1), htmlStr);
        var lastStork = getStork(nameStr.substring(1), htmlStr);
        var score = getScore(htmlStr);
        document.getElementById('ip_div').innerText = "刘" + nameStr + score;
        if (midStork == name.mid_stork && lastStork == name.last_stork) {
            save(name, score);
        } else {
            saveErrName(name, midStork, lastStork, score);
        }
    });
}
function getNameScore(name) {


    if (!scoreDataBase) {
        doGetNameScore(name);
    } else {
        scoreDataBase.transaction(function (tx) {
            tx.executeSql(
                "SELECT * FROM score WHERE name='" + name + "';",
                [],
                function (tx, result) {
                    if (result.rows.length > 0) {
                        doNext();
                    } else {
                        doGetNameScore(name);
                    }
                },
                function (tx, error) {
                    console.error('查询score表失败:' + error.message);
                    doGetNameScore(name);
                });
        });
    }
}
function handleNames(rows) {
    console.log("handleNames");
    for (var i = 0; i < rows.length; i++) {
        var item = rows[i];
        var name = {
            name: item.name,
            total_three: item.total_three,
            total_five: item.total_five,
            mid_stork: item.mid_stork,
            last_stork: item.last_stork
        };
        names[i] = name;
    }
    console.log(names);
    doNext();
}
function getNames() {

    if (!nameDataBase) {
        console.error("数据库创建失败！");
    } else {
        nameDataBase.transaction(function (tx) {
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS name (name TEXT UNIQUE,total_three TEXT,total_five TEXT,mid_stork INTEGER,last_stork INTEGER)",
                [],
                function (tx, result) {
                    console.log("create success");
                    tx.executeSql(
                        "SELECT * FROM name", [],
                        function (tx, result) {
                            console.log("select success");
                            if (result.rows.length > 0) {
                                handleNames(result.rows);
                                return
                            }

                        },
                        function (tx, error) {
                            console.error('查询失败: ' + error.message);
                        });
                },
                function (tx, error) {
                    console.error('创建name表失败:' + error.message);
                });
        });
    }
}
var index = -1;
function doNext() {
    index++;
    if (index < names.length) {
        getNameScore(names[index]);
    }
}
getNames();
