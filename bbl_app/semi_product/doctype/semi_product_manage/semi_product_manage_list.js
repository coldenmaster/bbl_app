frappe.listview_settings["Semi Product Manage"] = {

    // hide_name_column: true, // hide the last column which shows the `name`
    // hide_name_filter: true, // hide the default filter field for the name column

    // add_fields: [
    //     "status",
    //     "warehouse_area",
    // ],
    // filters: [
    //     ["status", "!=", "出完"]
    // ],
    list_view: "",

    onload: function (listview) {
        this.list_view = listview;
        let page = listview.page;

        // listview.page.add_menu_item("锻坯分检", function () {
        //     items = listview.get_checked_items();
        //     if (items.length === 1) {
        //         console.log(items);
        //         trans_area(items[0]);
        //     } else if (items.length === 0) {
        //         frappe.msgprint({ "title": "提示", message: "请选择要转库的批次", "indicator": "red" });
        //     } else {
        //         frappe.msgprint({ "title": "提示", message: "只能选择一个批次", "indicator": "red" });
        //     }
        // });

        // listview.page.add_menu_item("设置半成品", function () {
        //     show_set_semi_dialog();
        // });

        page.add_inner_button('锻坯分检', () => {
            // let items = listview.get_checked_items();
            // items = items.filter(item => item.status === "未入库");
            // // console.log("items", items);
            // if (items.length === 0) {
            //     frappe.msgprint({ "title": "提示", message: "请选择'未入库'批次", "indicator": "red" });
            //     return
            // }
            // purchase_receipt(items, listview);
        });
        page.change_inner_button_type('锻坯分检', null, 'warning');

        page.add_inner_button('通用操作', () => {
            make_main_op_dialog(listview);
        }).addClass("btn-primary");
        // page.change_inner_button_type('通用操作', null, 'info');

        page.add_inner_button('锻坯调质', () => {
            let items = listview.get_checked_items();
            items = items.filter(item => item.status === "未入库");
            // console.log("items", items);
            if (items.length === 0) {
                frappe.msgprint({ "title": "提示", message: "请选择'未入库'批次", "indicator": "red" });
                return
            }
            purchase_receipt(items, listview);
        }, '子菜单');



    }

}

function make_main_op_dialog(list_view) { 
    log("make_main_op_dialog list_view:", list_view);
//     let main_dialog = new frappe.ui.Dialog({
//         title: "通用操作",
//         fields: [
//             { fieldtype: "Link", label: "操作类型", options: "Operation Type", fieldname: "operation_type", reqd: 1 },
//         ]
//     });
//     main_dialog.show()
// }
    let main_dialog = new SemiOperationDialog(list_view, r => {
        console.log("main_dialog callback:", r);
    })
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
            { fieldtype: "Link", label: "操作类型", options: "Operation Type", fieldname: "operation_type", reqd: 1 },

        //     {
        //         // "fieldname": "d0",
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