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
        this.list_view = listview;
        let page = listview.page;
        let me = this;
		var method = "erpnext.projects.doctype.task.task.set_multiple_status";

		// listview.page.add_menu_item(__("采购入库b"), function () {
		// 	listview.call_for_selected_items(method, { status: "Open" });
		// });

        listview.page.add_menu_item("转库区", function () {
            console.log("转库区");
            items = listview.get_checked_items();
            if (items.length === 1) {
                console.log(items);
                trans_area(items[0]);
            } else if (items.length === 0) {
                frappe.msgprint( { "title": "提示", message: "请选择要转库的批次", "indicator": "red" });
            } else {
                frappe.msgprint( { "title": "提示", message: "只能选择一个批次", "indicator": "red" });
            }
            
        });

        // listview.page.add_action_item(__("Purchase Receipt"), () => {
        //     console.log("选择条目后才会显示")
		// 	erpnext.bulk_transaction_processing.create(listview, "Purchase Receipt", "Purchase Invoice");
		// });

        page.add_inner_button('入库0', () => {
            let items2 = listview.get_checked_items();
            items2 = items2.filter(item => item.status === "未入库");
            if (items2.length === 0) {
                frappe.msgprint( { "title": "提示", message: "请选择'未入库'批次", "indicator": "red" });
                return
            }
            // listview.page.set_indicator('采购入库', 'green');
            frappe.new_doc("Purchase Receipt", null).then(() => {
                doc2 = cur_frm.doc;
                cur_frm.clear_table("items");
                for (let i in items2){
                        child = frappe.model.add_child(doc2, "items");
                        child.item_group = "原材料";
                        // frappe.model.set_value(child.doctype, child.name, "item_code", items2[i].raw_name);
                        frappe.model.set_value(child.doctype, child.name, "serial_and_batch_bundle",  "YGRK-" + items2[i].name);
                }
            });
        });

        page.add_inner_button('采购入库', () => {
            let items = listview.get_checked_items();
            items = items.filter(item => item.status === "未入库");
            if (items.length === 0) {
                frappe.msgprint( { "title": "提示", message: "请选择'未入库'批次", "indicator": "red" });
                return
            }
            purchase_receipt(items);
        });
        page.change_inner_button_type('采购入库', null, 'warning');

        page.add_inner_button('调拨出库', () => {
            let items2 = listview.get_checked_items();
            items2 = items2.filter(item => item.status === "已入库" || item.status === "半出库");
            // console.log(items2)
            if (items2.length === 0) {
                frappe.msgprint( { "title": "提示", message: "请选择'在库'批次", "indicator": "red" });
                return
            } else if (items2.length !== 1) {
                frappe.msgprint( { "title": "提示", message: "暂时只支持单批次调拨", "indicator": "red" });
                return
            }
            listview.page.set_indicator('调拨出库', 'blue');
            // todo 这里根据items信息，做出库批次相关的准备单据
            frappe.new_doc("Stock Entry", null).then(() => {
                parent_doc = cur_frm.doc;
                // frappe.model.set_value(parent_doc.doctype, parent_doc.name, "purpose", "销售");
                cur_frm.set_value("stock_entry_type", "原钢调拨出库");
                cur_frm.set_value("to_warehouse", "原钢平仓库 - 百兰");
                cur_frm.clear_table("items");
                child = frappe.model.add_child(parent_doc, "items");
                child.item_group = "原材料";
                frappe.model.set_value(child.doctype, child.name, "item_code", items2[0].raw_name);
                // setTimeout(() => {
                // }, 1500)

            });

        });
        page.change_inner_button_type('调拨出库', null, 'success');
  

        page.add_inner_button('生产出库', () => {
            let items = listview.get_checked_items();
            items = items.filter(item => item.status === "已入库" || item.status === "半出库");
            product_out(items);
        });
        page.change_inner_button_type('生产出库', null, 'danger');
  
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
    before_render(a) {
        console.log("before_render", a)
    },
    get_indicator: function (doc) {
		var colors = {
			未入库: "orange",
			已入库: "green",
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
        // triggers when the primary action is clicked
    },

    // get_form_link(doc) {
        // console.log("get_form_link", doc)
        // override the form route for this doc
    // },
    // has_indicator_for_draft: false,

    // format how a field value is shown
    // formatters: {
    //     title(val) {
    //         return val.bold();
    //     },
    //     public(val) {
    //         return val ? "Yes" : "No";
    //     }
    // }
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
                frappe.show_progress('Loading..', 0, 100, '转库...');
                into_area(doc, values.warehouse_area);
            }
        }
    })
    d.show();
};

function purchase_receipt(items) {
    console.log("purchase_receipt items:", items);
    pr_send_items(items);


}

