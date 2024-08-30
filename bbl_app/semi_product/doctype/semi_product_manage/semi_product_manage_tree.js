frappe.provide("frappe.treeview_settings");

frappe.treeview_settings["Semi Product Manage"] = {
    // breadcrumb: "Semi Product",
    title: "无限转序",
    // get_tree_root: false,  // 意义, 为false时, 根节点为不自动显示
    // root_label: "abc", // ？
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
            default: frappe.datetime.add_days(frappe.datetime.now_date(), -10),
        },
        {
            fieldname: "root_item",
            fieldtype: "Link",
			options: "Semi Product Manage",
            get_query: () => {
                return {
                    "filters": {
                        "product_form": "锻坯登记",
                    }
                }
            },
            onchange: () => {
                // LXZ/LXHP-240816-4E-01
                // DP/ZP-240816-06A0-02
                const cur_treeview = frappe.views.trees["Semi Product Manage"];
                const val = cur_treeview.page.fields_dict.root_item.get_value();
                if (!val) {
                    const default_date = frappe.datetime.add_days(frappe.datetime.now_date(), -10)
                    cur_treeview.page.fields_dict.for_date.set_value(default_date)
                    return;
                }
                // log("root_item onchange, cur_treeview",val , cur_treeview);
                find_root_item(val).then((r) => {
                    if (r.message !== val) {
                        cur_treeview.page.fields_dict.for_date.set_value(null)
                        cur_treeview.page.fields_dict.root_item.set_value(r.message)
                        bbl.temp_tree_node = val;
                    } else {
                        // 如果是root，自动展开+彩色显示 title
                        const tree = cur_treeview.tree;
                        tree.load_children(tree.root_node, true);
                    }
                });
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
            },
            hidden: true,
		},
		{
            fieldname: "refresh_bt",
			fieldtype: "Button",
			label: " 刷新",
			disable_onchange: true,
            primary: 1,
            icon: "reply-all",
            placeholder: "刷sb新",

            click: (e) => {
                let tree_view = frappe.views.trees["Semi Product Manage"];
                // log(tree_view);
                tree_view.page.clear_fields()
                delete tree_view.args.semi_product;
                delete tree_view.args.for_date;
                delete tree_view.args.root_item;
                // log ("tree_view.opts.title", tree_view.opts.title)
                tree_view.root_label = tree_view.opts.title;
                // tree_view.make_tree();
                tree_view.make_filters();
                // tree_view.tree.refresh();
                window.bt = cur_treeview.page.fields_dict.refresh_bt
                log(bt);
            },
            // hidden: true,
		},
    ],
    // ignore_fields: ["parent_semi_product_manage"],

	get_tree_nodes: "bbl_app.semi_product.doctype.semi_product_manage.semi_product_manage.get_children",


    onload: function (treeview) {
        log("on_load");
		frappe.treeview_settings["Semi Product Manage"].treeview = {};
		$.extend(frappe.treeview_settings["Semi Product Manage"].treeview, treeview);
        this.tree_view = treeview;
        window.cur_treeview = treeview;

    },
    refresh: function (node) {
        log("refresh 无", node);
    },
    post_render: function (treeview) {
        // log("post_render");   
		// frappe.treeview_settings["Semi Product Manage"].treeview["tree"] = treeview.tree;
		treeview.page.set_primary_action(
			"新建加工单",
			function () {
                frappe.new_doc("Semi Product Operate", 
                   doc => { 
                })
			},
			"add"
		);

	},
    
    on_get_node: function (nodes, deep = false) {
        // log("on_get_node", nodes);
        function add_tail(val) {
            // log("tree_node 3", tree_node);
            const tree_node = cur_tree.nodes && cur_tree.nodes[val];
            if (!tree_node || !tree_node.$ul) return;
            let color_1 = "gray";
            if (tree_node?.data?.remaining_piece)
                color_1 = "red";
            const remaining_piece = (tree_node?.data?.remaining_piece + "").fontcolor(color_1);
            const total_piece = (tree_node?.data?.total_piece + "").fontcolor("blue");
            const qty = remaining_piece + "/" + total_piece;
            const for_date = (tree_node?.data?.for_date + "").fontcolor("gray");
            tree_node.parent && tree_node.parent.find(".balance-area").remove();
            $(
                '<span class="balance-area pull-right">' +
                    qty + "根/" + for_date +
                "</span>"
            ).insertBefore(tree_node.$ul);
        }
        function recursive_nodes(nodes) {
            nodes.forEach((node, n) => {
                if (!node.is_root) {
                    if (Array.isArray(node.data)) {
                        recursive_nodes(node.data);
                    } else {
                        // node.data.title = node.title + "/wtt " + n;
                        // log("node.title:" + node.title);
                        add_tail(node.value);
                    }
                }    
            })
        }
        function recursive_title(nodes) {
            nodes.forEach((node, n) => {
                if (!node.is_root) {
                    if (Array.isArray(node.data)) {
                        recursive_title(node.data);
                    } else {
                        let li = node.title.split("/");
                        let color_1 = "gray";
                        if(cint(li[1]) != 0)
                            color_1 = "dark";
                        li[1] = li[1].fontcolor(color_1);
                        li[2] = li[2].fontcolor("blue");
                        
                        if (node.value == bbl.temp_tree_node) {
                            log("node.value:" + node.value);
                            // node.$li.addClass("active");
                            li[0] = li[0].bold().fontcolor("green");
                            // node.title = li.join("/");
                            // bbl.temp_tree_node = null;
                        }
                        if (li[0].indexOf("合批") != -1) {
                            li[0] = li[0].bold();
                            // li[0] = li[0].fontcolor("yellow");
                        }
                        node.title = li.join("/");
                    }
                }    
            })
        }
        setTimeout(() => {
            recursive_nodes(nodes);
        },0);
        recursive_title(nodes);
        setTimeout(() => {
            if (bbl.temp_tree_node) {
                const $item = $(`[data-label="${bbl.temp_tree_node}"]`);
                // $item.css("background-color", "lightblue");
                $item.css("background-color", "lightyellow");
                $item.css("border-radius", "10px");
                $item.trigger("click");
                $item.trigger("click");
            }
        }, 0);
    },

    on_render_node: function (node) {
        log("on_render_node 无", node);
    },

    toolbar: [
        {
            label: "详情",
            condition: function (node) {
                if(node.is_root)  return false;
                return true;
            },
            click: function (node) {
                frappe.show_alert("详情");
                // var me = frappe.views.trees["Semi Product Manage"];
                // log ('me', me, node);
                // me.new_node();
				frappe.set_route("Form", "Semi Product Manage", node.label);
            },
            // btnClass: "hidden-xs",
        },
        {
            label: "加工",
            condition: function (node) {
                if(node.is_root)  return false;
                return true;
            },
            click: function (node) {
                var me = frappe.views.trees["Semi Product Manage"];
                // log ('me', me, node);
                if (node.data.remaining_piece < 1) { 
                    frappe.throw("剩余数量为0根");
                }
                const product_name_form = node.data.title.split("/")[0].split("_");
                let opts = {};
                opts.semi_product = product_name_form[0];
                opts.semi_op_source = product_name_form[1];
                opts.spm_source = node.data.value;
                bbl.flag_has_spm_opts = 1;

                frappe.new_doc("Semi Product Operate", opts, 
                   doc => { 
                    //    console.log("新建操作单frm, doc属性:", doc);
                })
                frappe.show_alert("功能ok");
            },
            // btnClass: "hidden-xs",
        },
        {
            label: "单独显示",
            condition: function (node) {
                if(node.is_root) {
                    return false;
                }
                return true;
                // return !node?.parent_node?.data?.value;
            },
            click: function (node) {
                const cur_treeview = frappe.views.trees["Semi Product Manage"];
                const root_item_fd = cur_treeview.page.fields_dict["root_item"];
                root_item_fd.set_input(node.data.value);
                // $(root_item_fd).trigger("change");
                // log($("[data-fieldname=root_item]"));
                $("[data-fieldname=root_item]").trigger("change");
                // log(node);
            },
            // btnClass: "hidden-xs",
        },

    ],
    // extend_toolbar: true,

}


function find_root_item(item_name) {
    // console.log("find_root_item from backend:", item_name);
    return frappe.call({
        method: "bbl_app.semi_product.doctype.semi_product_manage.semi_product_manage.find_root_item",
        args: {item_name}
    }).then(r => {
        return r
    })
}

// log(find_root_item("LXZ/LXHP-240816-4E-01"));