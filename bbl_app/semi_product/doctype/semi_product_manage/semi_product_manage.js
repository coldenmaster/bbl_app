// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Semi Product Manage", {
	refresh(frm) {

        frm.disable_save();
        // frm.page.set_primary_action_text('新建加工单');
        frm.page.set_primary_action('新建加工单', () => {
            if (frm.doc.remaining_piece < 1) { 
                frappe.throw("剩余数量为0根");
            }
            opts = {};
            opts.spm_source = frm.doc.name;
            opts.semi_op_source = frm.doc.product_form;
            opts.raw_heat_no = frm.doc.raw_heat_no;
            opts.forge_batch_no = frm.doc.forge_batch_no;
            opts.bbl_heat_no = frm.doc.bbl_heat_no;
            opts.semi_product = frm.doc.semi_product;
            // route_opts = opts;
            frappe.new_doc("Semi Product Operate", opts, 
               doc => { 
                //    console.log("新建操作单frm, opts属性:", opts);
                //    console.log("新建操作单frm, doc属性:", doc);
                   frappe.show_alert("功能ok");
                })
        });
    

	},
});
