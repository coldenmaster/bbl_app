frappe.provide("frappe.treeview_settings");

frappe.treeview_settings["Semi Product Manage"] = {
    // breadcrumb: "Semi Product",
    title: "半成品流转过程",
    // get_tree_root: false,  // 意义, 为false时, 根节点为不自动显示
    // root_label: "", // ？
    // show_expand_all: false,
    tree_view: "",
    filters:[
		{
			fieldname: "semi_product",
			fieldtype: "Link",
			options: "Semi Product",
			label: __("半成品"),
			// hidden: true,
		},
		{
			fieldname: "for_date",
			fieldtype: "Date",
			label: "加工日期",
            onchange: () => {
                log("for_date onchange no e")
            }
        },
        {
            fieldname: "root_item",
            fieldtype: "Link",
			options: "Semi Product Manage",
            get_query: () => {
                return {
                    "filters": {
                        "product_form": "锻坯",
                    }
                }
            },

            label: "单独显示",
        },
		{
            fieldname: "ascent_order",
			fieldtype: "Check",
			label: "倒序",
			disable_onchange: true,
            onchange: (e) => {
                log("ascent_order onchange e", e)
            }
		},
		{
            fieldname: "refresh_bt",
			fieldtype: "Button",
			label: "刷新",
			disable_onchange: true,
            click: (e) => {
                let tree_view = frappe.views.trees["Semi Product Manage"];
                // frappe.views.trees["Semi Product Manage"] = new frappe.views.TreeView(tree_view);
                // tree_view = frappe.views.trees["Semi Product Manage"];
                log(tree_view);
                // tree_view.constructor.call(tree_view);
                tree_view.set_title();
                tree_view.make_filters();
                tree_view.make_tree();
                // tree_view.tree.refresh();
            },
            // hidden: true,
		},
    ],
    ignore_fields: ["parent_semi_product_manage"],
      // fields for a new node
    // fields: [
    //     {
    //         fieldname: "semi_product",
    //         fieldtype: "Link",
    //         options: "Semi Product",
    //         label: __("半成品"),
    //         // hidden: true,
    //     },
    //     {
    //         fieldname: "semi_product_manage_name",
    //         fieldtype: "Data",
    //         label: __("加工单号"),
    //         hidden: true,
    //     },
    // ],
	get_tree_nodes: "bbl_app.semi_product.doctype.semi_product_manage.semi_product_manage.get_children",


    onload: function (treeview) {
        log("on_load");
		frappe.treeview_settings["Semi Product Manage"].treeview = {};
		$.extend(frappe.treeview_settings["Semi Product Manage"].treeview, treeview);
        this.tree_view = treeview;
        window.treeview = treeview;

        treeview.page.add_inner_button(
			"查看详情",
			function () {
				// frappe.set_route("Tree", "Cost Center", { company: get_company() });
                frappe.show_alert("查看详情");
			},
			__("View")
		);
    },
    refresh: function (node) {
        log("refresh 无", node);
    },
    post_render: function (treeview) {
        // log("post_render", treeview);   
		// frappe.treeview_settings["Semi Product Manage"].treeview["tree"] = treeview.tree;
		// treeview.page.set_primary_action(
		// 	"新建加工单",
		// 	function () {
		// 		frappe.show_alert("新建加工单");
		// 	},
		// 	"add"
		// );
	},
    
    on_get_node: function (nodes, deep = false) {
        // log("on_get_node", nodes, deep);
        function add_tail(tree_node) {
            log("tree_node", tree_node);
            if (!tree_node) return;
            const qty = tree_node?.data?.remaining_piece + "/" + tree_node?.data?.total_piece + "";
            const for_date = tree_node?.data?.for_date;
            tree_node.parent && tree_node.parent.find(".balance-area").remove();
            $(
                '<span class="balance-area pull-right">' +
                    qty.bold() + " 根/" + for_date +
                "</span>"
            ).insertBefore(tree_node.$ul);
        }
        setTimeout(() => {
            nodes.forEach((node) => {
                const tree_node = cur_tree.nodes && cur_tree.nodes[node.value];
                add_tail(tree_node);
            })
        },0);
    },

    on_render_node: function (node) {
        log("on_render_node 无", node);
    },

    toolbar: [
        {
            label: "详情",
            condition: function (node) {
                return true;
            },
            click: function (node) {
                frappe.show_alert("详情");
                var me = frappe.views.trees["Semi Product Manage"];
                log ('me', me, node);
                // me.new_node();
				frappe.set_route("Form", "Semi Product Manage", node.label);
            },
            btnClass: "hidden-xs",
        },
        {
            condition: function (node) {
                return !node.root && frappe.boot.user.can_read.indexOf("GL Entry") !== -1;
            },
            label: "tool2",
            click: function (node, btn) {
                // frappe.route_options = {
                //     account: node.label,
                //     from_date: erpnext.utils.get_fiscal_year(frappe.datetime.get_today(), true)[1],
                //     to_date: erpnext.utils.get_fiscal_year(frappe.datetime.get_today(), true)[2],
                //     company:
                //         frappe.treeview_settings["Account"].treeview.page.fields_dict.company.get_value(),
                // };
                // frappe.set_route("query-report", "General Ledger");
            },
            // btnClass: "hidden-xs",
        },
    ],
    // extend_toolbar: true,

}