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
            let items = listview.get_checked_items();
            items = items.filter(item => item.status === "未入库");
            // console.log("items", items);
            if (items.length === 0) {
                frappe.msgprint({ "title": "提示", message: "请选择'未入库'批次", "indicator": "red" });
                return
            }
            purchase_receipt(items, listview);
        });
        page.change_inner_button_type('锻坯分检', null, 'warning');

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