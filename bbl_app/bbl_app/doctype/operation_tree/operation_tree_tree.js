frappe.provide("frappe.treeview_settings");

frappe.treeview_settings["Operation Tree"] = {
	// breadcrumb: "Accounts",
	title: __("Operation Tree"),

	root_label: "工序", // ?
	// get_tree_root: false, // ?

    // filters:[
	// 	{
	// 		fieldname: "root_company",
	// 		fieldtype: "Data",
	// 		label: __("Root Company"),
	// 		// hidden: true,
	// 		disable_onchange: true,
	// 	},
    // ],
    onload: function (treeview) {
        log("on_load");
        
    },
    post_render: function (treeview) {
        log("post_render", );   
    },
    on_get_node: function (nodes, deep = false) {
        log("on_get_node", nodes, deep);
    },
    
    
	// get_tree_nodes: "frappe.desk.treeview.get_children",
	// get_tree_nodes: "erpnext.accounts.utils.get_children",
	get_tree_nodes: "bbl_app.bbl_app.doctype.operation_tree.operation_tree.get_children",

    toolbar: [
        {
            label: "OP1",
            condition: function (node) {
                // log(node);
                return true;
            },
            click: function ($tree_node, node) {
                log($tree_node, node);
            },
            btnClass: "hidden-xs",
        },
    ],
    extend_toolbar: true,

}