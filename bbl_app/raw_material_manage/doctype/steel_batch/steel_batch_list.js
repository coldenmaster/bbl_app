frappe.require("/assets/bbl_app/js/dialog/raw2bar_dialog.js", () => {
    console.log("raw2bar_dialog.js 加载完成");
});
// frappe.require("/assets/bbl_app/js/dialog/bbl_dialog.js", () => {
//     console.log("加载完成");
// });

frappe.listview_settings["Steel Batch"] = {

    // hide_name_column: true, // hide the last column which shows the `name`
    // hide_name_filter: true, // hide the default filter field for the name column

    add_fields: [
        "status",
        "warehouse_area",
    ],
    filters: [
        ["status", "!=", "出完"]
    ],
    list_view: "",
    _this: this,
    func1: function (me) {
        console.log("func1");
    },
    onload: function (listview) {
        console.log("onload");
        this.list_view = listview;
        let page = listview.page;
        let me = this;
        var method = "erpnext.projects.doctype.task.task.set_multiple_status";

        listview.page.add_menu_item("转库区", function () {
            console.log("转库区");
            items = listview.get_checked_items();
            if (items.length === 1) {
                console.log(items);
                trans_area(items[0]);
            } else if (items.length === 0) {
                frappe.msgprint({ "title": "提示", message: "请选择要转库的批次", "indicator": "red" });
            } else {
                frappe.msgprint({ "title": "提示", message: "只能选择一个批次", "indicator": "red" });
            }

        });

        // listview.page.add_action_item(__("Purchase Receipt"), () => {
        //     console.log("选择条目后才会显示")
        // 	erpnext.bulk_transaction_processing.create(listview, "Purchase Receipt", "Purchase Invoice");
        // });

        page.add_inner_button('采购入库', () => {
            let items = listview.get_checked_items();
            items = items.filter(item => item.status === "未入库");
            // console.log("items", items);
            if (items.length === 0) {
                frappe.msgprint({ "title": "提示", message: "请选择'未入库'批次", "indicator": "red" });
                return
            }
            purchase_receipt(items);
        });
        page.change_inner_button_type('采购入库', null, 'warning');

        page.add_inner_button('调拨出库', () => {
            let items2 = listview.get_checked_items();
            items2 = items2.filter(item => item.status === "已入库" || item.status === "半出库");
            if (items2.length === 0) {
                frappe.msgprint({ "title": "提示", message: "请选择'在库'批次", "indicator": "red" });
                return
            } else if (items2.length !== 1) {
                frappe.msgprint({ "title": "提示", message: "暂时只支持单批次调拨", "indicator": "red" });
                return
            }
            frappe.new_doc("Stock Entry", null).then(() => {
                parent_doc = cur_frm.doc;
                cur_frm.set_value("stock_entry_type", "原钢调拨出库");
                cur_frm.set_value("to_warehouse", "原钢平仓库 - 百兰");
                cur_frm.clear_table("items");
                child = frappe.model.add_child(parent_doc, "items");
                child.item_group = "原材料";
                frappe.model.set_value(child.doctype, child.name, "item_code", items2[0].raw_name);
            });
        });

        page.add_inner_button('生产出库', () => {
            let items = listview.get_checked_items();
            items = items.filter(item => item.status === "已入库" || item.status === "半出库");
            product_out(items);
        });
        page.change_inner_button_type('生产出库', null, 'info');

        // let field = page.add_field({
        //     label: '甜甜',
        //     fieldtype: 'Select',
        //     fieldname: 'status3',
        //     options: [
        //         'Open',
        //         'Closed',
        //         '天下无敌'
        //     ],
        //     change() {
        //         console.log(field);
        //         console.log(field.get_value());
        //     }
        // });


    },
    before_render(n) {
        console.log("before_render", n)
        // test_out(this.list_view);
    },

    get_indicator: function (doc) {
        var colors = {
            未入库: "orange",
            已入库: "green",
            草稿: "purple",
            半出库: "blue",
            出完: "gray",
            Working: "orange",
            "Pending Review": "orange",
            Cancelled: "dark grey",
        };
        return [doc.status, colors[doc.status], "status,=," + doc.status];
    },

    primary_action(listview) {
        console.log("primary_action", this);
        this.list_view.make_new_doc();
    },

};


