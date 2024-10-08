
// @file frappe-bench/apps/bbl_app/bbl_app/common/cp_qrcode.py 请给我讲一下这个文件有什么用

const customers = {
    'dena' :{"name": "东风德纳", "prefix": "X1250"},
    'hande': {"name": "陕汽汉德", "prefix": "652"},
    'zhongqi': {"name": "重汽", "prefix": "068"},
    'sanyi': {"name": "三一重工", "prefix": "SY"},
    'liuzhou_fangsheng': {"name": "柳州/苏州方盛", "prefix": "1710"},
    'hefei_fangsheng': {"name": "合肥方盛", "prefix": "7027"},
    'qingdao_haitong': {"name": "青岛海通", "prefix": "S0383"},
    'bbl': {"name": "百兰车轴", "prefix": "BBL"},
    'other': {"name": "", "prefix": ""}
};

bbl.CpQrcode = class CpQrcode {
    constructor(qrcodeStr) {
        this.qrcodeStr = qrcodeStr;
        this.decodeFlag = false;
        this.errMsg = null;
        this.uploadBean = {};
    }

    splitDateStr(dateStr) {
        if (dateStr.length === 6) {
            return "20" + dateStr.substring(0, 2) + "-" + dateStr.substring(2, 4) + "-" + dateStr.substring(4, 6);
        }
        return dateStr;
    }

    isDena() {
        return this.qrcodeStr.startsWith("X1250");
    }

    isHande() {
        return this.qrcodeStr.startsWith("652");
    }

    isZhongqi() {
        return this.qrcodeStr.startsWith("068");
    }

    getCompany() {
        if (this.isBbl()) {
            return customers.bbl.name;
        } else if (this.isDena()) {
            return customers.dena.name;
        } else if (this.isHande()) {
            return customers.hande.name;
        } else if (this.isZhongqi()) {
            return customers.zhongqi.name;
        } else if (this.isSanyi()) {
            return customers.sanyi.name;
        } else if (this.isLiuzhouFangsheng()) {
            return customers.liuzhou_fangsheng.name;
        } else if (this.isHefeiFangsheng()) {
            return customers.hefei_fangsheng.name;
        } else if (this.isQingdaoHaitong()) {
            return customers.qingdao_haitong.name;
        } else {
            return '未知客户';
        }
    }

    isValid() {
        return (
            this.isBbl() ||
            this.isDena() ||
            this.isHande() ||
            this.isZhongqi() ||
            this.isSanyi() ||
            this.isLiuzhouFangsheng() ||
            this.isHefeiFangsheng() ||
            this.isQingdaoHaitong()
        );
    }

    validateHande() {
        if (this.qrcodeStr.length !== 18) {
            this.errMsg += "/位数错误";
            return false;
        }

        const s = this.qrcodeStr.match(/^652\d*$/);
        if (!s || s[0].length !== 18) {
            this.errMsg += "/字母错误";
            return false;
        }

        const dateStr = this.splitDateStr(this.qrcodeStr.substring(8, 14));
        if (!Date.parse(dateStr)) {
            this.errMsg += "/日期错误";
            return false;
        }

        return true;
    }

    validateZhongqi() {
        if (this.qrcodeStr.length !== 22) {
            this.errMsg += "/位数错误";
            return false;
        }

        const s = this.qrcodeStr.match(/^068\d*$/);
        if (!s || s[0].length !== 22) {
            this.errMsg += "/字母错误";
            return false;
        }

        const dateStr = this.splitDateStr(this.qrcodeStr.substring(10, 16));
        if (!Date.parse(dateStr)) {
            this.errMsg += "/日期错误";
            return false;
        }

        return true;
    }

    isDena() {
        return this.qrcodeStr.toUpperCase().startsWith("X1250");
    }

    validateDena() {
        const qrcodeUpper = this.qrcodeStr.toUpperCase();
        const batchCodeMatch = qrcodeUpper.match(/QZ\d*/);
        if (!batchCodeMatch || batchCodeMatch[0].length !== 15) {
            console.log("生产批次号错误");
            return false;
        }
        const dateStr = this.splitDateStr(batchCodeMatch[0].substring(5, 11));
        if (!Date.parse(dateStr)) {
            console.log("日期错误");
            return false;
        }

        return true;
    }

    parseDena() {
        const company = customers.dena.name;
        if (!this.isDena()) {
            this.uploadBean.errMsg = `${company}:识别厂家失败`;
            return this.uploadBean;
        }

        if (!this.validateDena()) {
            this.uploadBean.errMsg = `${company}:二维码验证错误`;
            return this.uploadBean;
        }

        const strs = this.qrcodeStr.split("*").filter(str => str !== "");
        console.log(strs);
        const batchCode = this.qrcodeStr.match(/(qz|QZ)\d*/)[0];
        console.log(batchCode);

        this.decodeFlag = true;
        this.uploadBean.company = company;
        this.uploadBean.productCode = "C" + strs[1];
        this.uploadBean.drawingId = "C" + strs[1];
        this.uploadBean.forgeBatch = batchCode.substring(0, 11);
        this.uploadBean.codeDate = this.splitDateStr(batchCode.substring(5, 11));
        this.uploadBean.flowId = batchCode.substring(11);
        this.uploadBean.cusProductName = strs[1].split("-").pop();
        return this.uploadBean;
    }

    parseHande() {
        const company = customers.hande.name;
        if (!this.isHande()) {
            this.errMsg = "*识别厂家失败";
            return false;
        }

        this.errMsg = company;
        if (!this.validateHande()) {
            this.errMsg += "/*二维码验证错误";
            return false;
        }

        this.decodeFlag = true;
        this.errMsg += "/二维码验证成功";
        this.uploadBean.company = company;
        this.uploadBean.productCode = this.qrcodeStr.substring(3, 8);
        this.uploadBean.drawingId = this.qrcodeStr.substring(3, 8);
        this.uploadBean.forgeBatch = this.qrcodeStr.substring(8, 14);
        this.uploadBean.codeDate = this.splitDateStr(this.qrcodeStr.substring(8, 14));
        this.uploadBean.flowId = this.qrcodeStr.substring(14);
        return this.uploadBean;
    }

    parseZhongqi() {
        const company = customers.zhongqi.name;
        if (!this.isZhongqi()) {
            this.errMsg = "*识别厂家失败";
            return false;
        }

        this.errMsg = company;
        if (!this.validateZhongqi()) {
            this.errMsg += "/*二维码验证错误";
            return false;
        }

        this.decodeFlag = true;
        this.errMsg += "/二维码验证成功";
        this.uploadBean.company = company;
        this.uploadBean.productCode = this.qrcodeStr.substring(3, 9);
        this.uploadBean.drawingId = this.qrcodeStr.substring(3, 9);
        this.uploadBean.forgeBatch = "";
        this.uploadBean.codeDate = this.splitDateStr(this.qrcodeStr.substring(10, 16));
        this.uploadBean.flowId = this.qrcodeStr.substring(17, 21);
        return this.uploadBean;
    }

    isSanyi() {
        return this.qrcodeStr.startsWith("SY");
    }

    parseSanyi() {
        if (!this.isSanyi()) {
            this.errMsg = "*识别厂家失败";
            return false;
        }

        const company = customers.sanyi.name;
        this.errMsg = company;
        this.decodeFlag = true;
        this.errMsg += "/二维码验证成功";
        this.uploadBean.company = company;
        this.uploadBean.productCode = this.qrcodeStr.substring(8, 14);
        this.uploadBean.drawingId = this.qrcodeStr.substring(0, 8);
        this.uploadBean.codeDate = this.splitDateStr(this.qrcodeStr.substring(14, 20));
        this.uploadBean.flowId = this.qrcodeStr.substring(20);
        return this.uploadBean;
    }

    isLiuzhouFangsheng() {
        return this.qrcodeStr.startsWith("1710");
    }

    parseLiuzhouFangsheng() {
        if (!this.isLiuzhouFangsheng()) {
            this.errMsg = "*识别厂家失败";
            return false;
        }

        const company = customers.liuzhou_fangsheng.name;
        this.errMsg = company;
        this.decodeFlag = true;
        this.errMsg += "/二维码验证成功";
        this.uploadBean.company = company;
        this.uploadBean.productCode = this.qrcodeStr.substring(4, 13);
        this.uploadBean.drawingId = this.qrcodeStr.substring(4, 13);
        this.uploadBean.codeDate = this.splitDateStr(this.qrcodeStr.substring(18, 24));
        this.uploadBean.flowId = this.qrcodeStr.substring(24);
        return this.uploadBean;
    }

    isHefeiFangsheng() {
        return this.qrcodeStr.startsWith("7027");
    }

    parseHefeiFangsheng() {
        if (!this.isHefeiFangsheng()) {
            this.errMsg = "*识别厂家失败";
            return false;
        }

        const company = customers.hefei_fangsheng.name;
        this.errMsg = company;
        this.decodeFlag = true;
        this.errMsg += "/二维码验证成功";
        this.uploadBean.company = company;
        this.uploadBean.productCode = this.qrcodeStr.substring(4, 13);
        this.uploadBean.drawingId = this.qrcodeStr.substring(4, 13);
        this.uploadBean.codeDate = this.splitDateStr(this.qrcodeStr.substring(18, 24));
        this.uploadBean.flowId = this.qrcodeStr.substring(24);
        return this.uploadBean;
    }

    isQingdaoHaitong() {
        return this.qrcodeStr.startsWith(customers.qingdao_haitong.prefix);
    }

    parseQingdaoHaitong() {
        if (!this.isQingdaoHaitong()) {
            this.errMsg = "*识别厂家失败";
            return false;
        }

        const company = customers.qingdao_haitong.name;
        this.errMsg = company;
        this.decodeFlag = true;
        this.errMsg += "/二维码验证成功";
        this.uploadBean.company = company;
        this.uploadBean.productCode = this.qrcodeStr.substring(5, 15);
        this.uploadBean.drawingId = this.qrcodeStr.substring(5, 15);
        this.uploadBean.codeDate = this.splitDateStr(this.qrcodeStr.substring(15, 21));
        this.uploadBean.flowId = this.qrcodeStr.substring(21);
        return this.uploadBean;
    }

    isBbl() {
        const first5 = this.qrcodeStr.substring(0, 5).toUpperCase();
        if (first5.startsWith("BBL")) {
            return true;
        }
        if (this.qrcodeStr.length === 17 && this.qrcodeStr.substring(9, 12) === "202") {
            return true;
        }
        return false;
    }

    parseBbl() {
        const company = customers.bbl.name;
        if (!this.isBbl()) {
            this.errMsg = "*识别厂家失败";
            return false;
        }

        this.errMsg = company;
        let sep = '*';
        if (!this.qrcodeStr.includes(sep)) {
            sep = '-';
        }
        const strs = this.qrcodeStr.split(sep);
        if (strs.length < 4) {
            this.uploadBean.productCode = this.qrcodeStr.substring(0, 5);
            this.uploadBean.flowId = this.qrcodeStr.substring(13);
        } else {
            this.uploadBean.flowId = strs[strs.length - 1];
            this.uploadBean.productCode = strs[1];
            this.uploadBean.forgeBatch = strs[2];
        }
        this.decodeFlag = true;
        this.errMsg += "/二维码验证成功";
        this.uploadBean.company = company;
        return this.uploadBean;
    }

    parseData() {
        this.qrcodeStr = this.qrcodeStr.trim();
        this.decodeFlag = false;

        if (this.isDena()) {
            this.parseDena();
        } else if (this.isHande()) {
            this.parseHande();
        } else if (this.isZhongqi()) {
            this.parseZhongqi();
        } else if (this.isSanyi()) {
            this.parseSanyi();
        } else if (this.isLiuzhouFangsheng()) {
            this.parseLiuzhouFangsheng();
        } else if (this.isHefeiFangsheng()) {
            this.parseHefeiFangsheng();
        } else if (this.isQingdaoHaitong()) {
            this.parseQingdaoHaitong();
        } else if (this.isBbl()) {
            this.parseBbl();
        } else {
            this.errMsg = "*未识别到产品厂家";
            this.uploadBean.company = customers.other.name;
        }

        return this.uploadBean;
    }

    check() {
        this.qrcodeStr = this.qrcodeStr.trim();
        if (this.isDena() || this.isHande() || this.isZhongqi()) {
            return true;
        }
        return false;
    }
}

bbl.parseBblForgeBatchNo = function parseBblForgeBatchNo(forgeBatchNo) {
    const forgeInfo = {};
    forgeInfo.materialGrade = forgeBatchNo[0];
    forgeInfo.month = forgeBatchNo.substring(1, 5);
    const match = forgeBatchNo.match(/\d+$/);
    let productLineStart = 5;
    let productLineEnd = 6;
    if (match) {
        forgeInfo.heatNoIdx = match[0];
        productLineEnd = match.index + 1;
    }
    forgeInfo.productLine = forgeBatchNo.substring(productLineStart, productLineEnd);
    forgeInfo.materialSupplier = forgeBatchNo[productLineEnd];
    return forgeInfo;
}

// 示例用法
// const s1 = "BBL*P3*C2312IY249*0005";
// const t1 = new bbl.CpQrcode(s1);
// console.log(t1.parseData());
