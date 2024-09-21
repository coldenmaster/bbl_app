frappe.listview_settings["Semi Product Manage"] = {

    hide_name_column: true, // hide the last column which shows the `name`
    hide_name_filter: true, // hide the default filter field for the name column

    add_fields: [
        "semi_product",
        "remaining_piece",
        "product_form",
        "bbl_heat_no",
        "is_group",
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
		return [("" + doc.remaining_piece).bold() + "/" + doc.status, 
            colors[doc.status], 
            "status,=," + doc.status];
	},

    primary_action() {
        frappe.new_doc("Semi Product Operate");
    },


    onload: function (listview) {
        this.list_view = listview;
        let page = listview.page;

        // let rolse = frappe.user_roles;
        // log("rolse:", rolse)
        // if (!(rolse.includes("Administrator") || rolse.includes("Manual Invoice"))) {}
        // if (!(rolse.includes("Administrator"))) {
        // }
        // 去掉 编辑/删除 按钮
        listview.page.actions.find('[data-label="%E7%BC%96%E8%BE%91"],[data-label="%E5%88%A0%E9%99%A4"],[data-label="Assign To"]').parent().parent().remove()
        // $(".btn-primary").hide();


        page.add_inner_button('加工', () => {
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
            bbl.flag_has_spm_opts = 1;
            frappe.new_doc("Semi Product Operate", opts, 
               doc => { 
                //    console.log("新建操作单frm, opts属性:", opts);
                //    console.log("新建操作单frm, doc属性:", doc);
                   this.list_view.clear_checked_items();
                })
        });
        page.change_inner_button_type('加工', null, 'info');
        
        
        page.add_inner_button('合批', () => {
            make_batch_merge(listview);
            // frappe.set_route("List", "Semi Product Operate");
        });
        page.change_inner_button_type('合批', null, 'danger');
        

        page.add_inner_button('加工单列表', () => {
            // make_main_op_dialog(listview);
            frappe.set_route("List", "Semi Product Operate");
            // frappe.set_route("Form", "Work Order", r.message);

        // }).addClass("btn-primary");
        }, "扩展功能");
        page.change_inner_button_type('加工单列表', null, 'warning');

        page.add_inner_button('树视图', () => {
            frappe.set_route("Tree", "Semi Product Manage");
        }, "扩展功能");

        page.add_inner_button('显示搜索', () => {
            toggle_search_form(listview);
        }, "扩展功能");
        toggle_search_form(listview) 

        // 调整页面，viewport md 大小时选择显示一些字段
        

    },
    refresh: function (listview) {
        log("refresh");
        if (bbl.utils.is_ms560_680()) {
            show_sm_colomn();
        }
    }

}

$(window).on('resize', function () {
    // fn_onResize();
    // log("window, resize");
})

var updateOrientation = function() {
    log("window, orientationchange");
    if (bbl.utils.is_ms560_680()) {
        show_sm_colomn();
    }
    var orientation = window.orientation;
    switch(orientation) {
        case 90: case -90:
            orientation = 'landscape';
            break;
        default:
            orientation = 'portrait';
    }
    // set the class on the HTML element (i.e. )
    document.body.parentNode.setAttribute('class', orientation);
};
// event triggered every 90 degrees of rotation
window.addEventListener('orientationchange', updateOrientation, false);

function show_sm_colomn() {
    // log("show_sm_colomn");
    $result = cur_list.$result;
    $status_col = $result.find(".level-item.text-right").removeClass("visible-xs");
    // $status_col = $result.find(".level-item.text-right").toggleClass("visible-xs");
    $row_left = $result.find(".level-left");
    $row_left.each(function (i, el) {
        let $this = $(this);
        let $child = $this.children();
        $child.last().removeClass("hidden-xs");
    })
    // window.$result = $result;
    // window.rw = $row_left;
}

function toggle_search_form(listview) {
    const $section = listview.$page.find(".standard-filter-section");
    if (frappe.is_mobile()) {
        $section.toggleClass("hidden");
    }
}


