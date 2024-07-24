console.log("GangbangParse.js 加载 2")

String.prototype.replaceAll = function(s1,s2){
    return this.replace(new RegExp(s1,"gm"),s2);
}

//钢棒二维码解析
var GangbangParse = {

    errMsg: false,
    uploadBean: null,


    getCompanys: function () {
        let a = ["", this.xianggang, this.jigang, this.yegang, this.xinxing];
        return a;
    },
    
    parse: function (qrcodeStr) {
        qrcodeStr = qrcodeStr.trim();
        qrcodeStr = qrcodeStr.replaceAll("<br />", " ");
        qrcodeStr = qrcodeStr.replaceAll("\n", " ");
        qrcodeStr = qrcodeStr.replaceAll("smq750_", "");  //去除PDA扫描枪前缀
        qrcodeStr = qrcodeStr.replaceAll("\"", "");
        qrcodeStr = qrcodeStr.replaceAll("\'", "");
        
        this.uploadBean = {};
        if (this.yegangParse(qrcodeStr) 
                || this.jigangParse(qrcodeStr) 
                || this.xianggangParse(qrcodeStr)
                || this.xinxingParse(qrcodeStr)
                || this.dongteParse(qrcodeStr)
                || this.changqiangParse(qrcodeStr))
            return this.uploadBean;
        return false;
    },

    parseBundleNo: function (qrcodeStr) {
        if  (this.parse(qrcodeStr)) {
            return this.uploadBean.bundleNo;
        }
        return false;
    },

    yegangParse: function (qrcodeStr){
        let company = "大冶特殊钢有限公司";

        if (!qrcodeStr.endsWith(company)) {
            return false;
        }
        let matchKeys = [["合同号", "contractNo"],
            ["牌号", "steelGrade"],
            ["规格", "diaSize"],
            ["标准", "standardNo"],
            ["卡片号", "bundleNo"],
            ["炉号", "heatNo"],
            ["捆号", "bundleIdx"],
            ["支数", "bundleNum"],
            ["重量", "weight"],
            ["日期", "productDate"],
        ];

        let kvStringArray = qrcodeStr.split(",");
        let kv;
        let kvString;

        lbl1:
            for (let j = 0; j < kvStringArray.length; j++) {
                kvString = kvStringArray[j];
                kv = kvString.split(":");
                for (let i = 0; i < matchKeys.length; i++) {
                    if (kv[0] == matchKeys[i][0]) {
                        this.uploadBean[matchKeys[i][1]] = kv[1];
                        continue lbl1;
                    }
                }
            }
        this.uploadBean.bundleNo = this.uploadBean.bundleNo +
            "/" + this.uploadBean.bundleIdx +
            "/" + this.uploadBean.bundleNum;

        let dia_lenth = this.uploadBean.diaSize.split("×");
        this.uploadBean.diaSize = dia_lenth[0];
        this.uploadBean.length = dia_lenth[1];

        if (this.uploadBean.steelGrade.length < 3)
            this.uploadBean.steelGrade = "C" + this.uploadBean.steelGrade;
        this.uploadBean.diaSize = this.uploadBean.diaSize.slice(1);
        this.uploadBean.company = "大冶特钢";
        return this.uploadBean;
    },

    jigangParse: function (qrcodeStr){
        qrcodeStr = qrcodeStr.replaceAll("-.-", "-").replace("BL", "");
        if (qrcodeStr.startsWith("D")) {
            let strs = qrcodeStr.split("-");
            if (12 != strs[0].length ) {
                return false;
            }
    
            this.uploadBean.company = "济源钢铁";
            this.uploadBean.bundleNo = strs[0];
            this.uploadBean.heatNo = strs[0].replace("D","V").slice(0, -3);
            if (strs[1].length < 3) {
                strs[1] = "C" + strs[1];
            }
            this.uploadBean.steelGrade = strs[1];
            this.uploadBean.diaSize = strs[2].substring(1);
            this.uploadBean.weight = strs[3];
            this.uploadBean.productDate = strs[4].slice(0, 4) + "-" + strs[4].slice(4, 6)  + "-" + strs[4].slice(6) ;
    
            return this.uploadBean;
        }

        if (qrcodeStr.startsWith("公司:济源钢铁")) {
            let matchKeys = [
                ["公司", "company"],
                ["钢种", "steelGrade"],
                ["规格", "diaSize"],
                ["标准", "standardNo"],
                ["合同号", "contractNo"],
                ["炉号", "heatNo"],
                ["捆号", "bundleNo"],
                ["支数", "bundleNum"],
                ["重量", "weight"],
                ["生产日期", "productDate"],
            ];

            let kvStringArray = qrcodeStr.split(" ");
            let kv;
            let kvString;

            lbl1:
                for (let j = 0; j < kvStringArray.length; j++) {
                    kvString = kvStringArray[j];
                    kv = kvString.split(":");
                    for (let i = 0; i < matchKeys.length; i++) {
                        if (kv[0] == matchKeys[i][0]) {
                            this.uploadBean[matchKeys[i][1]] = kv[1];
                            continue lbl1;
                        }
                    }
                }

            // console.log('uploadBean', this.uploadBean);

            if (this.uploadBean.diaSize) {
                let dia_length = this.uploadBean.diaSize.split("*");
                this.uploadBean.diaSize = dia_length[0];
                this.uploadBean.length = dia_length[1];
            }

            this.uploadBean.steelGrade = this.uploadBean.steelGrade.split("-")[0];
            if (this.uploadBean.steelGrade.length < 3)
                this.uploadBean.steelGrade = "C" + this.uploadBean.steelGrade;
            this.uploadBean.diaSize = this.uploadBean.diaSize.slice(1);
            // this.uploadBean.company = "";
            return this.uploadBean;
        }
        return false

    },

    xianggangParse: function (qrcodeStr){
        if (!qrcodeStr.startsWith("湖南华菱")) {
            return false;
        }
        qrcodeStr = qrcodeStr.replaceAll("\\(L\\)", "");
        qrcodeStr = qrcodeStr.replaceAll("，", " ");

        let matchKeys = ["湖南华菱", "产品名称", "牌号", "技术标准", "材料号", "规格(Φ)", "定尺长度", "支数", "重量",
            "炉号", "许可证", "合同号", "制造厂", "生产日期"];
        let keys = ["company", "productName", "steelGrade", "standardNo", "bundleNo", "diaSize", "length", "bundleNum", "weight",
            "heatNo", "prodLisence", "contractNo", "factory", "productDate"];
        let indx = [];
        for (let i = 1; i < matchKeys.length; i++) {
            indx[i] = qrcodeStr.indexOf(matchKeys[i]);
        }
        this.uploadBean.company = "华菱湘钢";

        let nextIndex;
        for (let i = 1; i < keys.length - 1; i++) {
            if (indx[i] != -1) {
                if (i == keys.length) {
                    nextIndex = null;
                } else if (indx[i + 1] != -1) {
                    nextIndex = indx[i + 1];
                } else {
                    nextIndex = indx[i + 2];
                }
                this.uploadBean[keys[i]] = qrcodeStr.slice(indx[i] + matchKeys[i].length + 1, nextIndex)
            }
        }
        this.uploadBean[keys[keys.length - 1]] = qrcodeStr.slice(indx[keys.length -1] + matchKeys[keys.length - 1].length + 1);

        this.uploadBean.bundleIdx = this.uploadBean.bundleNo.split("/")[1];
        if (!isNaN(Number(this.uploadBean.steelGrade))) {
            this.uploadBean.steelGrade = this.uploadBean.steelGrade.trim() + "H";
        }
        return this.uploadBean;
    },
    
    // http://abc.whxxzg.com:8327?p=24602010&k=25&w=3385&sp=2460201001&g=Φ95mm*6m&s=40Cr&a=xxzg
    xinxingParse: function (qrcodeStr){
        let company = "新兴铸构";
        let identifier = "http://abc.whxxzg"
        if (!qrcodeStr.startsWith(identifier)) {
            return false;
        }
        qrcodeStr = qrcodeStr.replaceAll("http.*\\?", "");
        
        let matchKeys = [
            ["s", "steelGrade"],
            ["g", "diaSize"],
            ["p", "bundleNo"],
            // ["炉号", "heatNo"], no
            ["k", "bundleIdx"],
            // ["支数", "bundleNum"], no
            ["w", "weight"],
            ["a", "company"],
            ["sp", "sp"],
        ];

        let kvStringArray = qrcodeStr.split("&");
        let kv;
        let kvString;

        lbl1:
            for (let j = 0; j < kvStringArray.length; j++) {
                kvString = kvStringArray[j];
                kv = kvString.split("=");
                for (let i = 0; i < matchKeys.length; i++) {
                    if (kv[0] == matchKeys[i][0]) {
                        this.uploadBean[matchKeys[i][1]] = kv[1];
                        continue lbl1;
                    }
                }
            }
        this.uploadBean.bundleNo = this.uploadBean.bundleNo + "/" + this.uploadBean.bundleIdx;

        if (this.uploadBean.diaSize) {
            let dia_length = this.uploadBean.diaSize.split("*");
            this.uploadBean.diaSize = dia_length[0];
            this.uploadBean.length = parseInt(dia_length[1]) * 1000 ;
        }

        if (this.uploadBean.steelGrade.length < 3)
            this.uploadBean.steelGrade = "C" + this.uploadBean.steelGrade;
        this.uploadBean.diaSize = this.uploadBean.diaSize.slice(1);
        this.uploadBean.company = company;
        return this.uploadBean;
    },

    dongteParse: function (qrcodeStr){
        let company = "东方特钢";
        // let identifier = "代码:0104030071"
        let identifier = "代码:0104"
        if (!qrcodeStr.startsWith(identifier)) {
            return false;
        }
        
        let matchKeys = [
            ["名称", "steelGrade"],
            ["规格", "diaSizeLength"],
            ["重量", "weight"],
            ["炉号", "heatNo"],
            ["轧制批号", "bundleNo"],
            ["二维码", "qrcode"],
            ["代码", "companyCode"],
        ];

        let kvStringArray = qrcodeStr.split(";");
        let kv;
        let kvString;

        lbl1:
            for (let j = 0; j < kvStringArray.length; j++) {
                kvString = kvStringArray[j];
                kv = kvString.split(":");
                for (let i = 0; i < matchKeys.length; i++) {
                    if (kv[0] == matchKeys[i][0]) {
                        this.uploadBean[matchKeys[i][1]] = kv[1];
                        continue lbl1;
                    }
                }
            }
        this.uploadBean.bundleNo = this.uploadBean.bundleNo + "-" + this.uploadBean.qrcode;
        let dia_length = this.uploadBean.diaSizeLength.split("*");
        this.uploadBean.diaSize = dia_length[0].slice(1);
        this.uploadBean.length = dia_length[1] || "";
        this.uploadBean.steelGrade = this.uploadBean.steelGrade.replaceAll("圆钢", "").trim();
        // this.uploadBean.steelGrade = "C" + this.uploadBean.steelGrade;
        this.uploadBean.company = company;
        console.log("bean", this.uploadBean)
        return this.uploadBean;
    },

    
    changqiangParse: function (qrcodeStr){
        // "13,24-06-1567,5,105894,40Cr,Φ90,24-208611,4092,9"
        let company = "长强钢铁";
        // let identifier = "代码:0104030071"
        let identifier = "13,"
        if (!qrcodeStr.startsWith(identifier)) {
            return false;
        }
        
        let data_ls = qrcodeStr.split(",");
        this.uploadBean.qrcode = qrcodeStr;
        this.uploadBean.productName = "热轧圆钢";
        this.uploadBean.diaSize = data_ls[5].substring(1);
        this.uploadBean.steelGrade = data_ls[4];
        if (this.uploadBean.steelGrade.length < 3)
            this.uploadBean.steelGrade = "C" + this.uploadBean.steelGrade;
        this.uploadBean.heatNo = data_ls[6]
        this.uploadBean.bundleNo = data_ls[1] + "/" + data_ls[2];
        this.uploadBean.bundleIdx = data_ls[2];
        this.uploadBean.bundleNum = data_ls[8];
        this.uploadBean.weight = data_ls[7];
        this.uploadBean.contractNo = data_ls[3];
        this.uploadBean.company = company;
        this.uploadBean.productdate = data_ls[1].substring(0, 8);
        // 标签上没有，自动计算长度， 相应的减少一点长度，暂定减少20mm
        let t_length = bbl.utils.raw_weight_to_length(this.uploadBean.weight, this.uploadBean.diaSize) 
        this.uploadBean.length = t_length / cint(this.uploadBean.bundleNum) - 20;
        // console.log("bean", this.uploadBean)
        return this.uploadBean;
    },
};


