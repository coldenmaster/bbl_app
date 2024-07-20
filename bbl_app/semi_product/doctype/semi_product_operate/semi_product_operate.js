// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Semi Product Operate", {
    op_source: "",

    setup(frm) {
        // Set query for warehouses
		// frm.set_query("wip_warehouse", function () {
		// 	return {
		// 		filters: {
		// 			company: frm.doc.company,
		// 		},
		// 	};
		// });
    },
	refresh(frm) {
        set_default(frm);
        frm.trigger("semi_product");
	},
    semi_product(frm) {
        op_source = cat_op_source(frm);
        set_spm_filter(frm, op_source);
        if (frm.is_new())
            frm.set_value("spm_source", "");
    },
    semi_op_source(frm) {
        op_source = cat_op_source(frm);
        set_spm_filter(frm, op_source);
    },
    spm_source(frm) {
        cat_finish_name(frm);
    },
    semi_op_target(frm) {
        cat_finish_name(frm);
    },
    source_qty(frm) {
        frm.set_value("finish_qty", frm.doc.source_qty);
    }

});

function set_default(frm) {
    if (frm.is_new()) {
        frm.set_value("employee", frappe.session.user_fullname);
        frm.set_value("semi_op_target", "");
    }
}
function cat_op_source(frm) {
    const name = frm.doc.semi_product ? frm.doc.semi_product + "_" : "";
    const form = frm.doc.semi_op_source || "";
    return name + form;
}
function cat_finish_name(frm) {
    // 挑选产品 + 选择目标形态 = 自动进行设置
    const spm_source = frm.doc.product_name || "";
    const semi_op_target = frm.doc.semi_op_target || "";
    let val = ""
    if (spm_source && semi_op_target) {
        const spm_0 = spm_source.split(/_[^_]+$/, 2)[0];
        val = spm_0 + "_" + semi_op_target
    }
    frm.set_value("finish_name", val);
}
function set_spm_filter(frm, op_source) {
    frm.set_query("spm_source", function () {
        return {
            filters: {
                semi_product_name: ["like", `%${op_source}%`],
            },
        };
    });
}
