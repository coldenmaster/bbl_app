frappe.listview_settings["Short Raw Bar"] = {

    // hide_name_column: true, // hide the last column which shows the `name`
    // hide_name_filter: true, // hide the default filter field for the name column

    add_fields: ['remaining_piece', 'total_piece', 'semi_product'],  // 重要从后端需获取的字段（除了显示的以外的）

    filters: [
        // ["remaining_piece", "!=", 0],
        ["status", "!=", "用完"],
        // ["status", "!=", "锻造wip"],
        // ["status", "not in", ["用完", "锻造wip"]],
    ],

    list_view: null,
    page: null,

    onload: function(listview) {
        // console.log("onload", frappe.user_roles)
        console.log("短棒料2 list, onload")

        this.list_view = listview;
        lv = listview;
        let page = this.page = listview.page;

        let rolse = frappe.user_roles;
        // if (!(rolse.includes("Administrator") || rolse.includes("Manual Invoice"))) {
        if (!(rolse.includes("Administrator"))) {
        //   $(".btn-primary").hide();
          listview.page.actions.find('[data-label="Edit"],[data-label="%E5%88%A0%E9%99%A4"],[data-label="Assign To"]').parent().parent().remove()
        }

        page.add_inner_button('转锻坯登记', () => {
            let items = listview.get_checked_items();
            if (items.length != 1) {
                frappe.msgprint({ "title": "错误", message: "请只选择一条记录", indicator: "red" });
                return
            }
            if (!items[0].remaining_piece) {
                frappe.msgprint({ "title": "错误", message: "剩余数量为零", indicator: "red" });
                return
            }
            if (items[0].name.startsWith("CLT")) {
                frappe.msgprint({ "title": "错误", message: "长料头需要先转为对应产品的短棒料", indicator: "red" });
                return
            }
            // items = items.filter(item => !["用完", "锻造wip"].includes(item.status));
            make_dialog_promise(items).then(
                (r) => {
                    listview.clear_checked_items();
                    setTimeout(() => {
                        listview.refresh();
                    }, 500)
                }
            );
        });
        page.change_inner_button_type('转锻坯登记', null, 'info');

        
        page.add_inner_button('处理工单', () => {
            let items = listview.get_checked_items();
            if (items.length != 1) {
                frappe.msgprint({ "title": "错误", message: "请只选择一条记录", indicator: "red" });
                return
            }
            if (!items[0].wip_piece) {
                frappe.msgprint({ "title": "错误", message: "锻坯登记数量为零", indicator: "red" });
                return
            }
            select_work_order_dialog(items[0]);
        });
        page.change_inner_button_type('处理工单', null, 'success');


        page.add_inner_button('工单列表', () => {
            frappe.set_route("List", "Work Order");
        }, __("More"));
        page.change_inner_button_type('工单列表', null, 'warning');

        
        page.add_inner_button('名称转换', () => {
            log("名称转换");
            let items = listview.get_checked_items();
            if (items.length != 1) {
                frappe.msgprint({ "title": "错误", message: "请只选择一条记录", indicator: "red" });
                return
            }
            if (!items[0].remaining_piece) {
                frappe.msgprint({ "title": "错误", message: "剩余数量为零", indicator: "red" });
                return
            }
            // 名称转换,建物料转移单
            make_change_name_dialog(items);

        }, __("More"));
        // page.change_inner_button_type('名称转换', null, 'info');

        
        page.add_inner_button('wip退回', () => {
            let items = listview.get_checked_items();
            if (items.length != 1) {
                frappe.msgprint({ "title": "错误", message: "请只选择一条记录", indicator: "red" });
                return
            }
            if (!items[0].wip_piece) {
                frappe.msgprint({ "title": "错误", message: "锻坯登记数量为零", indicator: "red" });
                return
            }
            cancel_wo_retrieve_wip(items[0]);
        }, __("More"));
        
    },
    
    before_render: function() {
        // test_out(this.list_view);
        // test_1(this.list_view);
    },

  
    get_indicator: function (doc) {
		var colors = {
			未使用: "green",
			半使用: "orange",
			余料: "red",
			锻造wip: "blue",
			部分锻造: "blue",
			出完: "gray",
			Working: "orange",
			"Pending Review": "orange",
			Cancelled: "dark grey",
		};
		return [doc.status, colors[doc.status], "status,=," + doc.status];
	},
};

function test_1(listview) {
    console.log("test_1")
    select_work_order_dialog(listview.data[0]) 

}

