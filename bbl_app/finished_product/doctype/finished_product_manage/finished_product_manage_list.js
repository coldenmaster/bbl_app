frappe.listview_settings["Finished Product Manage"] = {


    add_fields: [],
    filters: [
        ["is_over", "=", 0],
    ],
    list_view: "",
    
    get_indicator: function (doc) {
		var colors = {
			入油漆: "green",
			入机加工: "green",
			已打包: "blue",
			入仓库: "blue",
			代储: "orange",
			已使用: "red",
			已开票: "gray",
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
        alert("primary_action, not implemented yet")
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
        
        });
        page.change_inner_button_type('扫码加工', null, 'info');
    }, 

    refresh: function (listview) {
        // let d = new ScanBblCodeDialog(listview, r => {
        //     console.log("dialog return:", r);
        // });
    }

}


class ScanBblCodeDialog {
    
    constructor(opts, callback) {
        this.dialog = null;
        this.callback = callback;
        this.scan_input_df = null;
        this.spm_name = null;
        this.spm_doc = null;
        this.counter = localStorage.getItem("fpmd_counter") || 0; // 计数器
        this.counter_ok = localStorage.getItem("fpmd_counter_ok") || 0; // 计数器
        this.last_code = localStorage.getItem("fpmd_last_code") || ""; // 上一次的条码
        this.op_to = localStorage.getItem("fpmd_op_to") || "贴条码2"; // 上一次的条码
        this.spm_flag = false;

        this.make();
    }
   
    send_back_data(values) {
        console.log("send_back_data values:", values);
        frappe.call({
            method: "bbl_app.finished_product.doctype.finished_product_manage.finished_product_manage.send_back_data",
            args: values,
            error: (r) => { 
                frappe.utils.play_sound("error");
                // this.auto_clear();
            },
            always: () => {
                // this.clear_dialog();
            },
            freeze: true,
            freeze_message: "正在上传数据，请稍候...",
        }).then(r => {
            log("send_back_data r:", r);
            if (r.message) {
                frappe.show_alert({
                    message: __("新建BBL产品二维码成功"),
                    indicator: "green"
                });
                frappe.utils.play_sound("submit");
            }
        });
    }

    set_semi_product_manage_qty(v) {
        this.dialog.get_field("semi_product_manage_qty").set_value("剩余数量：" + cstr(v).bold() + " 根");
    }
    set_semi_product_manage_sum(v) {
        this.dialog.get_field("semi_product_manage_sum").set_value("总数量：" + cstr(v).bold() + " 根");
    }

    add_counter(v) {
        ++this.counter;
        this.dialog.get_field("counter").set_value("扫码计数：" + cstr(this.counter).bold());
        localStorage.setItem("fpmd_counter", this.counter);
    }
    add_counter_ok(v) {
        ++this.counter_ok;
        this.dialog.get_field("counter_ok").set_value("处理成功：" + cstr(this.counter_ok).bold());
        localStorage.setItem("fpmd_counter_ok", this.counter_ok);
    }

    process_counter() {
        this.add_counter(this.counter);
        this.add_counter_ok(this.counter_ok);
    }

    set_scan_result(v) {
        this.dialog.get_field("scan_result").set_value("扫描字符：" + v.fontcolor("blue"));
    }

    show_select_spm_section(show) {
        this.dialog.get_field("section_break_1").on_section_toggle(show);
        this.dialog.get_field("section_break_2").on_section_toggle(show);
    }
    
