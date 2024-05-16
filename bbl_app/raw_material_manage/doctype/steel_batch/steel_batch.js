// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Steel Batch", {
	refresh(frm) {

        frm.doc.show2 = 0;
        frm.add_custom_button(__('Length2'), () => {
            // frm.trigger("clearForm"); // 占位，手机段第一个显示不出来
            frappe.show_alert("显示 长度3 ...")
            frm.doc.show2 = 1;
            frm.toggle_display(['length2', 'piece2', 'length3', 'piece3'], true);
            // frappe.new_doc("Steel Batch");
            
        })

        // frm.add_custom_button('扫码', () => {
        //     new frappe.ui.Scanner({
        //         dialog: true, // open camera scanner in a dialog
        //         multiple: false, // stop after scanning one value
        //         on_scan(data) {
        //         //   parse_gangbang_code(frm, data);
        //             frm.doc.scan_barcode = data.decodedText;
        //             frm.trigger("scan_barcode");
        //             frm.refresh();
        //         }
        //       });
        // })
        // frm.add_custom_button('清除', () => {
        //     // frm.trigger("clearForm");
        //     _clear_doc(frm);
        //     frm.refresh();
        // })

        frm.add_custom_button('设置炉号', () => {
            let d = new frappe.ui.Dialog({
                title: '设置炉号',
                fields: [
                    {
                        label: '炉号',
                        fieldname: 'heat_no',
                        fieldtype: 'Data'
                    },
                ],
                size: 'small', // small, large, extra-large 
                primary_action_label: '填入',
                primary_action(values) {
                    // console.log(values);
                    frm.doc.heat_no = values.heat_no;
                    frm.refresh_field('heat_no');
                    d.hide();
                }
            });
            d.show();
        });
        frm.add_custom_button('转库', () => {
            trans_area(frm.doc);
        });

        if (frm.is_new()) {
        };

	},

    after_save(frm) {
        frappe.new_doc("Steel Batch");
        frappe.show_alert("保存成功,新建扫描表单")
    },

    scan_barcode(frm) {
        frm.trigger("parse_gangbang_code");
	},

    heat_no(frm, a) {
        let hn = frm.doc.heat_no;
    },

    // steel_piece(frm) {
    //   frm.set_value("remaining_piece", frm.doc.steel_piece);
    // },


    parse_gangbang_code(frm) {
        _clear_doc(frm);
        if (!frm.is_new()) {
            frappe.msgprint({
                title: __('Warning'),
                message: "请新建空白表单，然后扫码",
                indicator: 'red'
            });
            frm.doc.scan_barcode = ""
            frm.refresh();
            frm.focus_on_first_input();
            console.log("focus_on_first_input");
            return;
        }


        let qrcodeStr = frm.doc.scan_barcode    
        qrcodeStr = qrcodeStr.trim();
        qrcodeStr = qrcodeStr.replaceAll("<br />", " ");
        qrcodeStr = qrcodeStr.replaceAll("\n", " ");
        qrcodeStr = qrcodeStr.replaceAll("smq750_", "");  //去除PDA扫描枪前缀
        frm.doc.scan_barcode = ""
        frm.doc.raw_code = qrcodeStr;
    
        qrcodeStr = qrcodeStr.replaceAll("\"", "");
        qrcodeStr = qrcodeStr.replaceAll("\'", "");
        gangbang_info = GangbangParse.parse(qrcodeStr);
        // console.log(gangbang_info)
        if (!gangbang_info) {
            frm.doc.scan_barcode = "";
            frm.refresh_field("scan_barcode")
            frm.refresh_field("raw_code")
            // frappe.msgprint("二维码解析失败, qrcode:<br/>" + qrcodeStr);
            // frm.refresh();
            frappe.show_alert({
                message:"二维码解析失败<br/>" + qrcodeStr,
                indicator:'red'
            }, 5);
            frm.focus_on_first_input();
            frappe.utils.play_sound('error');
            return;
        }
    
        frm.doc.supplier = gangbang_info.company;
        frm.doc.product_company = gangbang_info.company;
        frm.doc.batch_no = gangbang_info.bundleNo;
        frm.doc.heat_no = gangbang_info.heatNo;
        frm.doc.steel_grade = gangbang_info.steelGrade.trim();
        frm.doc.diameter = parseInt(gangbang_info.diaSize);
        frm.doc.raw_name = frm.doc.steel_grade + "-" + frm.doc.diameter;
        frm.doc.length = parseInt(gangbang_info.length);
        frm.doc.weight = parseInt(gangbang_info.weight);
        // frm.doc.steel_piece = gangbang_info.bundleNum;
        frm.set_value("steel_piece", gangbang_info.bundleNum);
        frm.doc.batch_date = gangbang_info.productDate;
        frm.doc.for_date = frappe.datetime.now_date();
        frm.doc.bundle_total = 0;
        frm.doc.bundle_index = parseInt(gangbang_info.bundleIdx) || undefined;
        frm.doc.contract_no = gangbang_info.contractNo;
        frm.doc.standard = gangbang_info.standardNo;

    
        if (!(frm.doc.length > 0)) {
            frm.doc.length = undefined;
        }
        if (!(frm.doc.steel_piece > 0)) {
            frm.doc.steel_piece = undefined;
        }
        frm.refresh();

        frappe.show_alert({
            message:"扫码成功",
            indicator:'green'
        }, 5);

        frappe.db.exists("Steel Batch", frm.doc.batch_no).then(exists => {
            if (exists) {
                frappe.msgprint({
                    title: __('Warning'),
                    message: "批次号已经存入系统, 不能重复录入",
                    indicator: 'red'
                })
                // frm.trigger("clearForm");
                _clear_doc(frm);
                frm.refresh();
                frappe.utils.play_sound('error');
            } else {
                frappe.utils.play_sound('submit');
            }
        })
    }
    


});


