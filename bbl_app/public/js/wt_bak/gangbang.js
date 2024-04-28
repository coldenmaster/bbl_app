
String.prototype.replaceAll = function(s1,s2){
    return this.replace(new RegExp(s1,"gm"),s2);
}

function jsonToPrettyStr(jsonObj) {
    return JSON.stringify(jsonObj)
        .replaceAll(',', '\n')
        .replaceAll('{', '')
        .replaceAll('}', '')
        .replaceAll('\\"', '')
        .replaceAll('"', ' ');
}


var GangbangCalc = {
    density: 7.9,
    calcWeight: function (diameter, longSize, bundleNum, density) {
        let area = Math.PI * Math.pow( diameter / 2, 2);
        let weight = longSize * area * density / 1000 / 1000;
        return weight * bundleNum;
    },
    calcLong: function (diameter, weight, bundleNum, density) {
        let area = Math.PI * Math.pow( diameter / 2, 2);
        let longSize = weight * 1000 * 1000 / density / area;
        return longSize / bundleNum;
    },
    calcDiameter: function (longSize, weight, bundleNum, density) {
        let area = weight / longSize /bundleNum / density * 1000 * 1000;
        let diameter = Math.sqrt(area / Math.PI) * 2;
        // console.log("weight", weight);
        return diameter.toFixed(3);
    },
    calcKgPerMm: function (weight, longSize, num) {
        return weight / longSize / num;
    },
    calcMmToWeight: function (longSize, num, kgPmm) {
        return longSize * num * kgPmm;
    },
    calcWeightPercent: function (weight, longSize, num, diameter, density) {
        let calcWeight = this.calcWeight(diameter, longSize, num, density);
        let percent = (weight - calcWeight) / calcWeight * 100;
        return percent.toFixed(2);
    }
}


// function appendDataList(jqdatalist, txt) {
//     // $("#productLong").append('<option label="'+city.label+'" value="'+city.value+'"></option>');
//     jqdatalist.append('<option>' + text + '</option>');
// }


//湘钢parse
var GangbangParse = {

    errMsg: false,
    uploadBean: null,
    xianggang: "湖南华菱湘潭钢铁有限公司（XISC）产品名称：优质碳素结构钢牌号:C50技术标准:XYXB2013-018材料号:B22110560A002/002规格(Φ):110mm定尺长度:6460mm重量:2438Kg炉号:20712178许可证:合同号:制造厂:棒材厂生产日期:2021-01-20",
    // xianggang2: "湖南华菱湘潭钢铁有限公司（XISC）产品名称：优质碳素结构钢牌号:C50技术标准:XYXB2013-018材料号:B22140980/020规格(Φ):150mm重量:2870Kg炉号:21804451许可证:合同号:制造厂:棒材厂生产日期:2021-04-30",
    jigang2: "D22103908022-BL42CrMoA-1-Φ150mm-2790kg-20210509",
    jigang:  "D22101561026-BL42CrMoA-2-Φ130mm-3460kg-20210302",
    // jigang3: "D22103682009-50-1-Φ150mm-3704kg-20210507",
    // jigang4: "D22103791022-SC40Cr-Φ150mm-3586kg-20210508",
    yegang: "合同号:G142102001(1708293),牌号:50,规格:Φ150mm,标准:XYGN1415-2015,卡片号:H721073140,炉号:1015098Z,捆号:2,支数:3,重量:2888kg,日期:2021-05-12,公司:大冶特殊钢有限公司",
    // gang3: "19604764-3 B328820 3832",
    // gang4: "",
    xinxing: "",

    getCompanys: function () {
        let a = ["", this.xianggang, this.jigang, this.yegang, this.xinxing];
        return a;
    },
    parse: function (qrcodeStr) {
        qrcodeStr = qrcodeStr.trim();
        this.uploadBean = {};
        // this.uploadBean.qrCode = qrcodeStr;
        if (this.yegangParse(qrcodeStr) || this.jigangParse(qrcodeStr) || this.xianggangParse(qrcodeStr))
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
        // this.uploadBean = new Object();
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
            // ["公司", "company"],
            // 其它几个需要的field
            ["直径", "diameter"],
            ["长度", "length"],
            ["直径", "diameter"],
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
            "/" + this.uploadBean.prodLicence;

        if (this.uploadBean.steelGrade.length < 3)
            this.uploadBean.steelGrade = "C" + this.uploadBean.steelGrade;
        this.uploadBean.diaSize = this.uploadBean.diaSize.slice(1);
        this.uploadBean.company = "大冶特钢";
        return this.uploadBean;
    },

    jigangParse: function (qrcodeStr){
        // this.uploadBean = new Object();
        if (!qrcodeStr.startsWith("D")) {
            return false;
        }
        qrcodeStr = qrcodeStr.replaceAll("-.-", "-").replace("BL", "");
        let strs = qrcodeStr.split("-");
        if (12 != strs[0].length ) {
            return false;
        }
        // ["D22103908022", "BL42CrMoA", "Φ150mm", "2790kg", "20210509"]

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
    },

    xianggangParse: function (qrcodeStr){
        // this.uploadBean = new Object();
        if (!qrcodeStr.startsWith("湖南华菱")) {
            return false;
        }
        let matchKeys = ["湖南华菱", "产品名称", "牌号", "技术标准", "材料号", "规格(Φ)", "定尺长度", "重量",
            "炉号", "许可证", "合同号", "制造厂", "生产日期"];
        let keys = ["company", "productName", "steelGrade", "standardNo", "bundleNo", "diaSize", "longSize", "weight",
            "heatNo", "prodLisence", "contractNo", "factory", "productDate"];
        let indx = [];
        for (let i = 1; i < matchKeys.length; i++) {
            indx[i] = qrcodeStr.indexOf(matchKeys[i]);
        }
        // this.uploadBean.company = qrcodeStr.substring(0, indx[1]);
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

        // alert(JSON.stringify(this.uploadBean));
        return this.uploadBean;
    }
};
