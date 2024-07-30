
frappe.listview_settings["Product Scan"] = {

    hide_name_column: true, // hide the last column which shows the `name`
    hide_name_filter: true, // hide the default filter field for the name column


    add_fields: [
    ],
    // filters: [
    //     ["status", "!=", "出完"]
    // ],
    list_view: "",

    // get_indicator: function (doc) {
	// 	var colors = {
	// 		未使用: "green",
	// 		已使用: "orange",
	// 		余料: "red",
	// 		用完: "gray",
	// 		Working: "orange",
	// 		"Pending Review": "orange",
	// 		Cancelled: "dark grey",
	// 	};
	// 	return [doc.status, colors[doc.status], "status,=," + doc.status];
	// },

    primary_action() {
        scan_product_dialog(this.list_view);
    },

    onload: function (listview) {
        log("onload listview");
        this.list_view = listview;
        // let page = listview.page;
        // let main = page.wrapper.find(".layout-main-section");
        // let page_form = page.page_form
        listview.page.add_menu_item("增加员工名称", function () {
            add_user_dialog();
        });



    },

    refresh: function(listview) { 
        console.log("refresh listview");

    }

}

function scan_product_dialog(list_view) {
    let d = new ScanProductDialog(list_view, r => {
        console.log("dialog return:", r);
    });
}


class ScanProductDialog {
    