function one_batch_out(doc) {
    /* todo 单捆补充所需的单据直接进行‘物料移动’ */
}

function trans_area(doc) {
    console.log("trans_area arg1:", doc);
    let d = new frappe.ui.Dialog({
        title: '原钢转库',
        fields: [
            {
                "fieldname": "name",
                "label": "捆号",
                "fieldtype": "Data",
                "default": doc.name,
                "read_only": 1,
            },
            {
                "fieldname": "warehouse_area",
                "label": "转出库区",
                "fieldtype": "Link",
                "options": "Warehouse Area",
                "default": doc.warehouse_area,
                "read_only": 1,
            },
            {
                "fieldname": "warehouse_area",
                "label": "转入库区",
                "fieldtype": "Link",
                "options": "Warehouse Area",
                "reqd": 1
            }
        ],
        size: 'small',
        primary_action_label: '确定',
        primary_action(values) {
            d.hide();
            if (doc.warehouse_area === values.warehouse_area) {
                frappe.msgprint({ "title": "提示", message: "转入库区错误", "indicator": "red" });
            } else {
                // frappe.show_progress('Loading..', 0, 100, '转库...');
                into_area(doc, values.warehouse_area);
            }
        }
    })
    d.show();
};

function purchase_receipt(items) {
    pr_send_items(items);
}

// function test_out2(listview) {
//     console.log("测试 utils:");
//     let el =  $($("a").get(0));
//     let v1 = Object.keys(el);
//     log("v1", v1)

// }


function test_out(listview) {
    let items = [listview.data[0]];
    console.log("测试 test_out items:", listview, items);
    product_out(items);
}

function product_out(items) {
    // console.log("product_out items:", items);
    if (items.length == 0) {
        frappe.msgprint({ "title": "提示", message: "请选择要出库的条目", "indicator": "red" });
        return;
    }
    let heat_nos = new Set(items.map(i => i.heat_no));
    let raw_name = new Set(items.map(i => i.raw_name));
    if (heat_nos.size != 1 || raw_name.size != 1) {
        frappe.msgprint({ "title": "提示", message: "必须是：相同产品 + 相同炉号", "indicator": "red" });
        return;
    }
    // 从后端获取items的全部信息
    let batch_nos = items.map(i => i.name);
    // console.log("product_out batch_nos:", batch_nos);
    frappe.db.get_list("Steel Batch", {
        "filters": {
            "name": ["in", batch_nos]
        },
        fields: "*",
        limit: 100,
    }).then(rt_items => {
        // console.log("then, items_back:", rt_items);
        // product_out_dialog(total);
        product_out_dialog2(rt_items);

    })
}

function calc_total_length(item) {
    // console.log("calc_total_length item:", item);
    return cint(item.length) * cint(item.steel_piece)
        + cint(item.length2) * cint(item.piece2)
        + cint(item.length3) * cint(item.piece3);
}


function product_out_dialog2(rt_items) {
    let d = new Raw2BarDialog2(rt_items, r => {
        console.log("dialog return:", r);
    });
}



class Raw2BarDialog2 {
    constructor(opts, callback) {
        // console.log("Raw2BarDialog opts:", opts);
        this.dialog = null;
        // this.frm = frm;
        this.callback = callback;
        this.items = opts;
        this.sb_item_0 = this.items[0];
        this.calc_raw_cnt = this.items.reduce((p, c) => p + c.remaining_piece, 0);
        this.calc_total_length = this.items.reduce((p, c) => p + calc_total_length(c), 0);
        this.raw_weight = this.items.reduce((p, c) => p + c.remaining_weight, 0);
        this.raw_name = this.sb_item_0.raw_name;
        this.bundle_cnt = this.items.length;
        this.batchs = [];
        this.items.forEach(i => {
            this.batchs.push({
                "batch_no": i.name,
                "weight": i.remaining_weight,
            })
        })
        this.raw_length = this.sb_item_0.length;
        this.diameter = this.sb_item_0.diameter;
        this.ratio = this.sb_item_0.material_ratio;
        this.semi_product = this.sb_item_0.semi_product;
        this.raw_bar_name = this.semi_product ? this.semi_product + "_短棒料" : "";
        this.make();
        // console.log("Raw2BarDialog constructor this:", this);
    }

