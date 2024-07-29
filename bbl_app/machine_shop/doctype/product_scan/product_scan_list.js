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
        let page = listview.page;
        let main = page.wrapper.find(".layout-main-section");
        let page_form = page.page_form

        


        // let page_form2 = $('<div class="page-form row"></div>').prependTo(main)
        // let page_form2 = page_form.clone().prependTo(main)
        // log(page_form2);

        // page.add_field({
        //     fieldtype: 'Data',
        // })
        
        // page.add_field({
        //     fieldtype: 'Data',
        // })

        // let field2 = page.add_field({
        //     label: '扫描框',
        //     fieldtype: 'Small Text',
        //     fieldname: 'scan_code',
        //     options: "Barcode",
        //     change() {
        //         console.log(field2);
        //         console.log(field2.get_value());Lable
        //     }
        // });
        // log(field2);
        // wfd = field2;
       



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
        this.make();
    }

    
    make() {
        let title = "扫描产品二维码";
        let primary_label = "...";
        this.fields = [

            {
                "fieldname": "product_barcode",
                "label": "扫码框",
                "fieldtype": "Small Text",
                "options": "Barcode",
                "reqd": 1,
                "description": "使用说明：" + "请把输入光标置入此框，然后10秒内连续扫描两个二维码，进行绑定上传。".fontcolor("#00b89f"),
                onchange: (e) => {
                    let d = this.dialog;
                    let v = d.get_value("product_barcode")
                    this.cnt = this.cnt + 1;
                    log("onchange:" + this.cnt, v);
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
            { "fieldname": "customer_code", "label": "客户二维码", "fieldtype": "Data", "read_only": 1},
            { "fieldname": "bbl_code", "label": "百兰二维码", "fieldtype": "Data", "read_only": 1},
            {
                "fieldname": "employee",
                "label": "员工",
                "fieldtype": "Link",
                "options": "Employee Jobs",
                "reqd": 1,
                "default": frappe.user.name,
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
                log("设置焦点+1");
                this.scan_input_df.set_focus();
            }
            // this.scan_input_df.set_focus();
            // log("blur_timer:" + this.blur_timer);
        }, 10000);
        log("setup blur_timer:" + this.blur_timer);
        this.dialog.$wrapper.on("click", function () {
            // log("dialog.$wrapper.click");
        });
        this.dialog.get_primary_btn().off("click").on("click", () => {
            frappe.show_alert("自动上传，不需要点击确认按钮");
        });
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
            return false;
        }
        this.bbl_code = v;
        if (this.customer_code.length < this.bbl_code.length)
            [this.customer_code, this.bbl_code] = [this.bbl_code, this.customer_code];

        d.set_value("bbl_code", this.bbl_code);
        d.set_value("customer_code", this.customer_code);

        this.values = {
            customer_code: this.customer_code,
            bbl_code: this.bbl_code,
            employee: d.get_value("employee"),
            user: frappe.user.name
        }
        log("process_barcode, values:", this.values);
        return true;
    }

    send_back_data(values) {
        console.log("send_back_data values:", values);
        frappe.call({
            method: "bbl_app.machine_shop.doctype.product_scan.product_scan.send_back_data",
            args: values
        }).then(r => {
            log("send_back_data r:", r);
            if (r.message) {
                frappe.show_alert({
                    message: __("新建二维码记录成功"),
                    indicator: "green"
                });
                this.clear_dialog();
                // frappe.set_route("Form", "Stock Entry", r.message);
            }
        });

        this.auto_clear();
        log("测试，完成发送")
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
        // if (customer_code || bbl_code) {
            this.itv_timer = setTimeout(() => {
                this.clear_dialog();
            }, 5000);
        }
        // log("auto_clear, set timer:", this.itv_timer);
    }



}