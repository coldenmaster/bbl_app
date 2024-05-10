frappe.listview_settings["Steel Batch"] = {

    // hide_name_column: true, // hide the last column which shows the `name`
    hide_name_filter: true, // hide the default filter field for the name column
  
	add_fields: [
		"status",
		"warehouse_area",
	],
    filters: [
        ["status", "!=", "出完"]
    ],
    list_view: "", 
    _this: this,
    trans_area2: function () {
        console.log("this", this);
        console.log("trans_area2", this.list_view);
        this.list_view.page.set_indicator('示', 'dark green')
    },
    func1: function (me) {
        console.log("func1");
    },
    onload: function (listview) {
        console.log("onload");
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
                frappe.msgprint("请选择要转库的批次");
                
            } else {
                frappe.msgprint("只能选择一个批次");
            }
            
        });

        // listview.page.add_action_item(__("Purchase Receipt"), () => {
        //     console.log("选择条目后才会显示")
		// 	erpnext.bulk_transaction_processing.create(listview, "Purchase Receipt", "Purchase Invoice");
		// });

        page.add_inner_button('采购入库', () => {
            listview.page.set_indicator('指示2', 'orange');
            let items2 = listview.get_checked_items();
            frappe.new_doc("Purchase Receipt", null).then(() => {
                doc2 = cur_frm.doc;
                cur_frm.clear_table("items");
                for (let i in items2){
                    if (items2[i].status === "未入库") {
                        child = frappe.model.add_child(doc2, "items");
                        child.item_group = "原材料";
                        // frappe.model.set_value(child.doctype, child.name, "item_code", items2[i].raw_name);
                        frappe.model.set_value(child.doctype, child.name, "serial_and_batch_bundle",  "YGRK-" + items2[i].name);
                    }
                }

            });

        });

        page.change_inner_button_type('采购入库', null, 'warning');
        page.add_inner_button('出库', () => {
            me.func1();
            listview.page.set_indicator('指示3', 'green')
        });
        page.change_inner_button_type('出库', null, 'success');
  

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

    // add a custom button for each row
    button: {
        show(doc) {
            return doc.status === "已入库" || doc.status === "半出库" || doc.status === "未入库";
        },
        get_label(doc) {
            if (doc.status === "已入库" || doc.status === "半出库") 
                return "转库区";
            if (doc.status === "未入库") 
                return "入库";
        },
        get_description(doc) {
            return __("View {0}", [` ${doc.name}`])
        },
        action(doc, b2) {
            // frappe.set_route("Form", doc.status, doc.name);
            let lv =  frappe.get_list_view("Steel Batch");
            if (doc.status === "已入库" || doc.status === "半出库") {
                trans_area(doc);
            }
            if (doc.status === "未入库") {
                console.log("入库 doc", doc, this, b2, lv);
                frappe.msgprint({ "title": "提示", message: "功能暂未实现", "indicator": "red" });
            }
        }
    },
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

function into_area(doc, new_area) {
    frappe.db.set_value("Steel Batch", doc.name, "warehouse_area", new_area,
        (res) => {
            frappe.get_list_view("Steel Batch").refresh();
            frappe.show_progress('Loading..', 100, 100, '转库中...', true);
        }
    );

};


