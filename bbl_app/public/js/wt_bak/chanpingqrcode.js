
String.prototype.replaceAll = function(s1,s2){
    return this.replace(new RegExp(s1,"gm"),s2);
}


function splitDateStr(dateStr) {
    return "20" + dateStr.substring(0, 2) +
            "-" + dateStr.substring(2, 4) +
            "-" + dateStr.substring(4, 6);
}



//湘钢parse
var cpQrcode = {

    decodeFlag: false,
    errMsg: null,
    uploadBean: null,
    // dongfengdena0: "X1250*30JS09A-01011*20201008*QZ0022010080001*0RHAGNW3",
    // dongfengdena1: "X1250*30N-01011-B***QZ0022104281112*1**233AGRFF",
    // dongfengdena2: "X1250*30N-01011-B***QZ0022104281146*1**233AGMDY",
    // shanxihande0: "652253611802130001",
    // shanxihande1: "652517402105216875",
    // shanxihande2: "652254092105290090",
    // zhongqi0: "0687222850210606300530",
    // zhongqi1: "0680296150201224300010",
    // zhongqi2: "0680296150210604300550",
    // // companys: ["", this.xianggang, this.jigang1, this.yegang],
    //
    // getCompanys: function () {
    //     return ["", this.dongfengdena0, this.dongfengdena1, this.dongfengdena2,
    //         this.shanxihande0, this.shanxihande1, this.shanxihande2,
    //         this.zhongqi0, this.zhongqi1, this.zhongqi2];
    // },

    parse: function (qrcodeStr) {
        qrcodeStr = qrcodeStr.trim();
        this.decodeFlag = false;
        this.uploadBean = null;
        this.errMsg = "";

        if (this.isDena(qrcodeStr)) {
            this.parseDena(qrcodeStr);
        } else if (this.isHande(qrcodeStr)) {
            this.parseHande(qrcodeStr);
        } else if (this.isZhongqi(qrcodeStr)) {
            this.parseZhongqi(qrcodeStr);
        } else {
            this.errMsg = "*未识别到产品厂家";
        }
        return this.uploadBean;
    },

    check: function (qrcodeStr) {
        qrcodeStr = qrcodeStr.trim();
        if (this.isDena(qrcodeStr) || this.isHande(qrcodeStr) || this.isZhongqi(qrcodeStr))
            return true;
        return false;
    },



    isDena: function (qrcodeStr) {
        if (qrcodeStr.startsWith("X1250")) {
            return true;
        }
        return false;
    },
    isHande: function (qrcodeStr) {
        if (qrcodeStr.startsWith("652")) {
            return true;
        }
        return false;
    },
    isZhongqi: function (qrcodeStr) {
        if (qrcodeStr.startsWith("068")) {
            return true;
        }
        return false;
    },



    validateDena: function (qrcodeStr) {
        let strs = qrcodeStr.split("\*");
        let batchCodeMatch = qrcodeStr.match("QZ\\d*");

        if ((!batchCodeMatch) || batchCodeMatch[0].length != 15) {
            this.errMsg += "/生产批次号错误";
            return false;
        }
        // if (strs.length != 5) {
        //     this.errMsg += "/数据分段错误";
        //     return false;
        // }
        let dateStr = splitDateStr(batchCodeMatch[0].substring(5, 5 + 6));
        if (!Date.parse(dateStr)) {
            this.errMsg += "/日期错误";
            return false;
        }
        return true;
    },

    validateHande: function (qrcodeStr) {
        if (qrcodeStr.length != 18) {
            this.errMsg += "/位数错误";
            return false;
        }
        let s = qrcodeStr.match("652\\d*");
        if (s[0].length != 18) {
            this.errMsg += "/字母错误";
            return false;
        }
        let dateStr = splitDateStr(qrcodeStr.substring(8, 8 + 6));
        if (!Date.parse(dateStr)) {
            this.errMsg += "/日期错误";
            return false;
        }
        return true;
    },

    validateZhongqi: function (qrcodeStr) {
        if (qrcodeStr.length != 22) {
            this.errMsg += "/位数错误";
            return false;
        }
        let s = qrcodeStr.match("068\\d*");
        if (s[0].length != 22) {
            this.errMsg += "/字母错误";
            return false;
        }
        let dateStr = splitDateStr(qrcodeStr.substring(10, 10 + 6));
        if (!Date.parse(dateStr)) {
            this.errMsg += "/日期错误";
            return false;
        }
        return true;

    },


    parseDena: function (qrcodeStr){
        let company = "东风德纳";
        this.errMsg = "";
        this.uploadBean = {};
        if (!this.isDena(qrcodeStr)) {
            this.errMsg = "*识别厂家失败";
            return false;
        }
        this.errMsg = company;
        if (!this.validateDena(qrcodeStr)) {
            this.errMsg += "/*二维码验证错误";
            return false;
        }
        let strs = qrcodeStr.split("\*");
        strs = strs.filter(function (str) {
            return str !== "";
        });
        let batchCode = qrcodeStr.match("QZ\\d*")[0];

        this.decodeFlag = true;
        this.errMsg += "/二维码验证成功"
        this.uploadBean.company = company;
        this.uploadBean.productCode = 'C' + strs[1];        //图号
        this.uploadBean.forgeBatch = batchCode.substring(0, 11);  //生产批次号
        this.uploadBean.codeDate = splitDateStr(batchCode.substring(5, 5 + 6));
        this.uploadBean.flowId = batchCode.substring(11);
        return this.uploadBean;
    },

    parseHande: function (qrcodeStr) {
        let company = "陕西汉德"
        this.errMsg = "";
        this.uploadBean = {};
        if (!this.isHande(qrcodeStr)) {
            this.errMsg = "*识别厂家失败";
            return false;
        }
        this.errMsg = company;
        if (!this.validateHande(qrcodeStr)) {
            this.errMsg += "/*二维码验证错误";
            return false;
        }
        this.decodeFlag = true;
        this.errMsg += "/二维码验证成功"
        this.uploadBean.company = company;
        this.uploadBean.productCode = qrcodeStr.substring(3, 3 + 5);
        this.uploadBean.forgeBatch = qrcodeStr.substring(8, 8 + 6);
        this.uploadBean.codeDate = splitDateStr(qrcodeStr.substring(8, 8 + 6));
        this.uploadBean.flowId = qrcodeStr.substring(14)
        return this.uploadBean;
    },

    parseZhongqi: function (qrcodeStr) {
        let company = "重汽";
        this.errMsg = "";
        this.uploadBean = {};
        if (!this.isZhongqi(qrcodeStr)) {
            this.errMsg = "*识别厂家失败";
            return false;
        }
        this.errMsg = company;
        if (!this.validateZhongqi(qrcodeStr)) {
            this.errMsg += "/*二维码验证错误";
            return false;
        }
        this.decodeFlag = true;
        this.errMsg += "/二维码验证成功"
        this.uploadBean.company = company;
        this.uploadBean.productCode = qrcodeStr.substring(3, 3 + 6);
        this.uploadBean.forgeBatch = "";
        this.uploadBean.codeDate = splitDateStr(qrcodeStr.substring(10, 10 + 6));
        this.uploadBean.flowId = qrcodeStr.substring(17, 17 + 4);
        return this.uploadBean;
    },

};