function make_batch_merge(listview) {
    let items = listview.get_checked_items();
    log("合批, items:", items);
    if (items.length < 2){
        frappe.msgprint({ "title": "错误", message: "请选择两条以上记录", indicator: "red" });
        return;
    }
    let items_ok = true;
    let semi_product_name = items[0].semi_product_name;
    let forge_batch_no = items[0].forge_batch_no;
    let parent_item = items[0];
    let qty_max = 0, qty_total = 0;
    let item_names = [];
    let item_qtys = [];
    for (let element of items) {
        if (element.semi_product_name != semi_product_name)
            items_ok = false;
        if (element.forge_batch_no != forge_batch_no)
            items_ok = false;
        if (element.remaining_piece < 1)
            items_ok = false;
        // if (element.is_group)
            // items_ok = false;
        if (!items_ok) {
            const msg = "请选择" + "相同名称".bold() + ",相同批次".bold()   + ",未使用".bold()  + "的记录" ;
            frappe.msgprint({ "title": "错误", message: msg, indicator: "red" });
            return;
        }
        item_names.push(element.name);
        item_qtys.push(element.remaining_piece);
        qty_total += element.remaining_piece;
        if(element.remaining_piece > qty_max) {
            qty_max = element.remaining_piece;
            parent_item = element;
        }
    }

    const args = {forge_batch_no, semi_product_name, item_names, item_qtys, parent_item, qty_max, qty_total};
    make_batch_merge_dialog(args);


    // todo 合批操作逻辑
    /* 
    1.名称相同，锻造批次号相同，没有子单据，可以进行合并,
    2.显示一个操作单，操作名称是“锻坯合批”，‘打磨合批’
    3.合并后的数量是所有选中的数量之和，父亲单据，是数量最多的旧单据
    4.旧单据数量全设0，状态为用完，
    */
    // let opts = items[0];
    // opts.spm_source = opts.name;
    // let temp_li = opts.semi_product_name.split('_');
}

function make_batch_merge_dialog(args) {
    frappe.prompt([
        {
            label: "工件名称:&emsp;" + args.semi_product_name.bold(),
            fieldtype: "Heading",
        },
        // {
        //     label: "批次号:&emsp;&emsp;" + args.parent_item.name.bold(),
        //     fieldtype: "Heading",
        // },
        {
            label: "锻造批次:&emsp;" + (args.forge_batch_no || "无").bold(),
            fieldtype: "Heading",
        },
        {
            label: "合并数量:&emsp;" + cstr(args.qty_total).bold() + "根",
            fieldtype: "Heading",
        },
        {
            label: "合批批次:&emsp;" + args.item_qtys.join(" + ").bold() + "根",
            fieldtype: "Heading",
        }],
        () => {
            // send_batch_merge_data(args);
            make_merge_doc_form(args);
        },
        "半成品批次合并".bold(),
        "合并"
    )

}

function make_merge_doc_form(args) {
    // console.log("make_merge_doc_form args:", args);
    opts = args;
    // opts = Object.assign({}, args);
    // opts = Object.assign(opts, args);
    opts = Object.assign(opts, args.parent_item);
    opts.spm_source = args.parent_item.name;
    opts.semi_op_source = args.parent_item.product_form;
    // opts.finish_qty = opts.source_qty = args.qty_total;
    opts.basket_in = '';
    // log("opts属性:", opts);
    bbl.flag_has_spm_opts = 1;
    bbl.flag_spm_merge = 1;
    // 先找到合批工序好（提前完成新建）
    const merge_no = opts.semi_op_source + "合批";
    find_merge_batch_no(merge_no).then(r => {
        log("find_merge_batch_no", r);
        if (!r) {
            frappe.throw("新建合批工序失败: " + r, indicator="red");
        }

        frappe.new_doc("Semi Product Operate", opts, 
           doc => { 
                console.log("新建操作单frm, doc属性:",opts, doc);
                doc.finish_qty = doc.source_qty = args.qty_total;
                doc.semi_op_target = merge_no;
                // doc.finish_name = opts.semi_product + "_" + merge_no;
                doc.finish_name = bbl.utils.semiNameSlug(opts.semi_product) + "_" + merge_no;
                doc.is_merge_batch = 1;
                doc.merge_batch = JSON.stringify(merge_batch_note(opts.item_names, opts.item_qtys));
               //    this.list_view.clear_checked_items();
        })
    });
}   

function find_merge_batch_no(merge_no) {
    console.log("find_merge_batch_no to backend:", merge_no);
    return frappe.call({
        method: "bbl_app.semi_product.doctype.semi_product_manage.semi_product_manage.find_merge_batch_no",
        args: {merge_no}
    }).then(r => {
        if (r.message) {
            return r.message;
        }
        frappe.msgprint("新建合批工序失败: " + r.message.bold(), indicator="red");
    })
}

// log("test 测试");
// log(find_merge_batch_no(["abc", "def"]).then(r => {
//   log("test r", r)  
// })
// );


function merge_batch_note(names, qtys) {
    // log(names, qtys)
    let note = {};
    for (let i = 0; i < names.length; i++) {
        note[names[i]] = qtys[i];
    }
    // log(note)
    return note;
}

bbl.utils.is_ms560_680 = function() {
    return $(document).width() > 560 && $(document).width() < 680;
}