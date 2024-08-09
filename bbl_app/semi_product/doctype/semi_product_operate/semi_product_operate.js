// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Semi Product Operate", {
    op_source: "",

    setup(frm) {
        // f = frappe;
        frm = cur_frm;
    },
    on_submit(frm) {
        log("spo on_submit", frm)
    },
	refresh(frm) {
        if (frm.is_new()) {
            frm.add_custom_button("挑选半成品", () => {
                // frm.trigger("clearForm"); // 占位，手机段第一个显示不出来
                frappe.show_alert("显示 挑选对话框")
                select_spm_dialog(frm);
                // frm.doc.show2 = 1;
                // frm.toggle_display(['length2', 'piece2', 'length3', 'piece3'], true);
            })
            // frm.change_custom_button_type("挑选半成品", null, 'primary');
            frm.change_custom_button_type("挑选半成品", null, 'info');
    
        };  
        
        
        set_default(frm);
        setup_search_basket_field(frm);
        // frm.trigger("semi_product");
        // frm.trigger("semi_op_source");
        judge_fields_display(frm);
	},
    semi_product(frm) {
        op_source = cat_op_source(frm);
        set_spm_filter(frm, op_source);

    },
    semi_op_source(frm) {
        const op_source = cat_op_source(frm);
        set_spm_filter(frm, op_source);
        set_target_form_filter(frm, frm.doc.semi_op_source);
        set_forge_batch_no_disp(frm);
    },
    spm_source(frm) {
        cat_finish_name(frm);
        query_spm_source_data(frm);
    },
    semi_op_target(frm) {
        cat_finish_name(frm);
        set_bbl_heat_no_disp(frm);
    },
    source_qty(frm) {
        frm.set_value("finish_qty", frm.doc.source_qty);
    },
    finish_qty(frm) {
        if (frm.doc.finish_qty > frm.doc.source_qty) {
            frappe.msgprint({ "title": "错误", message: "目标数量不能大于源数量", indicator: "red", alert: 1 });
            frm.set_value("finish_qty", "");
        }
    }

});

function set_default(frm) {
    if (frm.is_new()) {
        frm.set_value("employee", frappe.session.user_fullname);
        frm.set_value("semi_op_target", "");
    }
}
function cat_op_source(frm) {
    const name = frm.doc.semi_product ? frm.doc.semi_product + "_" : "";
    const form = frm.doc.semi_op_source || "";
    return name + form;
}
function cat_finish_name(frm) {
    // 挑选产品 + 选择目标形态 = 自动进行设置
    const spm_source = frm.doc.product_name || "";
    const semi_op_target = frm.doc.semi_op_target || "";
    let val = ""
    if (spm_source && semi_op_target) {
        const spm_0 = spm_source.split(/_[^_]+$/, 2)[0];
        val = spm_0 + "_" + semi_op_target
    }
    frm.set_value("finish_name", val);
}

function query_spm_source_data(frm) {
    const spm_source = frm.doc.spm_source || "";
    if (spm_source) {
        frappe.model.with_doc("Semi Product Manage", spm_source).then(doc => {
            log("with_doc2", doc);
            frm.set_value("forge_batch_no", doc.forge_batch_no);
            frm.set_value("bbl_heat_no", doc.bbl_heat_no);
        })
    };
}

function set_spm_filter(frm, op_source) {
    if (frm.is_new())
        frm.set_value("spm_source", "");
    frm.set_query("spm_source", function () {
        return {
            filters: {
                semi_product_name: ["like", `%${op_source}%`],
                remaining_piece: ["!=", "0"]
            },
        };
    });
}

function set_target_form_filter(frm, value) {
    frm.set_query("semi_op_target", function () {
        return {
            filters: {
                name: ["!=", value]
            },
        };
    });
}

function judge_fields_display(frm) {
    /* 判断哪些字段可进行隐藏，简洁显示页面 */
    // 锻造批次号填写了就不用显示了
    if (!frm.is_new())  // 新建时，隐藏字段，对界面进行简化
        return;
    
    set_forge_batch_no_disp(frm) 
    set_bbl_heat_no_disp(frm);
}

function set_forge_batch_no_disp(frm) {
    if (!frm.is_new())  // 新建时，隐藏字段，对界面进行简化
        return;
    const last_op = frm.doc.semi_op_source;
    let fd = frm.get_field("forge_batch_no");
    if (last_op != "锻坯登记") 
        set_frm_df_rend(fd, 0, 0);
    else    
        set_frm_df_rend(fd, 1, 1);

}
function set_bbl_heat_no_disp(frm) {
    if (!frm.is_new())  // 新建时，隐藏字段，对界面进行简化
        return;
    const bbl_heat_no_list = ["调质", "正火", "淬火", "回火"];
    const target_op = frm.doc.semi_op_target;
    let fd = frm.get_field("bbl_heat_no");
    if (!bbl_heat_no_list.includes(target_op)) {
        set_frm_df_rend(fd, 0, 0);
    } else {
        set_frm_df_rend(fd, 1, 1);
    }
}

