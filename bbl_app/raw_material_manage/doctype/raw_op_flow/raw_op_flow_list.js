frappe.listview_settings["Raw Op Flow"] = {

    hide_name_column: true, // hide the last column which shows the `name`
    hide_name_filter: true, // hide the default filter field for the name column

    add_fields: ['op_type',],  // 重要从后端需获取的字段（除了显示的以外的）

    onload: function(listview) {
        // console.log("onload", frappe.user_roles)
        let rolse = frappe.user_roles;
        // if (!(rolse.includes("Administrator") || rolse.includes("Manual Invoice"))) {
        if (!(rolse.includes("Administrator"))) {
        //   $(".btn-primary").hide();
          listview.page.actions.find('[data-label="Edit"],[data-label="%E5%88%A0%E9%99%A4"],[data-label="Assign To"]').parent().parent().remove()
        }
    },
    before_render: function() {
        console.log("before_render")
    },

    get_indicator: function (doc) {
        // console.log("get_indicator", doc)
        var colors = {
            // 未入库: "orange",
            "原材料入库": "green",
            "原材料出库": "orange",
            "短棒料发料wip": "blue",
            // 草稿: "purple",
            // 出完: "gray",
            // "Pending Review": "orange",
            Cancelled: "dark grey",
        };
        return [doc.op_type, colors[doc.op_type], "op_type,=," + doc.op_type];
        // return [doc.op_type, colors[doc.op_type], "status,=," + doc.status]; //（ok）
        // return [doc.op_type, colors[doc.op_type], "status,=," + doc.op_type]; //（x）
    },


}