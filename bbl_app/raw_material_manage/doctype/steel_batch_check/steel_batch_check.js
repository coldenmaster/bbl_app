// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.require("/assets/bbl_app/js/steel_batch_parse.js", () => {
    console.log("parse.js is loaded");
});

frappe.ui.form.on("Steel Batch Check", {
	refresh(frm) {

	},
    // submit(frm) {
    //     console.log("submit", frm.doc)
    // },

    scan_barcode(frm) {
        frm.set_value("hand_in", false);
        // frm.trigger("parse_gangbang_code");
        parse_gangbang_code(frm)
	},

});

function _clear_doc(frm) {
    console.log("into clear doc");
    frm.doc.scan_barcode = "";
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
    frm.doc.batch_date = "";
    frm.doc.bundle_total = "";
    frm.doc.bundle_index = "";
    frm.doc.contract_no = "";
    frm.doc.standard = "";
    // frm.refresh();
};


function parse_gangbang_code(frm) {
    // _clear_doc(frm);
    // if (!frm.is_new()) {
    //     frappe.msgprint({
    //         title: __('Warning'),
    //         message: "请新建空白表单，然后扫码",
    //         indicator: 'red'
    //     });
    //     frm.doc.scan_barcode = ""
    //     frm.refresh();
    //     frm.focus_on_first_input();
    //     console.log("focus_on_first_input");
    //     return;
    // }

    let qrcodeStr = frm.doc.scan_barcode    
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
        setTimeout(() => {
            frm.doc.scan_barcode = "";
        }, 2000);
        return;
    }

    // frm.doc.supplier = gangbang_info.company;
    // frm.doc.product_company = gangbang_info.company;
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
    frm.doc.product_name = gangbang_info.productName;


    if (!(frm.doc.length > 0)) {
        frm.doc.length = undefined;
    }
    if (!(frm.doc.steel_piece > 0)) {
        frm.doc.steel_piece = undefined;
    }
    // frm.refresh();

    // frappe.show_alert({
    //     message:"扫码成功",
    //     indicator:'green'
    // }, 5);

    frappe.db.exists("Steel Batch Check", frm.doc.batch_no).then(exists => {
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
            frm.save().then(() => {
                frappe.show_alert({
                    message:"批次号录入成功",
                    indicator:'green'
                }, 5);
                frappe.utils.play_sound('submit');
                frappe.new_doc("Steel Batch Check");
            });
        }
    })
}