// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Daily Work Group", {
	// refresh(frm) {
    //     frm.add_custom_button('Test', () => {
    //         console.log("Open Reference form");
    //         frm.set_intro('Please set the value of description', 'blue'); 
    //     });
    //     frm.change_custom_button_type('Test', null, 'primary');

	// },
    // timeline_refresh: function(frm) {
    //     console.log("timeline_refresh");
    // },
    onload: function (frm) {
        // console.log("employee_name mothter onload");
        frm.set_query("employee_name","table_fbvw", function() {
            console.log("employee_name filter");
            return {
                "filters": {
                    "designation": "油漆",
                }
            };
        });
        // console.log("frmfdd ", frm);
        // frm.set_query("leader", function() {
        //     console.log("leader filter");
        //     return {
        //         "filters": {
        //             "designation": "油漆",
        //         }
        //     };
        // });
    },


});

frappe.ui.form.on("Daily Work Group User", {


});

