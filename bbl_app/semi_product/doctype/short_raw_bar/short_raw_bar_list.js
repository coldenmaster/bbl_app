frappe.listview_settings["Short Raw Bar"] = {

    hide_name_column: true, // hide the last column which shows the `name`
    hide_name_filter: true, // hide the default filter field for the name column

    // add_fields: ['remaining_piece', 'total_piece'],  // 重要从后端需获取的字段（除了显示的以外的）

    filters: [
        // ["remaining_piece", "!=", 0],
        ["status", "!=", "用完"],
        // ["status", "!=", "锻造车间wip"],
        // ["status", "not in", ["用完", "锻造车间wip"]],
    ],

    list_view: null,
    page: null,

    onload: function(listview) {
        // console.log("onload", frappe.user_roles)
        console.log("短棒料2 list, onload")

        this.list_view = listview;
        let page = this.page = listview.page;

        let rolse = frappe.user_roles;
        // if (!(rolse.includes("Administrator") || rolse.includes("Manual Invoice"))) {
        if (!(rolse.includes("Administrator"))) {
        //   $(".btn-primary").hide();
          listview.page.actions.find('[data-label="Edit"],[data-label="%E5%88%A0%E9%99%A4"],[data-label="Assign To"]').parent().parent().remove()
        }

        page.add_inner_button('生产出库', () => {
            // 同名称的短棒料，可以一起投产
            let items = listview.get_checked_items();
            console.log("生产出库 items:", items);
            // items = items.filter(item => !["用完", "锻造车间wip"].includes(item.status));
            items = items.filter(item => item.remaining_piece != 0);
            let item_name = items.map(item => item.raw_bar_name);
            if (new Set(item_name).size != 1) {
                frappe.msgprint("请选择同名称的短棒料");
                return;
            }

            // make_dialog(items);
            make_dialog_promise(items).then(
                (r) => {
                    log("r is 2",r);
                    listview.clear_checked_items();
                    setTimeout(() => {
                        listview.refresh();
                    }, 3000)
                }
            );
            
        });
        page.change_inner_button_type('生产出库', null, 'info');


    },
    
    before_render: function() {
        // test_out(this.list_view);
        // test_1();
    },

  
    get_indicator: function (doc) {
		var colors = {
			未使用: "green",
			半使用: "orange",
			余料: "red",
			锻造车间wip: "blue",
			出完: "gray",
			Working: "orange",
			"Pending Review": "orange",
			Cancelled: "dark grey",
		};
		return [doc.status, colors[doc.status], "status,=," + doc.status];
	},
};

function test_1() {
    console.log("test_1")

}

function make_dialog_promise(items) {
    return new Promise((resolve, reject) => {
        console.log("make_dialog_promise items:", items);
        // 1.构造选择列表对话框，可以挑选不同批次的数量，输入根数
        // 2.or 直接根据选择进行确认，然后自动创建完成bom，生产工单，生产发料单 （use）
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
                "description": "确认后，会自动创建完成：bom，生产工单，生产发料单",
                "default": t_name,
            }],
            function (values) {
                values.items = items;
                console.log("values:", values);
                product_out(values);
                resolve("values ok");
            },
            "短棒料生产出库",
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
        log("bar product_out", r);
        if (r.message) {
            frappe.show_alert({
                message: __("处理成功"),
                indicator: "green"
            });
            // frappe.set_route("Form", "Stock Entry", r.message);

        }
    })
}

function test_out(listview) {
    let items = [listview.data[0]];
    console.log("测试 test_out items:", listview, items);
    make_dialog(items);
}