    default_bar_batch(serial, prod) {
        let heat_no = serial || this.sb_item_0.heat_no;
        let prod_name = prod || this.sb_item_0.semi_product || "";
        // log("default_bar_batch heat_no:", heat_no, this.semi_product);
        return "DBL-" + frappe.datetime.now_date().replaceAll("-", "") + "-"
            + heat_no.substring(heat_no.length - 4) + "-" + prod_name.substring(prod_name.length - 3);
    }

    ratio_desc() {
        let piece_cnt = cint(this.raw_length / (cint(this.ratio) + 3));
        return  "" + this.raw_length + " / (" + this.ratio + " +3) = " + piece_cnt + " x " + this.calc_raw_cnt 
                + " = " + cstr(this.calc_bar_cnt()).bold() + "根 / 余: " + cstr(this.calc_scrap_length()).bold() + "mm / " 
                + this.calc_scrap_weight_cstr(this.calc_scrap_length());
    }

    calc_bar_cnt() {
        return cint(this.raw_length / (cint(this.ratio) + 3)) * this.calc_raw_cnt;
    }

    calc_scrap_length() {
        return cint(this.calc_total_length - (cint(this.ratio) + 3) * this.calc_bar_cnt());
    }
    calc_scrap_weight(l) {
        // log("calc_scrap_weight",this.diameter, l, wt);
        return flt(bbl.utils.raw_leng_to_weight(this.diameter, l), 1);
    }
    calc_scrap_weight_cstr(l) {
        return cstr(this.calc_scrap_weight(l)).bold() + "kg";
    }

    set_zh_reqd(on) {
        this.fields.forEach(f => {
            if (f?.fieldname?.startsWith("zh_")) {
                let df = this.dialog.get_field(f.fieldname);
                df.df["reqd"] = on;
                df.set_required();
            }
        })
    }

    calc_zh_weight() {
        let length = this.dialog.get_value("zh_bar_ratio") + 5;
        let nos = this.dialog.get_value("zh_bar_piece");
        let weight = cint(bbl.utils.raw_leng_to_weight(this.diameter, length * nos), 1);
        this.dialog.set_value("zh_bar_weight", weight);
    }