function _clear_doc(frm) {
    console.log("into clear doc");
    frm.doc.raw_code = "";
    frm.doc.supplier = "";
    frm.doc.product_company = "";
    frm.doc.batch_no = "";
    frm.doc.heat_no = "";
    frm.doc.steel_grade = "";
    frm.doc.diameter = "";
    frm.doc.raw_name = "";
    frm.doc.length = "";
    frm.doc.weight = "";
    frm.doc.steel_piece = "";
    frm.doc.for_date = "";
    frm.doc.bundle_total = "";
    frm.doc.bundle_index = "";
    frm.doc.contract_no = "";
    frm.doc.standard = "";
    // frm.refresh();
};
//钢棒二维码解析
var GangbangParse = {

    errMsg: false,
    uploadBean: null,


    getCompanys: function () {
        let a = ["", this.xianggang, this.jigang, this.yegang, this.xinxing];
        return a;
    },
    
    parse: function (qrcodeStr) {
        this.uploadBean = {};
        if (this.yegangParse(qrcodeStr) 
                || this.jigangParse(qrcodeStr) 
                || this.xianggangParse(qrcodeStr)
                || this.xinxingParse(qrcodeStr))
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

            console.log('uploadBean', this.uploadBean);

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
            // ["合同号", "contractNo"],
            // ["标准", "standardNo"],
            // ["日期", "productDate"],
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
        this.uploadBean.bundleNo = this.uploadBean.bundleNo;

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
};

String.prototype.replaceAll = function(s1,s2){
    return this.replace(new RegExp(s1,"gm"),s2);
}


function trans_area(doc) {
    console.log("trans_area arg1:", doc);
    let d = new frappe.ui.Dialog({
        title: '原钢转库',
        fields: [
            {
                "fieldname": "name",
                "label": "捆号",
                "fieldtype": "Data",
                "default": doc.name,
                "read_only": 1,
            },
            {
                "fieldname": "warehouse_area",
                "label": "转出库区",
                "fieldtype": "Link",
                "options": "Warehouse Area",
                "default": doc.warehouse_area,
                "read_only": 1,
            },
            {
                "fieldname": "warehouse_area",
                "label": "转入库区",
                "fieldtype": "Link",
                "options": "Warehouse Area",
                "reqd": 1
            }
        ],
        size: 'small',
        primary_action_label: '确定',
        primary_action(values) {
            d.hide();
            if (doc.warehouse_area === values.warehouse_area) {
                frappe.msgprint({ "title": "提示", message: "转入库区错误", "indicator": "red" });
            } else {
                frappe.show_progress('Loading..', 0, 100, '转库...');
                into_area(doc, values.warehouse_area);
            }
        }
    })
    d.show();
};

function into_area(doc, new_area) {
    frappe.db.set_value("Steel Batch", doc.name, "warehouse_area", new_area,
        (res) => {
            doc.warehouse_area = new_area;
            cur_frm.refresh_field("warehouse_area");
            console.log(cur_frm);
            frappe.show_progress('Loading..', 100, 100, '转库中...', true);
        }
    );

};

