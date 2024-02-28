// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Product Weight Paint", {
	refresh(frm) {
        frappe.db.get_doc("Product Name", frm.doc.product_name).then((product_doc) => {
            console.log("product_doc", product_doc);
            frm.set_value("semi_product", product_doc.semi_product_name);
            frm.set_value("product_type", product_doc.product_type);
            // frappe.db.get_doc("Semi Product", product_doc.semi_product).then((semi_product_doc) => {
            //     console.log("semi_product_doc", semi_product_doc);
            // });
            frm.save()
        });
	},
    product_name(frm) {
        frappe.db.get_doc("Product Name", frm.doc.product_name).then((product_doc) => {
            console.log("product_doc", product_doc);
            frm.set_value("semi_product", product_doc.semi_product_name);
            frm.set_value("product_type", product_doc.product_type);
            // frappe.db.get_doc("Semi Product", product_doc.semi_product).then((semi_product_doc) => {
            //     console.log("semi_product_doc", semi_product_doc);
            // });
        });
    },
    weight_one(frm) {
        set_average_weight(frm);
    },
    weight_two(frm) {
        set_average_weight(frm);
    },
    weight_three(frm) {
        set_average_weight(frm);
    }
});

set_average_weight = function(frm) {
    console.log("average_weight");
    weight_count = 0;
    total_weight = 0;
    weight = frm.doc.weight_one;
    if (weight) {
        total_weight += weight;
        weight_count += 1;
    }
    weight = frm.doc.weight_two;
    if (weight) {
        total_weight += weight; 
        weight_count += 1;
    }
    weight = frm.doc.weight_three;
    if (weight) {
        total_weight += weight;
        weight_count += 1;
    }
    frm.set_value("product_weight", total_weight / weight_count);
}