// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Forge Process Record", {
	refresh(frm) {

	},
    semi_product_weight(frm) {
        // set_semi_product_weight(frm);
        frm.trigger("set_semi_product_weight");
    },

    set_semi_product_weight(frm) {
        semi_product_weight = frm.doc.semi_product_weight;
        if (!semi_product_weight)
            return
        frappe.db.get_doc("Product Weight Record", semi_product_weight)
            .then((doc) => {
                frm.set_value("material", doc.raw_material_type);
                frm.set_value("diameter", doc.diameter);
                frm.set_value("material_ratio", doc.material_ratio);
                frm.set_value("material_weight", doc.material_weight);
                frm.set_value("forge_weight", doc.product_weight);
            })
    }
});

