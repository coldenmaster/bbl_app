// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Report Output", {
	refresh(frm) {

	},
    setup(frm) {    
        frm.set_query("product_class", function() {
			return{
				"filters": {
					"name": ["in", ["Semi Product", "Product Name"]],
				}
			}
		});
    }
});