    make() {
        let title = "扫描产品二维码";
        let primary_label = "...";

        this.fields = [


            {"fieldtype": "Section Break",}, // 第二段
            {
                "fieldname": "scan_code",
                "label": "百兰二维码",
                "fieldtype": "Small Text",
                "options": "Barcode",
                // "reqd": 1,
                "max_height": "3rem",
                "input_css": {
                    "font-size": "1.2rem",
                    "background-color": "#ffffe0",
                    "color": "#00b89f",
                },
                "description": "填写加工工序后，扫描二维码，进行加工上报",
                onchange: (e) => {
                    let d = this.dialog;
                    let v = d.get_value("scan_code").trim() || "";
                    if (!v)
                        return;
                    d.set_value("scan_code", "");
                    
                    this.set_scan_result(v)
                    this.add_counter();
                    if (v.length < 2) {
                        frappe.show_alert("输入二维码少于10字符");
                        return;
                    }
                    // todo 处理上一个条码，前端过滤重复扫描，后端过滤重复上报？
                    if (v == this.last_code) {
                        frappe.show_alert("重复扫描");
                        return;
                    } else {
                        this.last_code = v;
                        this.add_counter_ok();
                        localStorage.setItem("fpmd_last_code", v);
                    }

                    d.get_primary_btn().trigger("click");


                    // this.send_back_data(this.values); 
                },
            },

            {
                "fieldname": "op_to",
                "label": "加工工序",
                "fieldtype": "Link",
                "options": "Operation Tree",
                "get_query": () => {
                    return {
                        "filters": {
                            "is_not_semi": 1,
                            "workshop": ["in", ["机加工车间", "油漆车间", "仓库"]],
                        },
                    }
                },
                "reqd": 1,
                "remember_last_selected_value": 1,  // not work
                "default": localStorage.getItem("fpmd_op_to") || operation,
                onchange: (e) => {
                    const v = this.dialog.get_value("op_to");
                    const last_v = this.dialog.get_field("op_to").last_value;
                    if (v && (v != last_v))
                        localStorage.setItem("fpmd_op_to", v);
                    this.spm_flag = ["扫码", "贴条码"].includes(v);
                    this.show_select_spm_section(this.spm_flag);
                }

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

            //
            {
                "fieldtype": "Section Break",
                "fieldname": "section_break_1",
                "hidden": 1,
                // "collapsible": 1,
                // "collapsed": 1,
            },
            {
                "fieldname": "semi_product_manage",
                "label": "来源半成品",
                "fieldtype": "Link",
                "options": "Semi Product Manage",
                "get_query": () => {
                    return {
                        "filters": {
                            "remaining_piece": [">", 0],
                            // "product_form": "产品形态筛选",
                        },
                    }
                },
                // todo ls记录上一次选择的半成品批次，
                // todo 选择后，进行ls存储，查询数量，置入对话框
                // todo 选择工序为 ‘贴条码’，时显示这些字段
                // "default": this.spm_name || localStorage.getItem("fpmd_spm_name") || "",
                onchange: () => { 
                    this.spm_name = this.dialog.get_value("semi_product_manage");
                    // log("1 onchange:", this.spm_name)
                    if (this.spm_name) {
                        // frappe.db.get_doc("Semi Product Manage", this.spm_name).then((doc) => {
                        frappe.model.with_doc("Semi Product Manage", this.spm_name).then((doc) => {
                            this.spm_doc = doc;
                            // log("2 onchange:", this.spm_doc)
                            this.set_semi_product_manage_qty(this.spm_doc.remaining_piece);
                            this.set_semi_product_manage_sum(this.spm_doc.total_piece);
                            localStorage.setItem("fpmd_spm_name", this.spm_name);
                        });
                    }

                }
            },
            {
                "fieldname": "product_name",
                "label": "成品名称",
                "fieldtype": "Link",
                "options": "Product Name",
                "reqd": 1,
                "default": localStorage.getItem("fpmd_product_name") || "",
                onchange: (e) => {
                    const v = this.dialog.get_value("product_name");
                    const last_v = this.dialog.get_field("product_name").last_value;
                    if (v && (v != last_v))
                        localStorage.setItem("fpmd_product_name", v);
                }
            },
            {
                "fieldtype": "Section Break", 
                "fieldname": "section_break_2",
                "hidden": 1,
            },
            {
                "fieldname": "semi_product_manage_qty",
                "fieldtype": "Heading",
            },
            {"fieldtype": "Column Break",},
            {
                "fieldname": "semi_product_manage_sum",
                "fieldtype": "Heading",
            },


            {"fieldtype": "Section Break",},
            
            {
                "fieldtype": "Heading",
                "fieldname": "scan_result",
                "label": "&nbsp;扫描结果区"
            },
                
            //
            {"fieldtype": "Section Break",},
            // {"fieldtype": "Column Break",},

            {
                "fieldname": "counter_ok",
                "fieldtype": "Heading",
                "label": "成功计数",
            },
            {"fieldtype": "Column Break",},
            {
                "fieldname": "counter",
                "fieldtype": "Heading",
                "label": "计数",
            },

        ];

        this.dialog = new frappe.ui.Dialog({
            title,
            fields: this.fields,
            size: "small",
            primary_action_label: primary_label,
            primary_action: (values) => {
                // this.dialog.hide();
                frappe.show_alert("自动上传，不需要点击确认按钮 xxx");
                values.bbl_code = this.last_code;
                values.spm_flag = this.spm_flag;
                if (this.spm_flag) {
                    values.counter = this.counter;
                    values.counter_ok = this.counter_ok;
                } else {
                    // delete values.spm_name ;
                }
                // todo 需要 使用剩余数量进行校验吗？
                log("primary_action", values);
                this.send_back_data(values);
                
            },
            secondary_action_label: __("关闭"),
            secondary_action: () => this.dialog.hide(),
        })
        const spm_name_default = this.spm_name || localStorage.getItem("fpmd_spm_name") || "";
        this.dialog.set_value("semi_product_manage", spm_name_default);
        this.dialog.set_value("op_to", this.op_to);
        this.set_scan_result(this.last_code); 
        this.process_counter();
        // this.dialog.get_primary_btn().toggleClass("hidden")
        this.dialog.show();
        this.dialog.$wrapper.find(".link-btn").css("display", "inline");
        this.scan_input_df = this.dialog.get_field("scan_code");
        // let me = this;
        this.blur_timer = setInterval(() => {
            if (document.activeElement != this.scan_input_df.$input[0]) {
                this.scan_input_df.set_focus();
            }
        }, 30000);
        // this.dialog.$wrapper.on("click", function () {
            // log("dialog.$wrapper.click");
        // });
        // this.dialog.get_primary_btn().off("click").on("click", () => {
        //     frappe.show_alert("自动上传，不需要点击确认按钮");
        // });
        window.d = this.dialog;
        window.df1 = d.get_field("scan_result")
        window.c = d.get_field("scan_code")
        window.s = d.get_field("semi_product_manage")
        window.sc = d.get_field("section_break_2")

        // window.me= this;
        // window.df = this.scan_input_df;
        // window.bt = dg.get_primary_btn()
    }
}