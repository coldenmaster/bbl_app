frappe.listview_settings["Finished Product Manage"] = {


    add_fields: [],
    filters: [
        ["is_over", "=", 0],
    ],
    list_view: "",
    
    get_indicator: function (doc) {
		var colors = {
			未使用: "green",
			已使用: "orange",
			余料: "red",
			用完: "gray",
			Working: "orange",
			"Pending Review": "orange",
			Cancelled: "dark grey",
		};
		// return [("" + doc.remaining_piece).bold() + "/" + doc.status, 
		return [doc.status, 
            colors[doc.status], 
            "status,=," + doc.status];
	},

    primary_action() {
        // frappe.new_doc("Semi Product Operate");
        log("primary_action")
    },

    onload: function (listview) {
        this.list_view = listview;
        let page = listview.page;

        page.add_inner_button('扫码加工', () => {
            // 打开对话框，显示二维码录入框，选择加工工序，选择加工人员
            log("扫码加工对话框");
            let d = new ScanBblCodeDialog(listview, r => {
                console.log("dialog return:", r);
            });
            window.d = d;
        
        });
        page.change_inner_button_type('扫码加工', null, 'info');
    }

}


class ScanBblCodeDialog {
    
    constructor(opts, callback) {
        this.dialog = null;
        this.callback = callback;
        this.scan_input_df = null;
        this.make();
    }

    get_employee_operation() {
        let employee_operation = localStorage.getItem("get_employee_operation");
        if (!employee_operation) {
            employee_operation = "铣板簧b"
            localStorage.setItem("prodct_scan_user_select", employee_operation);
        }
        return employee_operation;
    }
    
    make() {
        let title = "扫描产品二维码";
        let primary_label = "...";
        const operation = this.get_employee_operation();
        
        this.fields = [
            {
                "fieldtype": "Section Break",
                "fieldname": "section_break_1",
                "hidden": 1,
                // "collapsible": 1,
                // "collapsed": 1,
            },
            {
                "fieldname": "semi_product",
                "label": "来源半成品",
                "fieldtype": "Link",
                "default": this.counter,
                onchange: () => { 

                }
            },
            {
                "fieldtype": "Section Break", 
                "fieldname": "section_break_2",
                "hidden": 1,
            },
            {
                "fieldname": "semi_product_qty",
                "label": "剩余数量",
                "fieldtype": "Int",
                "default": "11",
                onchange: () => { 

                }
            },
            {"fieldtype": "Column Break",},
            {
                "fieldname": "semi_product_sum",
                "label": "总数量",
                "fieldtype": "Int",
                "default": "99",
            },

            {"fieldtype": "Section Break",},
            {
                "fieldname": "bbl_code",
                "label": "百兰二维码",
                "fieldtype": "Small Text",
                "options": "Barcode",
                "reqd": 1,
                "max_height": "3rem",
                "input_css": {
                    "font-size": "1.2rem",
                    "background-color": "#ffffe0",
                    "color": "#00b89f",
                },
                "description": "填写加工工序后，扫描二维码，进行加工上报",
                onchange: (e) => {
                    let d = this.dialog;
                    let v = d.get_value("bbl_code").trim();
                    // this.cnt = this.cnt + 1;
                    // log("onchange:" + this.cnt, v);
                    if (!v)
                        return;
                    d.set_value("bbl_code", "");
                    if (v.length < 10) {
                        frappe.show_alert("输入二维码少于10字符");
                        return;
                    }
                    // this.auto_clear(v);
                    if (this.process_barcode(v)) {
                        setTimeout(() => { 
                            this.send_back_data(this.values); 
                        }, 0); 
                        // this.send_back_data(this.dialog.get_values());
                        // d.primary_action(this.dialog.get_values());
                        // d.get_primary_btn().trigger("click");
                    }
                },
            },
            {
                "fieldname": "op_to",
                "label": "加工工序",
                "fieldtype": "Link",
                "options": "operation_tree",
                "reqd": 1,
                "default": operation,
                "remember_last_selected_value": 1,
            },
            {
                "fieldname": "employee",
                "label": "员工",
                "fieldtype": "Link",
                "options": "Employee Jobs",
                "reqd": 1,
                "read_only": 1,
                "default": frappe.session.user_fullname,
            },
            {"fieldtype": "Section Break",},
            {"fieldtype": "Column Break",},
            {
                "fieldname": "counter",
                "label": "计数",
                "fieldtype": "Int",
                "default": this.counter,
                onchange: () => { 
                    // 这里利用加工序号
                    // const v = this.dialog.get_value("counter")
                    // if (this.single_code_check != v) {
                    //     this.single_code_check = v;
                    //     localStorage.setItem("single_code_check", v);
                    // }
                }
            },
            {"fieldtype": "Column Break",},

            {"fieldtype": "Section Break",},
            
            {"fieldtype": "Heading", "label": "&nbsp;扫描结果区".fontcolor("dark green")},
                
        ];

        this.dialog = new frappe.ui.Dialog({
            title,
            fields: this.fields,
            size: "small",
            primary_action_label: primary_label,
            primary_action: (values) => {
                // this.dialog.hide();
                // this.send_back_data(values);
                log("primary_action")
                frappe.show_alert("自动上传，不需要点击确认按钮 xx");
                
            },
            secondary_action_label: __("关闭"),
            secondary_action: () => this.dialog.hide(),
        })
        this.dialog.show();
        this.dialog.$wrapper.find(".link-btn").css("display", "inline");
        this.scan_input_df = this.dialog.get_field("bbl_code");
        // let me = this;
        this.blur_timer = setInterval(() => {
            if (document.activeElement != this.scan_input_df.$input[0]) {
                this.scan_input_df.set_focus();
            }
        }, 30000);
        // this.dialog.$wrapper.on("click", function () {
            // log("dialog.$wrapper.click");
        // });
        this.dialog.get_primary_btn().off("click").on("click", () => {
            frappe.show_alert("自动上传，不需要点击确认按钮");
        });
        // window.me= this;
        // window.dg = this.dialog;
        // window.df = this.scan_input_df;
        // window.bt = dg.get_primary_btn()
    }
}