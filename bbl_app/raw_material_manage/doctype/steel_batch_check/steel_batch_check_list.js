frappe.listview_settings["Steel Batch Check"] = {

    onload: function (listview) {
        let page = listview.page;

        page.add_inner_button('库存比对', () => {
            check_area_select_dialog();
        })
        page.change_inner_button_type('库存比对', null, 'info');

        page.add_inner_button('清空盘仓数据', () => {
            show_area_select_dialog();
        })
        page.change_inner_button_type('清空盘仓数据', null, 'danger');

    },

    get_indicator: function (doc) {
		var colors = {
			在库: "green",
			无此批号: "red",
			已出完: "yellow",
			Working: "orange",
			"Pending Review": "orange",
			Cancelled: "dark grey",
		};
        let color = (doc.status in colors) ? colors[doc.status] : "blue";
		// return [doc.status, colors[doc.status], "status,=," + doc.status];
		return [doc.status, color, "status,=," + doc.status];
	},

}

function check_area_select_dialog() {
    let dialog = new frappe.ui.Dialog({
        title: '选择盘仓库区',
        fields: [
            {
                "fieldname": "area",
                "label": "对比库区",
                "fieldtype": "Link",
                "options": "Warehouse Area",
                "reqd": 1,
            }
        ],
        primary_action: function (values) {
            check_process(values);
            dialog.hide();
        }
    });
    dialog.show();
}

function check_process(values) {
    // console.log(values);
    frappe.call({
        method: "bbl_app.raw_material_manage.doctype.steel_batch_check.steel_batch_check.check_process",
        args: values,
        callback: function (r) {
            show_check_result(r.message);
            frappe.show_alert({
                message: '比对完成',
                indicator: 'green'
            });
        }
    })
}

function show_check_result(msg) {
    console.log("sbc", msg);
    let sbc_fields = [];
    for (let i = 0; i < msg.only_in_sbc.length; i++) {
        sbc_fields.push({
            "index": i + 1,
            "batch_no": msg.only_in_sbc[i].name,
            "status": msg.only_in_sbc[i].status,
            "piece": msg.only_in_sbc[i].steel_piece,
        })
    }
    let sb_fields = [];
    for (let i = 0; i < msg.only_in_sb.length; i++) {
        sb_fields.push({
            "index": i + 1,
            "batch_no": msg.only_in_sb[i].name,
            "status": msg.only_in_sb[i].warehouse_area,
            "piece": msg.only_in_sb[i].steel_piece,
        })
    }
    const dialog = new frappe.ui.Dialog({
        title: __("比对结果"),
        fields: [
            {
                "fieldname": "d0",
                "label": "只在盘点表: " + String(msg.sbc_cnt).bold() + " 捆",
                "fieldtype": "Heading",
            },    
            { fieldtype: "Column Break" },
            {
                "fieldname": "d1",
                "label": "只在仓库: " + String(msg.sb_cnt).bold() + " 捆",
                "fieldtype": "Heading",
            },    
            { fieldtype: "Column Break" },
            {
                "fieldname": "d2",
                "label": "都在: " + String(msg.both_in).bold() + " 捆",
                "fieldtype": "Heading",
            },            
            {
                "fieldname": "d4",
                "fieldtype": "Section Break",
            },
            {
                fieldname: "sbc_table",
                fieldtype: "Table",
                label: "只在盘点表中".bold(),
                // read_only: 1,
                in_place_edit: true,
                // reqd: 1,
                fields: [
                    {
                        fieldname: "index",
                        label: __("Index"),
                        fieldtype: "Int",
                        read_only: 1,
                        in_list_view: 1,
                        columns: 1,
                    },
                    {
                        fieldname: "batch_no",
                        label: __("Batch No"),
                        fieldtype: "Link",
                        options: "Steel Batch Check",
                        read_only: 1,
                        reqd: 1,
                        in_list_view: 1,
                    },
                    {
                        fieldname: "status",
                        label: __("Status"),
                        fieldtype: "Data",
                        read_only: 1,
                        in_list_view: 1,
                    },
                    {
                        fieldname: "piece",
                        label: "根数",
                        fieldtype: "Int",
                        read_only: 1,
                        in_list_view: 1,
                        columns: 1,
                    },
                ],

                on_add_row: (idx) => {
                    console.log("没发现生效位置", idx);

                },

                data: sbc_fields,
            },
            {
                fieldname: "sb_table",
                fieldtype: "Table",
                label: "只在仓库中".bold(),
                // read_only: 1,
                in_place_edit: true,
                fields: [
                    {
                        fieldname: "index",
                        label: __("Index"),
                        fieldtype: "Int",
                        read_only: 1,
                        in_list_view: 1,
                        columns: 1,
                    },
                    {
                        fieldname: "batch_no",
                        label: __("Batch No"),
                        fieldtype: "Link",
                        options: "Steel Batch",
                        reqd: 1,
                        read_only: 1,
                        in_list_view: 1,
                    },
                    {
                        fieldname: "status",
                        label: "库区",
                        fieldtype: "Data",
                        read_only: 1,
                        in_list_view: 1,
                    },
                    {
                        fieldname: "piece",
                        label: "根数",
                        fieldtype: "Int",
                        read_only: 1,
                        columns: 1,
                        in_list_view: 1,
                    },
                ],
                data: sb_fields,
                on_setup: (frm, grid) => {
                    // console.log("sb_table on_setup", frm, grid);
                }
            },
        ],
        primary_action: (values) => {
            // console.log(values)
            dialog.hide();
        },
        primary_action_label: __("Close"),
    });
    let grid = dialog.fields_dict.sbc_table.grid;
    grid.toggle_checkboxes(false);
    let grid2 = dialog.fields_dict.sb_table.grid;
    grid2.toggle_checkboxes(false);
    dialog.wrapper.find(".grid-add-row").addClass("hidden");
    dialog.wrapper.find(".row-check").addClass("hidden")

    dialog.show();
}


function show_area_select_dialog() {
    let dialog = new frappe.ui.Dialog({
        title: '选择清空库区',
        fields: [
            {
                "fieldname": "area",
                "label": "清空库区",
                "fieldtype": "Link",
                "options": "Warehouse Area",
                "reqd": 1,
            }
        ],
        primary_action: function (values) {
            console.log(values);
            clear_sb_check_db(values);
            dialog.hide();
        }
    });
    dialog.show();
}


function clear_sb_check_db(values) {
    frappe.call({
        method: "bbl_app.raw_material_manage.doctype.steel_batch_check.steel_batch_check.clear_sb_check_db",
        args: values,
        callback: function (r) {
            // console.log('rt', r, r.message);
            frappe.utils.play_sound('delete');
            cur_list.refresh();
            frappe.show_alert({
                message: '清空盘仓数据 成功',
                indicator: 'green'
            });
        }
    })
}

