// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Product Form", {
	refresh(frm) {

        frm.set_query("operation", function () {
            return {
                filters: {
                    is_group: 1,
                },
            };
        });

	},
});