function cancel_wo_retrieve_wip(list_item) {
    frappe.confirm("确定取消加工" + cstr(list_item.wip_piece).bold() + "根，<br>并退回短棒料到下料车间？", 
        () => {
            log("confirm", list_item); 
            frappe.call({
                method: "bbl_app.semi_product.doctype.short_raw_bar.short_raw_bar.cancel_wo_retrieve_wip",
                args:  {
                    srb_name: list_item.name,
                    qty: list_item.wip_piece,
                }
            }).then(r => {
                log("bar cancel_wo_retrieve_wip", r);
                if (!r.exc) {
					// let doc = frappe.model.sync(r.message);
                    // frappe.route_options = { "stock_entry_type": "Wip Retrieve" };
					// frappe.set_route("Form", doc[0].doctype, doc[0].name);
                    cur_list.clear_checked_items();
                    cur_list.refresh();
        
				}
           })
        }
    );
}

function select_work_order_dialog(item) {
    let semi_product = item.semi_product
    let wo_product = semi_product + "_锻坯登记"
    let wo_qty = 0
    let wo_d = new frappe.ui.Dialog({
        title: '选择工单'.bold(),
        fields: [
            {
                fieldname: 'work_order', 
                // fieldtype: 'Link', 
                fieldtype: 'Select', 
                label: '完成工单',
                options: '没有获取到\n请等待\n', 
                description: "工单产品：" + wo_product,
                reqd: 1,
                // "get_query": () => {
                //     return {
                //         "filters": {
                //             'production_item': wo_product,
                //             'status': 'In Process'
                //         }
                //     }
                // },
                onchange: (e) => {
                    let d = wo_d;
                    let v = e?.target?.value || d.get_value("work_order") || "";
                    if (! v) {
                        d.set_value("out_piece", "")
                        return
                    }
                    frappe.model.with_doc("Work Order", v, (nam, doc) => {
                        // log("doc name", nam, doc)
                    }).then(
                        (doc) => {
                            log("doc12", doc)
                            wo_qty = doc.material_transferred_for_manufacturing - doc.produced_qty
                            d.set_value("out_piece", wo_qty)     
                        }
                    )
                }
            },
            {
                "fieldname": "out_piece",
                "label": "完成数量",
                "fieldtype": "Int",
                "reqd": 1,
                "default": item.wip_piece,
                "description": "工单内的" + "锻坯登记数量".bold() + ",如未全部完成,余料将被退回短棒料仓库",
            },
            // {
            //     "fieldname": "forge_batch_no",
            //     "label": "锻造批次号",
            //     "fieldtype": "Data",
            //     // "default": "dp-123456",
            // },
        ],
        primary_action_label: '确认',
        size: "small",
        primary_action(values) {
            if (values.out_piece > wo_qty)
                frappe.throw("完成数量不能大于工单数量")
            values.wo_qty = wo_qty
            Object.assign(values, item);
            console.log("values:", values);
            cur_list?.clear_checked_items();
            work_order_done(values);
            wo_d.hide(); 
        }
    })
    let wo_df = wo_d.get_field("work_order");
    frappe.db.get_value("Short Raw Bar", item.name, "voucher_no").then(r => {
        wo_df_opt_obj = JSON.parse(r.message.voucher_no)
        // todo 这里需要对work_order根据剩余的生产数量进行过滤,数量不为0的进行显示,
        // todo 工单提交完成后对voucher_no中的数量进行更新（暂时只完成了获取和显示）
        // options = wo_df_opt_obj.reduce((r, v) => r + v.voucher_no + "\n", "")
        options = wo_df_opt_obj.reduce((r, v) => 
        {
            if (v.voucher_qty > 0)
                r = r + v.voucher_no + "\n", ""
            return r
        }, "")
        // log(options)
        wo_df.df.options = options
        wo_df.set_options(options[0])
        wo_df.df.onchange()
    })

    wo_d.show();

    // window.df = wo_df;
}

function work_order_done(values) {
    frappe.call({
        method: "bbl_app.semi_product.doctype.short_raw_bar.short_raw_bar.work_order_done",
        args: values,
    }).then(r => {
        // log("bar work_order_done", r);
        if (r.message) {
            frappe.msgprint({ "title": "完成", message: "工单完成", "indicator": "blue", alert: true});
            setTimeout(() => {
                frappe.set_route("Form", "Work Order", r.message);
                setTimeout(() => {
                    cur_frm.reload_doc();
                }, 500)
            }, 500)
        } else {
            frappe.msgprint({ "title": "错误", message: "服务器返回信息为空", "indicator": "red" });
        }
    })
}