    make() {
        let title = "原材料/生产投料";
        let primary_label = __("Submit");
        this.fields = [
            {
                // "fieldname": "d0",
                "label": "出库产品:&emsp;" + this.sb_item_0.raw_name.bold(),
                "fieldtype": "Heading",
            },
            {
                // "fieldname": "d1",
                "label": "炉号:&emsp;&emsp;&emsp;" + cstr(this.sb_item_0.heat_no).bold(),
                "fieldtype": "Heading",
            },
            {
                "fieldname": "d2",
                "label": "长度:&#x2003;&emsp;&emsp;" + cstr(this.raw_length).bold() + " 毫米 x " + String(this.calc_raw_cnt).bold() + "根",
                "fieldtype": "Heading",
            },
            {
                "fieldname": "d3",
                "label": "总重量:&emsp;&emsp;" +  String(this.items.length).bold() + "捆 / " + String(this.raw_weight).bold() + " 千克",
                "fieldtype": "Heading",
            },
            // section break 1
            { "fieldtype": "Section Break", },
            {
                "fieldname": "semi_product",
                "label": "半成品",
                "fieldtype": "Link",
                "options": "Semi Product",
                "reqd": 1,
                "default": this.semi_product,
                onchange: (e) => {
                    let d = this.dialog;
                    let v = this.semi_product = d.get_value("semi_product")
                    // d.set_value("raw_bar_name", v +"_短棒料");
                    d.set_input("raw_bar_name", v +"_短棒料");
                    frappe.db.get_value("Semi Product", v, "material_ratio").then(r => {
                        d.set_value("bar_ratio", r.message.material_ratio);
                    })
                },
            },
            {
                "fieldname": "raw_bar_name",
                "label": "下料名称",
                "fieldtype": "Link",
                "options": "Item",
                "reqd": 1,
                "default": this.raw_bar_name,
                "get_query": () => {
                    return {
                        "filters": {
                            "item_group": "短棒料",
                        }
                    }
                },
                onchange: (e) => {
                    // console.log("raw_bar_name: Link 的 e 值被 set_value后清除了，看不到", e);
                    this.raw_bar_name = this.dialog.get_value("raw_bar_name");
                    // this.semi_product = this.raw_bar_name.split("_")[0];
                    this.dialog.set_value("bar_batch", this.default_bar_batch(null, this.semi_product));
                },
            },
            {
                "fieldname": "bar_ratio",
                "label": "倍尺",
                "fieldtype": "Int",
                "reqd": 1,
                "description": this.ratio_desc(),
                "default": this.ratio,
                onchange: (e) => {
                    let d = this.dialog;
                    this.ratio = e?.target?.value || d.get_value("bar_ratio");
                    d.set_df_property("bar_ratio", "description", this.ratio_desc());
                    d.set_value("bar_piece", this.calc_bar_cnt());
                    d.set_value("scrap_length", this.calc_scrap_length());
                    d.set_df_property("scrap_length", "description", this.calc_scrap_weight_cstr(this.calc_scrap_length()));
                },
                on_make: (e) => {
                    // console.log("on_make e:", e, this);
                    // window.ra = e;
                    // e.$input.on("keyup", (e) => {
                    //     console.log("key up e 2:", e.which);
                    // })
                },
            },
            {
                "fieldname": "bar_piece",
                "label": "下料数量(根)",
                "fieldtype": "Int",
                "reqd": 1,
                "default": this.calc_bar_cnt(),
    
            },
            {
                "fieldname": "bar_weight",
                "label": "出库总重量",
                "fieldtype": "Int",
                "reqd": 1,
                "default": this.raw_weight,
                onchange: (e) => {
                    let d = this.dialog;
                    let v = d.get_value("bar_weight") || 0;
                    let show = v != this.raw_weight;
                    d.get_field("out_piece").toggle(show);
                    d.get_field("out_piece").set_value("");
                }
            },
            {
                "fieldname": "out_piece",
                "label": "原材料使用根数",
                "fieldtype": "Int",
                "hidden": 1,
                "reqd": 1,
                "default": this.calc_raw_cnt,
            },
            {
                "fieldname": "scrap_length",
                "label": "料头长度mm",
                "fieldtype": "Int",
                "default": this.calc_scrap_length(),
                "description": this.calc_scrap_weight_cstr(this.calc_scrap_length()),
                onchange: (e) => {
                    let d = this.dialog;
                    let v = e?.target?.value || d.get_value("scrap_length") || 0;
                    d.set_df_property("scrap_length", "description", this.calc_scrap_weight_cstr(v));
                    d.set_value("scrap_weight", this.calc_scrap_weight(v))
                }
            },
            {
                "fieldname": "scrap_weight",
                "label": "料头重量kg",
                "fieldtype": "Int",
                "hidden": 1,
                "default": this.calc_scrap_weight(this.calc_scrap_length()),
            },
    
            { "fieldtype": "Section Break", },
            {
                "fieldname": "stock_entry",
                "label": "生产出库单据",
                "fieldtype": "Link",
                "options": "Stock Entry",
                "default": "",
                "get_query": () => {
                    return {
                        "filters": {
                            // "stock_entry_type": "Manufacture",
                            "stock_entry_type": "原材料下料出库",
                            "modified": [">", frappe.datetime.add_days(frappe.datetime.nowdate(), -3)],
                            "docstatus": 0,
                        },
                    }
                },
                "sort_options": 1,
            },
            {
                "fieldname": "bar_batch",
                "label": "产品批次",
                "fieldtype": "Link",
                "options": "Batch",
                "reqd": 1,
                "default": this.default_bar_batch(),
                "get_query": () => {
                    return {
                        "filters": {
                            "item": this.raw_bar_name,
                            "modified": [">", frappe.datetime.add_days(frappe.datetime.nowdate(), -10)],
                        },
                    }
                },
            },
            // 剩余长料头部分
            
            {
                "fieldname": "check_cbl",
                "label": "录入剩余长料头",
                "fieldtype": "Check",
                onchange: (e) => {
                    if (e.target.checked) {
                        this.dialog.get_field("show_cbl").show();
                        // this.dialog.get_field("out_piece").toggle(1);
                    }
                    else {
                        this.dialog.get_field("show_cbl").hide();
                        // this.dialog.get_field("out_piece").toggle(0);
                    }
                }
            },

            {
                "fieldtype": "Section Break",
                "fieldname": "show_cbl",
                "hidden": 1,
            },
            {
                "fieldname": "cbl_bar_length",
                "label": "长料头-长度",
                "fieldtype": "Int",
                onchange: (e) => {
                    let d = this.dialog;
                    let v = e?.target?.value || "xxx";
                    this.cbl_bar_name = "长料头_" + Math.floor(v/10) + "x"
                    d.set_df_property("cbl_bar_length", "description", "物料名称：" + this.cbl_bar_name);
                    d.set_value("cbl_bar_weight", this.calc_scrap_weight(v))
                }
            },
            {
                "fieldname": "cbl_bar_piece",
                "label": "长料头-根数",
                "fieldtype": "Int",
            },
            
            {
                "fieldname": "cbl_bar_weight",
                "label": "长料头-重量kg",
                "fieldtype": "Int",
            },
            {
                "fieldtype": "Section Break",
            },
            // 综合下料部分
            {
                "fieldname": "check_zhxl",
                "label": "显示综合下料",
                "fieldtype": "Check",
                onchange: (e) => {
                    // log("显示综合下料 e", e.target.checked)
                    if (e.target.checked) {
                        this.dialog.get_field("show_zhxl").show();
                        setTimeout(() => { this.set_zh_reqd(1); }, 100)
                    }
                    else {
                        this.dialog.get_field("show_zhxl").hide();
                        setTimeout(() => { this.set_zh_reqd(0); }, 100)    
                    }
                }
            },

            // 扩展综合下料部分
            {
                "fieldtype": "Section Break",
                "fieldname": "show_zhxl",
                "hidden": 1,
            },
            {
                "fieldname": "zh_semi_product",
                "label": "综合-半成品",
                "fieldtype": "Link",
                "options": "Semi Product",
                onchange: (e) => {
                    let d = this.dialog;
                    let v = this.zh_semi_product = d.get_value("zh_semi_product")
                    d.set_value("zh_raw_bar_name", v +"_短棒料");
                    frappe.db.get_value("Semi Product", v, "material_ratio").then(r => {
                        d.set_value("zh_bar_ratio", r.message.material_ratio);
                    })
                },
            },
            {
                "fieldname": "zh_raw_bar_name",
                "label": "综合-下料名称",
                "fieldtype": "Link",
                "options": "Item",
                "get_query": () => {
                    return {
                        "filters": {
                            "item_group": "短棒料",
                        }
                    }
                },
                onchange: (e) => {
                    this.zh_raw_bar_name = this.dialog.get_value("zh_raw_bar_name");
                    this.dialog.set_value("zh_bar_batch", this.default_bar_batch(null, this.zh_semi_product));
                },
            },
            {
                "fieldname": "zh_bar_ratio",
                "label": "综合-倍尺",
                "fieldtype": "Int",
                onchange: (e) => {
                    this.calc_zh_weight();
                }
            },
            {
                "fieldname": "zh_bar_piece",
                "label": "综合-下料数量(根)",
                "fieldtype": "Int",
                onchange: (e) => {
                    this.calc_zh_weight();
                }
            },
            {
                "fieldname": "zh_bar_weight",
                "label": "综合-下料重量(kg)",
                "fieldtype": "Int",
                "description": "自动计算: (倍尺 + 5mm) x 数量",
            },
            {
                "fieldname": "zh_bar_batch",
                "label": "综合-产品批次",
                "fieldtype": "Link",
                "options": "Batch",
                "get_query": () => {
                    return {
                        "filters": {
                            "item": this.zh_raw_bar_name,
                            "modified": [">", frappe.datetime.add_days(frappe.datetime.nowdate(), -10)],
                        }
                    }
                },
            },
            // 如果是单捆，开启剩余长度，数量，公斤数输入
            // 如何打开综合下料功能
        ]
        this.dialog = new frappe.ui.Dialog({
            title,
            fields: this.fields,
            // size: "small",
            primary_action_label: primary_label,
            primary_action: (values) => {
                values.raw_name = this.raw_name;
                values.raw_weight = this.raw_weight;
                values.batchs = this.batchs;
                values.diameter =this.diameter
                values.crap_weight = this.calc_scrap_weight(values.scrap_length);
                values.cbl_bar_name = this.cbl_bar_name
                this.send_back_data(values);
            },
            secondary_action_label: __("关闭"),
            secondary_action: () => this.dialog.hide(),
        })

        this.dialog.show()

        // bbl.d2 = this;
        // window.d2 = this.dialog;
        
        window.dfc = this.dialog.get_field("stock_entry");
        // console.log("bbl.d2", bbl.d2);
    }


