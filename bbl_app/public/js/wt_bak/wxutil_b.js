// import wx from 'jweixin-1.3.2'

var jsapiConfig = {
    // debug: true,
    beta: true,
    appId: 'ww1df57ac3c7822d4b',
    timestamp: 0,
    nonceStr: '0',
    signature: '0',
    jsApiList: [
        'checkJsApi',
        'scanQRCode'
    ]
};

function setWxConfig(config) {
    // console.log("jsapiconfig", config);
    jsapiConfig.appId = config.app_id;
    jsapiConfig.timestamp = config.timestamp;
    jsapiConfig.nonceStr = config.nonce_str;
    jsapiConfig.signature = config.signature;
}

function getWxConfig() {
    $.ajax({
        type: "GET",
        url: "/wx/jsapi",
        dataType: "json",
        timeout: 3000,
        error: function(request) {
            // alert("请在企业微信内打开APP");
        },
        success: function(result) {
            setWxConfig(result);
            wx.config(jsapiConfig);
        }
    });
}

let data = {}
wx.config({
    beta: true,
    debug: false,
    appId: data.corpId,
    timestamp: data.timestamp,
    nonceStr: data.nonceStr,
    signature: data.signature,
    jsApiList: ["chooseImage", "invoke"]
});

wx.ready(function () {
    wx.checkJsApi({
        jsApiList: ["invoke", "scanQRCode"],
        success: function (ress) {
            // 以键值对的形式返回，可用的api值true，不可用为false
            // {"checkResult": {"chooseImage": true}, "errMsg": "checkJsApi:ok"}
        }
    })
});

wx.error(function (res) {
    console.log("错误:" + JSON.stringify(res));
});

function scanCode() {
    wx.ready(() => {
        wx.checkJsApi({
            jsApiList: ["invoke", "scanQRCode"],
            success: res => {
                // 以键值对的形式返回，可用的api值true，不可用为false
                // {"checkResult": {"chooseImage": true}, "errMsg": "checkJsApi:ok"}
            }
        });
        vx.invoke("enterpriseVerify", {}, res => {
            alert(JSON.stringify(res));
        })
        wx.scanQRCode({
            desc: "scanQRCode desc",
            needResult: 1,
            scanType: ["qrCode"],
            success: res => {
                let data = JSON.parse(res.resultStr);
                //process data ();
            },
            error: res => {
                if (res.errMsg.indexOf("function_not_exist") > 0) {
                    alert("版本过低");
                }
            }
        });
    });
}

String.prototype.replaceAll = function(s1,s2){
    return this.replace(new RegExp(s1,"gm"),s2);
}

function alertJson(jsonObj) {
    alert(jsonToPrettyStr(jsonObj));
}

function jsonToPrettyStr(jsonObj) {
    return JSON.stringify(jsonObj)
        .replaceAll(',', '\n')
        .replaceAll('{', '')
        .replaceAll('"', ' ');
}