function make_change_name_dialog(items) {
    return new Promise((resolve, reject) => {
        const s_name = items[0].raw_bar_name;
        // const s_batchs = items.length;
        const s_piece = items.reduce((a, b) => a + b.remaining_piece, 0);
        const t_name = s_name.split("_")[0];
        frappe.prompt([
            {
                "options": "原生产产品:&emsp;" + t_name.bold() + " / " + cstr(s_piece).bold() + "根",
                "fieldtype": "HTML",
            },
            { "fieldtype": "Section Break", },
            {
                "fieldname": "semi_product",
                "label": "更改为",
                "fieldtype": "Link",
                "options": "Semi Product",
                "reqd": 1,
                // "description": "更换生产的半成品",
                "default": "06240",
            }],
            function (values) {
                // let opts = { 
                //     stock_entry_type: "Repack",
                //     items: [
                //         {
                //             "item_code": s_name,
                //             "qty": s_piece,
                //             "s_warehouse": "短棒料仓 - 百兰",
                //             "uom": "根",
                //         },
                //         {
                //             "item_code": values.semi_product + "_短棒料",
                //             "qty": s_piece,
                //             "t_warehouse": "短棒料仓 - 百兰",
                //             "uom": "根",
                //         }
                //     ]
                // };
                change_srb_name(items[0].name, values.semi_product, s_piece)
                resolve("values ok");
            },
            "更改短棒料的半成品名称",
            "确认"
        );
    })
}




function make_dialog_promise(items) {
    return new Promise((resolve, reject) => {
        console.log("make_dialog_promise items:", items);
        // 1.构造选择列表对话框,可以挑选不同批次的数量,输入根数
        // 2.or 直接根据选择进行确认,然后自动创建完成bom,生产工单,生产发料单 （use）
        const s_name = items[0].raw_bar_name;
        const s_batchs = items.length;
        const s_piece = items.reduce((a, b) => a + b.remaining_piece, 0);
        const t_name = s_name.split("_")[0];
        frappe.prompt([
            {
                // "label": "出库产品:&emsp;" + s_name.bold(),
                "options": "出库产品:&emsp;" + s_name.bold(),
                "fieldtype": "HTML",
            },
            {
                "options": "批次数量:&emsp;" + (cstr(s_batchs) + " 批次").bold(),
                "fieldtype": "HTML",
            },
            {
                "options": "总根数:&emsp;&emsp;" + (cstr(s_piece) + " 根").bold(),
                "fieldtype": "HTML",
            },
            { "fieldtype": "Section Break", },
    
            {
                "fieldname": "semi_product",
                "label": "投产半成品名称",
                "fieldtype": "Link",
                "options": "Semi Product",
                "reqd": 1,
                "read_only": 1,
                "description": "确认后,会自动创建完成：bom,生产工单,生产发料单",
                "default": t_name,
            }],
            function (values) {
                values.items = items;
                console.log("values:", values);
                product_out(values);
                resolve("values ok");
            },
            "短棒料转入锻造车间锻坯登记库",
            "确认"
        );
    })
}


function product_out(values) {
    console.log("product_out to backend:", values);
    frappe.call({
        method: "bbl_app.semi_product.doctype.short_raw_bar.short_raw_bar.product_out",
        args: values
    }).then(r => {
        // log("bar product_out", r);
        if (r.message) {
            // frappe.set_route("Form", "Work Order", r.message);
            frappe.msgprint("建立工单" + r.message.bold() + ",并完成锻坯登记发料", "完成");
        }
    })
}

function change_srb_name(old_sbr_doc_id, new_product_name, qty) {
    // console.log("change_srb_name to backend:", old_sbr_doc_id, new_product_name, qty);
    frappe.call({
        method: "bbl_app.semi_product.doctype.short_raw_bar.short_raw_bar.change_srb_name",
        args: {
            old_sbr_doc_id, new_product_name, qty
        },
    }).then(r => {
        log("r change_srb_name", r);
        if (r.message) {
            // frappe.set_route("Form", "Work Order", r.message);
            cur_list.clear_checked_items();
            cur_list.refresh();
            frappe.msgprint("更改产品名称为" + new_product_name.bold() + "成功！", "完成");
        }
    })
}

function test_out(listview) {
    let items = [listview.data[0]];
    console.log("测试 test_out items:", listview, items);
    make_dialog(items);
}