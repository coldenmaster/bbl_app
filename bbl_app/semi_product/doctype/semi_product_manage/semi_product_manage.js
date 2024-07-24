// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Semi Product Manage", {
	refresh(frm) {

        frm.add_custom_button('新建加工单', () => {
            let items = listview.get_checked_items();
            if (items.length != 1) {
                frappe.msgprint({ "title": "错误", message: "请只选择一条记录", indicator: "red" });
                return
            }
            if (!items[0].remaining_piece) {
                frappe.msgprint({ "title": "错误", message: "剩余数量为零", indicator: "red" });
                return
            }
            opts = items[0];
            opts.spm_source = opts.name;
            let temp_li = opts.semi_product_name.split('_');
            opts.semi_op_source = temp_li[temp_li.length - 1];
            log(opts);
            frappe.new_doc("Semi Product Operate", items[0], 
               doc => { 
                   console.log("操作单，新建完成 doc:", doc);
                   this.list_view.clear_checked_items();
                })
        });
        page.change_custom_button_type('新建加工单', null, 'info');
    

	},
});
