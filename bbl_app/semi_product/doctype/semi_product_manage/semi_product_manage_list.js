frappe.listview_settings["Semi Product Manage"] = {

    hide_name_column: true, // hide the last column which shows the `name`
    hide_name_filter: true, // hide the default filter field for the name column

    add_fields: [
        "semi_product",
        "bbl_heat_no",
    ],
    filters: [
        ["remaining_piece", ">", 0],
    ],
    list_view: "",

    get_indicator: function (doc) {
		var colors = {
			未使用: "green",
			已使用: "orange",
			余料: "red",
			用完: "gray",
			Working: "orange",
			"Pending Review": "orange",
			Cancelled: "dark grey",
		};
		return [doc.status, colors[doc.status], "status,=," + doc.status];
	},

    primary_action() {
        frappe.new_doc("Semi Product Operate");
    },


    onload: function (listview) {
        this.list_view = listview;
        let page = listview.page;


        page.add_inner_button('新建加工单', () => {
            let items = listview.get_checked_items();
            if (items.length != 1) {
                frappe.msgprint({ "title": "错误", message: "请只选择一条记录", indicator: "red" });
                return
            }
            if (!items[0].remaining_piece) {
                frappe.msgprint({ "title": "错误", message: "剩余数量为零", indicator: "red" });
                return
            }
            opts = items[0];
            opts.spm_source = opts.name;
            let temp_li = opts.semi_product_name.split('_');
            opts.semi_op_source = temp_li[temp_li.length - 1];
            opts.basket_in = '';
            log("新建操作单frm, opts属性:", opts);
            frappe.new_doc("Semi Product Operate", opts, 
               doc => { 
                //    console.log("新建操作单frm, opts属性:", opts);
                //    console.log("新建操作单frm, doc属性:", doc);
                   this.list_view.clear_checked_items();
                })
        });
        page.change_inner_button_type('新建加工单', null, 'info');

        page.add_inner_button('加工单列表', () => {
            // make_main_op_dialog(listview);
            frappe.set_route("List", "Semi Product Operate");
            // frappe.set_route("Form", "Work Order", r.message);

        // }).addClass("btn-primary");
        });
        page.change_inner_button_type('加工单列表', null, 'warning');

        // page.add_inner_button('通用操作', () => {
        //     make_main_op_dialog(listview);
        // }).addClass("btn-primary");
        // // page.change_inner_button_type('通用操作', null, 'info');
        // page.add_inner_button('锻坯调质', () => {
        //     let items = listview.get_checked_items();
        //     items = items.filter(item => item.status === "未入库");
        //     // console.log("items", items);
        //     if (items.length === 0) {
        //         frappe.msgprint({ "title": "提示", message: "请选择'未入库'批次", "indicator": "red" });
        //         return
        //     }
        //     purchase_receipt(items, listview);
        // }, '子菜单');



    }

}
