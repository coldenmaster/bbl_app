// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Semi Product Manage", {

    onload(frm) {
        frm.set_read_only();
    },

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
            opts.yield_list = frm.yield_list;
            bbl.flag_has_spm_opts = 1;
            // route_opts = opts;
            frappe.new_doc("Semi Product Operate", opts, 
               doc => { 
                //    console.log("新建操作单frm, opts属性:", opts);
                //    console.log("新建操作单frm, doc属性:", doc);
                //    frappe.show_alert("功能ok");
                })
        });

        if (frappe.user_roles.includes("Administrator")) {
            frm.page.add_inner_button('Patch', () => {
                // make_main_op_dialog(listview);
                // frappe.set_route("Form", "Work Order", r.message);
                make_spm(frm);

            });
            // page.change_inner_button_type('加工单列表', null, 'warning');
        }

	},
});

function make_spm(frm) {
    frappe.prompt([
        {
            "fieldname": "semi_product",
            "label": "半成品",
            "fieldtype": "Link",
            "options": "Semi Product",
            "reqd": 1,
        },
        {
            "fieldname": "product_form",
            "label": "工序",
            "fieldtype": "Link",
            "options": "Product Form",
            "reqd": 1,
        },
        {
            "fieldname": "qty",
            "label": "数量",
            "fieldtype": "Int",
            "reqd": 1,
        }],
        function (values) {
            frappe.new_doc("Semi Product Manage", 
                {
                    semi_product: values.semi_product,
                    // semi_product_name: values.semi_product + "_" + values.product_form,
                    // product_form: values.semi_product + "_" + values.product_form,
                    // remaining_piece: values.qty,
                    // batch_no: "batch_no2134",
                    
                }, (doc) => {
                 log("doc", doc)
                 doc.batch_no = "batch_no2134";
                 doc.semi_product_name = values.semi_product + "_" + values.product_form;
                 doc.remaining_piece = values.qty;
                 log("doc", doc)
                 frappe.db.insert(doc)
                }
                ).then((doc) => {
                    log("no use doc", doc)
                })
                ;
        }, "Admin,手动补充数量,平衡单据", "新建半成品"
    )
}
