// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Mold Test", {
    onload(frm) {
        log("onload");
        let fd1 = frm.get_field("test_autocomplete");
        let fda = frm.get_field("test_data");
        const fdbt = frm.get_field("test_bt");
        // log("fd1", fd1);
        window.fd1 = fd1;
        window.fda = fda;
        frm.ac = fd1;

        window.awe = fd1.awesomplete;
        fd1.df.options = ["test1", "test2", "test3"];
        // fd1.df.fieldtype = "MultiSelectList";
        fd1.df.fieldtype = "MultiCheck";
        frm.set_query("test_autocomplete", function() {
            log("set_query", );
        })

        fda.df.input_css = {
            // "margin-top": "20px",
            "font-size": "20px",
            "color": "red",
            "background-color": "yellow",
        }
        fda.df.input_class = "green";
        // fd1.df.with_copy_button = 1;
        // fda.df.with_copy_button = 1;
        fda.df.options = "URL";
        fda.df.translatable = 1;
        // fd1.$input.on("awesomplete-open", () => {
		// 	log("awesomplete-open");
		// });
        fdbt.df.icon = "unhide";
        
    },
	refresh(frm) {
        // let fd1 = frm.get_field("test_autocomplete");
        let fd2 = frm.get_field("test_data");
        frm.ac.$input.on("awesomplete-open", () => {
			log("awesomplete-open");
        })

        frm.ac.$input.on("awesomplete-selectcomplete", () => {
			log("awesomplete-selectcomplete");
            log("fd2", fd2);
            frm.trigger("test_data");
            
		});

        fd_bt = frm.fields_dict["test_bt"];
        fd_bt.$input.addClass("btn btn-primary");
        window.bt = fd_bt;


        // <i class="fa fa-globe"></i>
        // <i class="fa fa-bicycle fa-flip fa-inverse " style="font-size:20px;color:red;"></i>
        // <i class="fa fa-github fa-flip fa-rotate-90 " style="font-size:20px;color:cyan;"></i>
        // <i class="fa fa-camera fa-2x fa-border"></i>
        // <i class="fa fa-github fa-2x"></i>
        // <i class="fa fa-android  fa-2x"></i>
        // <i class="fa fa-android fa-inverse fa-2x"></i>
        // <i class="fa  fa-solid fa-rotate-right  fa-2x  fa-spin fa-inverse " style="color:green;"></i>
        // const translation_btn = `<a class="btn-translation no-decoration text-muted" title="${__(
		// 	"Open Translation"
		// )}">
        //         ${frappe.utils.icon("edit-round", "sm")}
        //         ${frappe.utils.icon("es-line-success", "lg", "green")}
        //         ${frappe.utils.icon("es-solid-success", "lg", "green")}
        //         ${frappe.utils.icon("es-line-filter", "lg", "green")}
        //         ${frappe.utils.icon("es-solid-fire", "lg", "green")}
        //         ${frappe.utils.icon("es-solid-pdf", "lg", "green")}
                
		// 		<i class="fa a fa-futbol-o fa-spin"></i>
		// 		<i class="fa fa-spinner fa-spin  fa-pulse"></i>
		// 		<i class="fa fa-bicycle fa-spin " style="font-size:20px;color:blue;"></i>
		// 		<i class="fa fa-bicycle fa-flip fa-border" style="font-size:20px;color:red;"></i>
        //         </a>`;
                
        //         $(translation_btn)
		// 	.appendTo(frm.ac.$wrapper.find(".clearfix"))
		// 	.on("click", () => {
		// 		log("OK");
		// 	});

        // fd1.set_data(["test1", "test2", "test3", "_autocomplete", "test1"]);

	},

    test_autocomplete: function(frm) {
        log("test_autocomplete change", frm.doc.test_autocomplete);
    },
    test_data: function(frm) {
        log("test_data change", frm.doc.test_data);
    },
    test_bt: function(frm) {
        test_dialog("test_bt change", "data234");
    }

});

function test_dialog(title, data) {
    const test_d = new frappe.ui.Dialog({
        title: title,
        fields: [
            {
                fieldtype: "Data",
                label: "testd",
                fieldname: "test",
                default: data
            },
            {
                fieldtype: "Button",
                label: "testb",
                fieldname: "test_btn",
                click: function() {
                    log("test_btn click", test_d.get_values());
                },
                change: function() {
                    log("test_btn 触发 change", test_d.get_values());
                }
            },
            {
                fieldtype: "Autocomplete",
                label: "testa",
                fieldname: "test_autocomplete",
                options: ["autocomplete1", "autocomplete2", "autocomplete3", "test2", "test3"],
                change: function() {
                    log("智能补全 change", test_d.get_values());
                }
            },
            {
                fieldtype: "MultiSelectPills",
                label: "testm",
                fieldname: "test_mlti",
                options: ["autocomplete1", "autocomplete2", "autocomplete3", "test2", "test3"],
                change: function() {
                    log("多选 change", test_d.get_values());
                }
            },
            {
                fieldtype: "MultiCheck",
                label: "test3",
                fieldname: "test_3",
                options: [
                    {
                        label: "asdf",
                        value: 1,
                        checked: 0,
                    },
                    {
                        label:"2134",
                        value: 5,
                    },
                    {
                        label:"3rf",
                        value: 3,
                        checked: 0,
                    }
                ],
                change: function() {
                    log("MultiCheck 多选 change", test_d.get_values());
                }

            },
        ]   
    });
    test_d.show();
    test_d.set_primary_action("OK", function() {
        log("OK", test_d.get_values());
    });
    mlti = test_d.get_field("test_mlti");
    log(mlti);
    window.td = test_d;

}