    send_back_data(values) {
        // console.log("product_out_send_values values:", values);
        frappe.call({
            method: "bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry",
            args: values
        }).then(r => {
            // console.log("make_out_entry:", r)
            // frappe.show_progress('Loading..', 20, 100, '正在处理...', true);
            if (r.message) {
                frappe.show_alert({
                    message: __("新建出库草稿成功"),
                    indicator: "green"
                });
                // frappe.show_progress('Loading..', 100, 100, '新建出库草稿成功', true);
                frappe.set_route("Form", "Stock Entry", r.message);
                // setTimeout(() => {
                //     // frappe.set_route("Form", "Stock Entry", r.message);
                //     // frappe.cur_frm.refresh();
                //     frappe.cur_frm.reload_doc();
                // }, 2000);
            }
        })
    
    }
    



}


















function product_out_dialog(total) {
    // 调用前获取短棒料，半成品的名称
    console.log("product_out total:", total);

    let d = new bbl.Raw2BarDialog(total, r => {
        console.log("dialog return:", r);
        product_out_send_values(values);
    });



    // let d = new frappe.ui.Dialog({
    //     title: '生产出库',
    //     fields: [

    //     ],
    //     size: 'small',
    //     primary_action_label: '生产出库',
    //     primary_action(values) {
    //         d.hide();
    //         values.total = total;
    //         values.raw_name = total.name;
    //         values.raw_weight = total.weight;
    //         values.batchs = total.batchs;
    //         // 校验
    //         // 进行后台出库操作
    //         product_out_send_values(values)
    //     }
    // })
    // d.show();
}


