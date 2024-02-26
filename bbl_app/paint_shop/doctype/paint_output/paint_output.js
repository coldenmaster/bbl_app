// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Paint Output", {
	refresh(frm) {
        console.log("operation_tree 刷新");
	},

    onload: function (frm) {
        frm.set_query("operation", function() {
            console.log("operation");
            return {
                "filters": {
                    "parent_operation_tree": "油漆",
                }
            };
        });
    },
    // note(frm,cdt,cdn) {
    //     console.log("note change:", frm, cdt, cdn);
    // },   


});

frappe.ui.form.on('Product Quantity', {
    quantity(frm, cdt, cdn) {
        // console.log("Product Quantity change:", frm, cdt, cdn);
        li = frm.doc.product_list;
        // const total = li.reduce((acc, cur) => acc + (cur.quantity || 0), 0);
        const total = li.map(item => item.quantity || 0).reduce((acc, cur) => acc + cur, 0);
        frm.doc.total_quantity = total;
        frm.refresh_field('total_quantity');
    },

})