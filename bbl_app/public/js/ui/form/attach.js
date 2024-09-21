log("加载 wt ControlAttach")
frappe.ui.form.ControlAttach = class ControlAttach extends frappe.ui.form.ControlAttach {
    clear_attachment() {
        frappe.confirm("确定要删除,并进行文档保存吗？", () => {
            super.clear_attachment();
        })
    }

}