function pr_send_items(items) {
    // frappe.show_progress('Loading..', 20, 100, '正在处理...', true);
    frappe.call({
        method: "bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.pr_send_items",
        args: {
            items
        }
    }).then(r => {
        console.log("pr_send_items rt:", r)
        if (r.message) {
            // frappe.show_alert({
            //     message: __("建立入库草稿成功"),
            //     indicator: "green"
            // });
            // frappe.show_progress('Loading..', 100, 100, '处理完成', true);
            // frappe.new_doc("Purchase Receipt", r.message);
            let doctype = "Purchase Receipt";
            let new_pr_doc;
            frappe.model.with_doctype(doctype, () => {
                new_pr_doc = frappe.model.get_new_doc(doctype)
                children = r.message.items;
                children.forEach(item => {
                    c = frappe.model.add_child(new_pr_doc, "items");
                    item.item_name = item.item_code;
                    item.rejected_warehouse = "";
                    // item.rate = undefined;
                    Object.assign(c, item);
                    // console.log("c:", c);
                })
                delete r.message.items;
                Object.assign(new_pr_doc, r.message);
                new_pr_doc.buying_price_list = "原材料价格表";
                // new_pr_doc.price_list_rate = 1;
                console.log("new_pr_doc:", new_pr_doc);
                frappe.ui.form.make_quick_entry(doctype, null, null, new_pr_doc)
                    .then((r) => {
                        frm1 = cur_frm;
                        console.log("frm_r:", r);
                        console.log("frm1", frm1);
                        // resolve();
                    })
                // frappe.set_route("Form", doctype, new_pr_doc.name);
            });

        }
    })

}

