frappe.listview_settings["Semi Product Operate"] = {

    onload: function (listview) {

        // 去掉 编辑/删除 按钮
        listview.page.actions.find('[data-label="%E7%BC%96%E8%BE%91"],[data-label="打印"]').parent().parent().remove();
        
    }

}
