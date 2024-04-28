//增加{}变量格式字符串功能；
String.prototype.format = function(){
    if(arguments.length==0){
        return this;
    }
    for(var s=this, i=0; i<arguments.length; i++){
        s = s.replace(new RegExp("\\{"+i+"\\}","g"), arguments[i]);
    }
    return s;
};

function displayAppendInfoVO(vo) {
    let str = "<div>\n" +
        "    <h3 style=\"color: red\">操作成功</h3>\n" +
        "    <div>{0}</div>\n" +
        "    <div>{1}</div>\n" +
        "    <div>{2}</div>\n" +
        "</div>\n";
    return str;
}


String.prototype.replaceAll = function(s1,s2){
    return this.replace(new RegExp(s1,"gm"),s2);
}

Date.prototype.format = function(fmt) {
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt)) {
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    }
    for(var k in o) {
        if(new RegExp("("+ k +")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }
    return fmt;
}


function humpToUnderline(str) {
    return str.replace(/([A-Z])/g, "_$1").toLowerCase()
}

function underlineToHump(str) {
    let a = str.split("_");
    let re = a[0];
    for (let i = 1; i < a.length; i++) {
        re = re + a[i].slice(0, 1).toUpperCase() + a[i].slice(1);
    }
    return re;
}


function dj(obj) {
    dJson(obj);
}
function dJson(obj) {
    disp(JSON.stringify(obj));
}
var msgIndx = 0
function disp(__msg) {
    console.log(getVarNameStr({__msg}) + ": " + msgIndx++);
    console.log(__msg);
}
function getVarNameStr(v){
    return Object.keys(v)[0];
}


function alertJson(jsonObj) {
    alert(jsonToPrettyStr(jsonObj));
}

function jsonToPrettyStr(jsonObj) {
    return JSON.stringify(jsonObj)
        .replaceAll(',', '\n')
        .replaceAll('{', '')
        .replaceAll('}', '')
        .replaceAll('\\"', '')
        .replaceAll('"', ' ');
}

function jsonToPrettyStrBr(jsonObj) {
    return JSON.stringify(jsonObj)
        .replaceAll(',', '<br\>')
        .replaceAll('{', '')
        .replaceAll('}', '')
        .replaceAll('\\"', '')
        .replaceAll('"', ' ');
}

function debugDisp(msg) {
    // alert("debug: " + msg);
    console.log("debug: " + msg);
}

function deleteElement(elem) {
    elem.parentNode.removeChild(elem);
}

function getAutoComplete(url, $ui, okfunc) {
    // d("into getAutoComplete");
    $.get(url, $ui.data("completeData"),
        function (data) {
            // d("Complete", $ui);
            $ui.autocomplete({
                minLength: 0,
                source: data,
/*                select: function () {
                    $(this).val(" ");
                    $(this).change();
                }*/
                close: function () {
                    $(this).change();
                }
            }).focus(function () {
                $(this).autocomplete("search");
            });
            okfunc();
        });
}

function getAutoCompleteUseObj(url, $ui, sendData, okCallback) {
    // d("into getAutoCompleteUseObj");
    $.get(
        url,
        sendData,
        function (retData) {
            $ui.autocomplete({
                minLength: 0,
                source: retData,
                close: function () {
                    $(this).change();
                }
            }).focus(function () {
                $(this).autocomplete("search");
            });
            okCallback();
        });
}

function getAutoCompleteSetArray($ui, data) {
    $ui.autocomplete({
        minLength: 0,
        source: data,
        close: function () {
            $(this).change();
        }
    }).focus(function () {
        $(this).autocomplete("search");
    });
}

function autoCompleteClear($ui) {
    $ui.autocomplete({
        minLength: 0,
        source: [],
        close: function () {
            $(this).val();
        }
    }).focus(function () {
        $(this).autocomplete("search");
    });
}

//自动查找host功能
// let urlAC = "/";
let urlAC = "/pmc/getcompletedate";
let host = "";
let hosts = [
    "",
    "http://192.168.1.118:8080",
    "http://localhost:8080",
    "http://192.168.1.180:8080",
];
let hostIdx = -1;
let connectHostFlag = false;
function getHost() {
    hostIdx++;
    if (hostIdx == hosts.length) {
        weui.toast("没有连接到host");
        return;
    }
    host = hosts[hostIdx];
    $.ajax({
        url: host + "/",
        type: "GET",
        timeout: 500,
        success: function () {
            console.log("get host is: " + host);
            connectHostFlag = true;
            // $("input").change();
        },
        error: function () {
            getHost();
        }
    })
}
function reGetHost() {
    hostIdx = -1;
    connectHostFlag = false;
    getHost();
}
function getHostAndRun(fn) {
    d("into run");
    setTimeout(function() {
        if (connectHostFlag) {
            fn();
        } else {
            getHostAndRun(fn);
        }
    }, 1000);
}