function setup_search_basket_field(frm) {
    const $wrapper = frm.get_field("spm_source").$wrapper;
    $wrapper.find(".control-input").append(
        `<span class="link-btn">
            <a class="btn-open no-decoration" title="${__("根据料框选择加工的成品")}">
                ${'选框🛒'.fontcolor("#0080FF")}
            </a>
        </span>`
    );
    // ${frappe.utils.icon("stock", "m")}

    const $scan_btn = $wrapper.find(".link-btn");
    $scan_btn.toggle(true);
    
    $scan_btn.on("click", "a", (r) => {
        log("触发小图标 click", r);
        frappe.prompt("请输入料框编号", (values) => {
            frappe.db.get_value("Semi Product Manage", 
            {
                "basket_no":values.value,
                "remaining_piece":[">", 0],
            }, 
            ["name", "semi_product_name"], 
            (r) => {
                log("getaa", r)
            if (r && r.name) {
                li = r.semi_product_name.split("_");
                log(li);
                frm.set_value("semi_product", li[0]);
                frm.set_value("semi_op_source", li[1]);
                setTimeout(() => {
                    frm.set_value("spm_source", r.name);
                }, 100);
            } else 
                frappe.msgprint(`未找到框号 ${values.value.bold()} 的半成品`, alert=true);
            })
            // .then(r => {
            //     log("get2", r)
            // })
            
        },"选择框号", "确定")

    });
}



// utils
function set_frm_df_rend(df, show, reqd) {
    df.toggle(!!show);
    df.df.reqd = !!reqd;
    df.set_required();
    // df.df.read_only = !!readonly;
    // df.refresh();
}




function select_spm_dialog(frm) { 
    log("select_spm_dialog frm:", frm);
    // let main_dialog = new SemiOperationDialog(list_view, r => {
    //     console.log("main_dialog callback:", r);
    // })

    // new frappe.ui.form.MultiSelectDialog({
    //     doctype: "Material Request",
    //     target: this.cur_frm,
    //     setters: {
    //         schedule_date: null,
    //         status: 'Pending'
    //     },
    //     add_filters_group: 1,
    //     date_field: "transaction_date",
    //     get_query() {
    //         return {
    //             filters: { docstatus: ['!=', 2] }
    //         }
    //     },
    //     action(selections) {
    //         console.log(selections);
    //     }
    // });

    // new frappe.ui.form.MultiSelectDialog({
    //     doctype: "Material Request",
    //     target: this.cur_frm,
    //     setters: {
    //         schedule_date: null,
    //         status: null
    //     },
    //     add_filters_group: 1,
    //     date_field: "transaction_date",
    //     allow_child_item_selection: 1,
    //     child_fieldname: "items", // child table fieldname, whose records will be shown &amp; can be filtered
    //     child_columns: ["item_code", "qty"], // child item columns to be displayed
    //     get_query() {
    //         return {
    //             filters: { docstatus: ['!=', 2] }
    //         }
    //     },
    //     action(selections, args) {
    //         console.log(args.filtered_children); // list of selected item names
    //     }
    // });
    
    new frappe.ui.form.MultiSelectDialog({
        doctype: "Semi Product Manage",
        target: frm,
        setters: {
            semi_product_name: null,
            // status: 'Pending',
            operation: null,
            remaining_piece: null,
        },
        add_filters_group: 1,
        // date_field: "for_date",
        date_field: "creation",
        get_query() {
            return {
                filters: { docstatus: ['!=', 2] }
            }
        },
        action(selections) {
            console.log(selections);
        }
    });
    
}

class SemiOperationDialog {
    constructor(opts, callback) {
        console.log("SemiOperationDialog opts:", opts);
        this.dialog = null;
        this.callback = callback;
        this.make();
    }
    make() {
        let title = "原材料/生产投料";
        let primary_label = __("Submit");
        this.fields = [
            { 
                fieldtype: "Link", 
                label: "待加工产品名",
                options: "Product Form",
                fieldname: "wip_type",
                reqd: 1 
            },
            { 
                fieldtype: "Data",
                label: "选择产品",
                fieldname: "info",
            },
            { 
                fieldtype: "Link",
                label: "目标产品名",
                options: "Product Form",
                fieldname: "end_type",
                reqd: 1 
            },
            { 
                fieldtype: "Data",
                label: "提交信息1",
                fieldname: "info1",
            },
            { fieldtype: "Data", label: "提交信息2", options: "", fieldname: "info2",},
            { fieldtype: "Data", label: "提交信息3", options: "", fieldname: "info3",},
            { 
                fieldtype: "Link",
                label: "操作人员", 
                options: "Employee Jobs", 
                fieldname: "user", 
                reqd: 1,
                default: frappe.session.user_fullname
            },           


        //     {
        //         // "fieldname": "d0",product_qty
        //         "label": "出库产品:&emsp;" + this.sb_item_0.raw_name.bold(),
        //         "fieldtype": "Heading",
        //     },
        //     {
        //         // "fieldname": "d1",
        //         "label": "炉号:&emsp;&emsp;&emsp;" + cstr(this.sb_item_0.heat_no).bold(),
        //         "fieldtype": "Heading",
        //     },
        ];
        this.dialog = new frappe.ui.Dialog({
            title,
            fields: this.fields,
            // size: "small",
            primary_action_label: primary_label,
            primary_action: (values) => {
                log(values);
                this.dialog.hide();

            },
            secondary_action_label: __("关闭"),
            secondary_action: () => this.dialog.hide(),
        });

        this.dialog.show();
        // this.get_stock_entry_draft();
        // window.dfc = this.dialog.get_field("stock_entry");
        window.wtd = this.dialog;
    }

}