function out_2(doc) {
    frappe.db.get_doc("Steel Batch", doc.name).then(d => {
        out_3(d);
    })
}

function out_3(doc) {
    // console.log("out_3:", doc);
    let d = new frappe.ui.Dialog({
        title: '出库:' + doc.name.bold(),
        fields: [
            {
                "fieldname": "weight",
                // "label": "出库重量" + String(doc.remaining_weight).bold() + "kg",
                "label": "出库重量(kg):" + String(doc.weight).bold(),
                "fieldtype": "Int",
                "default": doc.weight,
                "reqd": 1,
            },
            {
                "fieldname": "steel_piece",
                "label": "长度1(根)：" + String(doc.length).bold() + "mm",
                "fieldtype": "Int",
                "default": doc.steel_piece,
            },
            {
                "fieldname": "piece2",
                "label": "长度2(根)：" + String(doc.length2).bold() + "mm",
                "fieldtype": "Int",
                "default": doc.piece2,
                // "default": 0,
            },
            {
                "fieldname": "piece3",
                "label": "长度3(根)：" + String(doc.length3).bold() + "mm",
                "fieldtype": "Int",
                "default": doc.piece3,
            },
            {
                "fieldname": "to_length",
                "label": "剩余长度mm",
                "fieldtype": "Int",
            },
            {
                "fieldname": "to_weight",
                "label": "剩余重量kg",
                "fieldtype": "Int",
            },
        ],
        size: 'small',
        primary_action_label: '出库',
        primary_action(values) {
            d.hide();
            // 校验是不是全部根数和，全部重量
            in_piece = (values.steel_piece || 0) + (values.piece2 || 0) + (values.piece3 || 0);
            console.log("四个数字:", in_piece, doc.remaining_piece, values.weight, doc.weight)
            // if (in_piece !== doc.remaining_piece || values.eight !== doc.weight)
            //     frappe.show_alert({ "title": "提示", message: "不上全部出库？", "indicator": "red" });
            if (doc.warehouse_area === values.warehouse_area) {
                frappe.msgprint({ "title": "提示", message: "错误", "indicator": "red" });
            } else {
                // frappe.show_progress('Loading..', 0, 100, '出库...');
                values.batch_on = doc.name;
                send_out_values(values, doc);
            }
        }
    })
    d.show();
};

function send_out_values(values, doc) {
    // console.log("send_out_values values:", values, doc);
    frappe.call({
        method: "bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry",
        args: values
    }).then(r => {
        // console.log("make_out_entry:", r)
        // frappe.show_progress('Loading..', 100, 100, '出库成功', true);
        if (r.message) {
            frappe.show_alert({
                message: __("出库成功"),
                indicator: "green"
            });
            // frappe.set_route("Form", "Temp Barcode", r.message);
        }
    })

}

function into_area(doc, new_area) {
    frappe.db.set_value("Steel Batch", doc.name, "warehouse_area", new_area,
        (res) => {
            frappe.get_list_view("Steel Batch").refresh();
            frappe.show_progress('Loading..', 100, 100, '转库中...', true);
        }
    );

};


