// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Semi Product Operate", {
    op_source: "",

    setup(frm) {
        // f = frappe;
        frm = cur_frm;
    },
	refresh(frm) {
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
    if (last_op != "锻坯") 
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