function product_out(items) {
    // console.log("product_out items:", items);
    // 需要是相同热处理号的
    let heat_nos = new Set(items.map(i => i.heat_no));
    let raw_name = new Set(items.map(i => i.raw_name));
    console.log("product_out raw_name:", raw_name);

    if (heat_nos.size != 1 || raw_name.size != 1) {
        frappe.msgprint({ "title": "提示", message: "请正确选择钢材批次", "indicator": "red" });
        return;
    }
    // 从后端获取items的全部信息
    let batch_nos = items.map(i => i.name);
    console.log("product_out batch_nos:", batch_nos);
    frappe.db.get_list("Steel Batch", {
        "filters": {
            "name": ["in", batch_nos]
        },
        fields: "*",
        limit: 100,
    }).then(rt_items => {
        console.log("then, items_back:", rt_items);
        // 收集总数量
        let total = {};
        total.name = rt_items[0].raw_name;
        total.bundle_cnt = rt_items.length;
        total.weight = rt_items.reduce((p, c) => p + c.remaining_weight, 0);
        total.piece = rt_items.reduce((p, c) => p + c.remaining_piece, 0);
        total.length = rt_items.reduce((p, c) => p + calc_total_length(c), 0);
        // total.items = rt_items;
        total.ratio = rt_items[0].material_ratio
        console.log("product_out total.length :", total.length, total.ratio + 5 );
        total.bar_piece = total.ratio ? parseInt(total.length / (parseInt(total.ratio) + 5)) : undefined;
        total.batchs = [];
        rt_items.forEach(i => {
            total.batchs.push({
                "batch_no": i.name,
                "weight": i.remaining_weight,
            })
        })
        console.log("product_out total:", total);
        product_out_dialog(total);

    })
}

function calc_total_length(item) {
    // console.log("calc_total_length item:", item);
    return cint(item.length) * cint(item.steel_piece)
        + cint(item.length2) * cint(item.piece2) 
        + cint(item.length3) * cint(item.piece3);
}

function product_out_dialog(total) {
    // 调用钱获取短棒料，半成品的名称
    let d = new frappe.ui.Dialog({
        title: '生产出库',
        fields: [
            {
                "fieldname": "d0",
                "label": "出库产品: \t" + total.name.bold(),
                "fieldtype": "Heading",
            },            
            {
                "fieldname": "d1",
                "label": "出库数量: \t" + String(total.bundle_cnt).bold() + "捆 / " + String(total.piece).bold() + "根",
                "fieldtype": "Heading",
            },
            {
                "fieldname": "d2",
                "label": "总长度: \t" + String(total.length).bold()+ " 毫米",
                "fieldtype": "Heading",
            },
            {
                "fieldname": "d3",
                "label": "总重量: \t" + String(total.weight).bold() + " 公斤",
                "fieldtype": "Heading",
            },
            {
                "fieldname": "d4",
                "fieldtype": "Section Break",
            },

            {
                "fieldname": "raw_bar_name",
                // "label": __("Short Raw Bar"),
                "label": "下料名称",
                "fieldtype": "Link",
                "options": "Item",
                "reqd": 1,
                "default": total.name + "_短棒料",
                // 这里增加过滤器，default使用半成品转短棒料
            },
            {
                "fieldname": "bar_radio",
                "label": "倍尺",
                "fieldtype": "Int",
                "reqd": 1,
                "default": total.ratio,
            },
            {
                "fieldname": "bar_piece",
                "label": "下料数量(根)",
                "fieldtype": "Int",
                "reqd": 1,
                "default": total.bar_piece,
            },
            {
                "fieldname": "bar_weight",
                "label": "出库总重量",
                "fieldtype": "Int",
                "reqd": 1,
                "default": total.weight,
            },
            // 如果是单捆，开启剩余长度，数量，公斤数输入
            // 如何打开综合下料功能
            // 记录剩余料头数量？
        ],
        size: 'small',
        primary_action_label: '生产出库',
        primary_action(values) {
            d.hide();
            values.total = total;
            values.raw_name = total.name;
            values.raw_weight = total.weight;
            values.batchs = total.batchs;
            // 校验
            // 进行后台出库操作
            product_out_send_values(values)
            // if (doc.warehouse_area === values.warehouse_area) {
            //     frappe.msgprint({ "title": "提示", message: "错误", "indicator": "red" });
            // } else {
            //     frappe.show_progress('Loading..', 0, 100, '出库...');
            //     values.batch_on = doc.name;
            //     send_out_values(values, doc);
            // }
        }
    })
    d.show();
}

function product_out_send_values(values) {
    console.log("product_out_send_values values:", values);
    frappe.call({
        method: "bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry",
        args: values
    }).then(r => {
        console.log("make_out_entry:", r)
        frappe.show_progress('Loading..', 20, 100, '正在处理...', true);
        if (r.message) {
            frappe.show_alert({
                message: __("出库成功"),
                indicator: "green"
            });
            frappe.show_progress('Loading..', 100, 100, '出库成功', true);
            frappe.set_route("Form", "Stock Entry", r.message);
        }
    })

}

function pr_send_items(items) {
    frappe.show_progress('Loading..', 20, 100, '正在处理...', true);
    frappe.call({
        method: "bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.pr_send_items",
        args: {
            items
        }
    }).then(r => {
        console.log("pr_send_items rt:", r)
        if (r.message) {
            frappe.show_alert({
                message: __("建立入库草稿成功"),
                indicator: "green"
            });
            frappe.set_route("Form", "Purchase Receipt", r.message);
            frappe.show_progress('Loading..', 100, 100, '处理完成', true);
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
            in_piece = (values.steel_piece||0)  +( values.piece2||0) +( values.piece3||0 );
            console.log("四个数字:", in_piece, doc.remaining_piece, values.weight, doc.weight)
            // if (in_piece !== doc.remaining_piece || values.eight !== doc.weight)
            //     frappe.show_alert({ "title": "提示", message: "不上全部出库？", "indicator": "red" });
            if (doc.warehouse_area === values.warehouse_area) {
                frappe.msgprint({ "title": "提示", message: "错误", "indicator": "red" });
            } else {
                frappe.show_progress('Loading..', 0, 100, '出库...');
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
        frappe.show_progress('Loading..', 100, 100, '出库成功', true);
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