    constructor(opts, callback) {
        this.dialog = null;
        this.callback = callback;
        this.cnt = 0;
        this.itv_timer = 0;
        this.blur_timer = 0;
        this.scan_input_df = null;
        this.customer_code = "";
        this.bbl_code = "";
        this.values = {};
        this.single_code_check = Number(localStorage.getItem("single_code_check")) || 0;
        if (!this.single_code_check) 
            this.single_code_check = 0;
        this.counter = Number(localStorage.getItem("pruduct_scan_code_counter")) || 0;
        this.last_product_first_5 = localStorage.getItem("last_product_first_5") || "";
        log(this.counter, this.last_product_first_5);

        this.make();
    }

    
    make() {
        let title = "扫描产品二维码";
        let primary_label = "...";
        let employee_select = this.get_employee_select();
        let employee_name = this.get_employee_name();
        
        this.fields = [
            {
                "fieldname": "product_barcode",
                "label": "扫码框",
                "fieldtype": "Small Text",
                "options": "Barcode",
                "reqd": 1,
                "max_height": "5rem",
                // "height": "2rem",
                "description": "使用说明：" + "请把输入光标置入此框，然后10秒内连续扫描两个二维码，进行绑定上传。".fontcolor("#00b89f"),
                onchange: (e) => {
                    let d = this.dialog;
                    let v = d.get_value("product_barcode").trim();
                    // this.cnt = this.cnt + 1;
                    // log("onchange:" + this.cnt, v);
                    this.auto_clear(v);
                    if (!v)
                        return;
                    d.set_value("product_barcode", "");
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
            { "fieldname": "customer_code", "label": "客户二维码", 
                "fieldtype": "Data", "read_only": 1
            },
            { "fieldname": "bbl_code", "label": "百兰二维码", 
                "fieldtype": "Data", "read_only": 1,"hidden": 1
            },
            {"fieldtype": "Section Break",},
            {
                "fieldname": "employee",
                "label": "员工",
                "fieldtype": "Select",
                // "fieldtype": "Data",
                // "options": "Employee Jobs",
                "options": employee_select,
                // "reqd": 1,
                "default": employee_name,
                onchange: (e) => { 
                    const v = this.dialog.get_value("employee")
                    if (v)
                        localStorage.setItem("prodct_scan_user_name", v); 
                },
            },
            {"fieldtype": "Column Break",},
            {
                "fieldname": "counter",
                "label": "计数",
                "fieldtype": "Int",
                "default": this.counter,
                onchange: () => { 
                    // const v = this.dialog.get_value("counter")
                    // if (this.single_code_check != v) {
                    //     this.single_code_check = v;
                    //     localStorage.setItem("single_code_check", v);
                    // }
                }
            },
            {"fieldtype": "Column Break",},
            {"fieldtype": "Heading", "label": "&nbsp;"},
            {
                "fieldname": "single_code_check",
                "label": "单次上传",
                "fieldtype": "Check",
                "default": this.single_code_check,
                onchange: () => { 
                    const v = this.dialog.get_value("single_code_check")
                    if (this.single_code_check != v) {
                        this.single_code_check = v;
                        localStorage.setItem("single_code_check", v);
                    }
                }
            },
                
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
        this.scan_input_df = this.dialog.get_field("product_barcode");
        // let me = this;
        this.blur_timer = setInterval(() => {
            if (document.activeElement != this.scan_input_df.$input[0]) {
                // log("设置焦点+1");
                this.scan_input_df.set_focus();
            }
        }, 30000);
        this.dialog.$wrapper.on("click", function () {
            // log("dialog.$wrapper.click");
        });
        this.dialog.get_primary_btn().off("click").on("click", () => {
            frappe.show_alert("自动上传，不需要点击确认按钮");
        });
        window.m3= this;
        // window.dg = this.dialog;
        // window.df = this.scan_input_df;
        // window.bt = dg.get_primary_btn()
    }

    process_barcode(v) {
        // logic 是:
        //  1.接收到onchange后，判断是是什么码，存入相应的字段，或者隐藏字段
        //  2.设置延时5秒，5s内扫码到全部两个码，进行上传存储，
        // 3.超时后把输入框清空
        let d = this.dialog;

        if (!this.customer_code) {
            this.customer_code = v;
            d.set_value("customer_code", v);
            log("!this.single_code_check", !this.single_code_check, this.single_code_check);
            if (!this.single_code_check)
                return false;
        }
        if (this.single_code_check) {
            this.bbl_code = "";
        } else {
            this.bbl_code = v;
            if (this.customer_code.length < this.bbl_code.length)
                [this.customer_code, this.bbl_code] = [this.bbl_code, this.customer_code];
        }

        d.set_value("bbl_code", this.bbl_code);
        d.set_value("customer_code", this.customer_code);
        
        this.accu_counter();
        this.values = {
            customer_code: this.customer_code,
            bbl_code: this.bbl_code,
            employee: d.get_value("employee"),
            user: frappe.user.name,
            single_code_check: this.single_code_check,
            counter: this.counter,
        }
        log("process_barcode, values:", this.values);
        return true;
    }

    accu_counter() {
        const first_5 = this.customer_code.substring(0, 5);
        if (first_5 != this.last_product_first_5) {
            this.last_product_first_5 = first_5;
            this.counter = 1;
        } else {
            this.counter += 1;
        }
        localStorage.setItem("pruduct_scan_code_counter", this.counter);
        localStorage.setItem("last_product_first_5", this.last_product_first_5);
        this.dialog.set_value("counter", this.counter);
        return this.counter;
    }

    send_back_data(values) {
        console.log("send_back_data values:", values);
        frappe.call({
            method: "bbl_app.machine_shop.doctype.product_scan.product_scan.send_back_data",
            args: values,
            error: (r) => { 
                frappe.utils.play_sound("error");
                // this.auto_clear();
            },
            always: () => {
                this.clear_dialog();
            },
            freeze: true,
            freeze_message: "正在上传数据，请稍候...",
        }).then(r => {
            log("send_back_data r:", r);
            if (r.message) {
                frappe.show_alert({
                    message: __("新建二维码记录成功"),
                    indicator: "green"
                });
                frappe.utils.play_sound("submit");
            }
        });
    }
    
    clear_dialog() {
        this.customer_code = "";
        this.bbl_code = "";
        let d = this.dialog;
        d.set_value("customer_code", "");
        d.set_value("bbl_code", "");
        if (this.itv_timer) {
            clearTimeout(this.itv_timer);
            this.itv_timer = 0;
        }
        // log("clear_dialog 完成")
    }
    
    
    auto_clear(v) {
        if (v) {
            if (this.itv_timer) {
                clearTimeout(this.itv_timer);
                this.itv_timer = 0;
            }
            this.itv_timer = setTimeout(() => {
                this.clear_dialog();
            }, 10000);
        }
    }

    get_employee_select() {
        let employee_select = localStorage.getItem("prodct_scan_user_select");
        if (!employee_select) {
            employee_select = default_user_list;
            localStorage.setItem("prodct_scan_user_select", employee_select);
        }
        return employee_select;
    }
    get_employee_name() {
        let employee_name = localStorage.getItem("prodct_scan_user_name");
        if (!employee_name) {
            employee_name = frappe.session.user_fullname;
        }
        return employee_name;
    }

}
const default_user_list = frappe.session.user_fullname 
    + "\n" + "王法勤"
    + "\n" + "张伟"
    + "\n" + "张宏波"

function add_user_dialog() {
    log("into add_user_dialog")
    frappe.prompt("请输入员工姓名", (values) => {
        log('values', values);
        let v = localStorage.getItem("prodct_scan_user_select");
        if (!v) { 
            v = default_user_list;
        }
        v = v + "\n" + values.value;
        localStorage.setItem("prodct_scan_user_select", v);
    })
}

