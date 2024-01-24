// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Mold`", {
// 	refresh(frm) {

// 	},
// });


frappe.ui.keys.on("enter", function (e) {
    console.log("enter");
    if (window.cur_dialog && cur_dialog.confirm_dialog) {
        cur_dialog.get_primary_btn().trigger("click");
    }
});

// $(document).on("mousemove", () => {
//     console.log("mousemove");
// });
$(document).on("dblclick", () => {
    console.log("doubleclick");
});



frappe.ui.form.on('Mold', {
    refresh(frm) {
        console.log("Mold refresh",frm);
        // 增加自定义按钮

        frm.add_custom_button('qrcode', () => {

            // frappe.msgprint(__('Document updated successfully'));
            new frappe.ui.Scanner({
                dialog: true, // open camera scanner in a dialog
                multiple: false, // stop after scanning one value
                on_scan(data) {
                  console.log(data.decodedText);
                  frappe.msgprint(data.decodedText);
                }
              });
            
        })
       
    },

    // setup(frm) {
    //     console.log("Mold setup");
    // },
    // before_load(frm) {
    //     console.log("Mold before_load");
    // },
    // onload(frm) {
    //     console.log("Mold onload");
    // },
    // onload_post_render(frm) {
    //     console.log("Mold onload_post_render");
    // },
    // validate(frm) {
    //     console.log("Mold validate");
    // },
    // before_save(frm) {
    //     console.log("Mold before_save");
    // },
    // after_save(frm) {
    //     console.log("Mold after_save");
    // },
    // before_submit(frm) {
    //     console.log("Mold before_submit");
    // },
    // on_submit(frm) {
    //     console.log("Mold on_submit");
    // },
    // before_cancel(frm) {
    //     console.log("Mold before_cancel");
    // },
    // after_cancel(frm) {
    //     console.log("Mold after_cancel");
    // },
    // timeline_refresh(frm) {
    //     console.log("Mold timeline_refresh");
    // },
    // fieldname 相关字段
    // table_fsrf_on_form_rendered(frm, cdt, cdn) {
    //     console.log("Mold table_fsrf_on_form_rendered", frm, cdt, cdn);
    //     console.log(frm, "cdt", cdn);
    // },

    // table_fsrf(frm, cdt, cdn) {
    //     console.log("parent table_fsrf change --- delete");
    // },
    // mold_from(frm, cdt, cdn) {
    //     console.log("Mold fieldname  mold_from change", frm, cdt, cdn);
    // },

});

frappe.ui.form.on('Mold Use Record', {
    
    // cdt is Child DocType name i.e Quotation Item
    // cdn is the row name for e.g bbfcb8da6a

    // 子表

    // product_quantity(frm, cdt, cdn) {
    //     console.log("product_quantity change:", frm, cdt, cdn);
    //     let row = frappe.get_doc(cdt, cdn);
    //     console.log(row);
    //     console.log(row.linked_technology);
    // },
    
    // 这里进行链接里数据提取
    linked_technology(frm, cdt, cdn) {
        console.log("linked_technology change:", frm, cdt, cdn);
        let row = frappe.get_doc(cdt, cdn);
        let link = row.linked_technology;
        frappe.db.get_doc("Forge Process Record", link).then((doc) => {
            console.log("link_doc", doc);
            row.product_quantity = doc.quantity;
            row.record_cycle = doc.batch_cycle;
            row.product_line = doc.production_line;
            // 是否不同的人员填写，不用复制
            // row.employee = doc.employee
            // console.log("product_quantity", row.production_line);
            frm.refresh_field('table_fsrf');

        });



    },

    
})