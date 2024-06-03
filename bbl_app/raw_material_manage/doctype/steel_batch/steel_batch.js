frappe.require("/assets/bbl_app/js/steel_batch_parse.js", () => {
    console.log("parse.js is loaded");
});

frappe.ui.form.on("Steel Batch", {
    before_submit: function (frm) {
        console.log("SB before_submit");
    },
    on_submit: function (frm) {
        console.log("SB on_submit");
    },
	refresh(frm) {

        frm.doc.show2 = 0;
        frm.doc.show3 = 0;
        frm.add_custom_button(__('Length2'), () => {
            // frm.trigger("clearForm"); // 占位，手机段第一个显示不出来
            frappe.show_alert("显示 长度3 ...")
            frm.doc.show2 = 1;
            frm.toggle_display(['length2', 'piece2', 'length3', 'piece3'], true);
            // frappe.new_doc("Steel Batch");
            
        })

        frm.add_custom_button('SABB', () => {
            console.log("start SABB button");
            item = {
                qty: 30,
                has_serial_no: 1,
                // serial_and_batch_bundle: 'dddd23',
                title: 'SABB title',
                fields: [
                    {
                        fieldtype: "Section Break",
                        label: __("{0} {1} Manually", ["Section", "2"]),
                    },				
                    {
                        fieldtype: "Small Text",
                        label: __("Enter Serial Nos"),
                        fieldname: "upload_serial_nos",
                        description: __("Enter each serial no in a new line"),
                    },
                    {
                        fieldtype: "Column Break",
                        depends_on: "eval:true",
                    },


                    {
                        fieldtype: "Button",
                        fieldname: "make_serial_nos",
                        label: __("Create Serial Nos"),
                        click: () => {
                            console.log("bt click");
                        },
                    },

                    {
                        fieldtype: "Section Break",
                        label: __("{0} {1} Manually", ["Section", "2"]),
                    },	
                    {
                        fieldtype: "Link",
                        fieldname: "warehouse",
                        label: __("Warehouse"),
                        options: "Warehouse",
                        default: "get_warehouse",
                        onchange: (v) => {
                            console.log("onchange:", v, this);
                        },
                        get_query: () => {
                            return {
                                filters: {
                                    is_group: 0,
                                    // company: this.frm.doc.company,
                                },
                            };
                        },
                    },
                    {
                        fieldtype: "Column Break",
                    },
                    {
                        fieldtype: "Data",
                        options: "Barcode",
                        fieldname: "scan_serial_no",
                        label: __("Scan Serial No"),
                        get_query: () => {
                            return {
                                // filters: this.get_serial_no_filters(),
                            };
                        },
                        onchange: (v) => {
                            console.log("onchange:", v, this);
                        },
                    },
                    {
                        fieldtype: "Section Break",
                    },
                    {
                        fieldname: "entries",
                        fieldtype: "Table",
                        allow_bulk_edit: true,
                        data: [],
                        fields: [],
                    },


                ]


            }
            // new erpnext.SerialBatchPackageSelector(frm,item, r => {
            //     console.log(r);
            // });
            new bbl.BaseDialog(frm,item, r => {
                    console.log(r);
                });
            console.log("SABB end button");
        })

        frm.add_custom_button('设置炉号', () => {
            let d = new frappe.ui.Dialog({
                title: '设置炉号',
                fields: [
                    {
                        label: '炉号',
                        fieldname: 'heat_no',
                        fieldtype: 'Data'
                    },
                ],
                size: 'small', // small, large, extra-large 
                primary_action_label: '填入',
                primary_action(values) {
                    // console.log(values);
                    frm.doc.heat_no = values.heat_no;
                    frm.refresh_field('heat_no');
                    d.hide();
                }
            });
            d.show();
        });
        frm.add_custom_button('转库', () => {
            trans_area(frm.doc);
        });
        frm.add_custom_button("显示条码", () => {
            frm.doc.show3 = 1;
            frm.toggle_display(['raw_code',], true);
        });

        if (frm.is_new()) {
        };

	},

       
    raw_name(frm) {
        // console.log("raw_name 改变, 检查物料名称", frm)
        let item_name = frm.doc.raw_name;
        if (!item_name)
            return;
        frappe.call({
            method: "bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.raw_name",
            args: {
                item_name: item_name,
                item_group: "原材料",
                uom: "kg",
                // batch_patern: "YCL-.########"
            }
        }).then((r) => {
            // console.log("raw_name 创建result", r.message)
            // if (r.message) {
            //     frm.set_value("raw_name", '');
            // }
        })

    },
    
    after_save(frm) {
        console.log("after_save", frm.doc)
        if (frm.doc.creation != frm.doc.modified)
            return;
        frappe.new_doc("Steel Batch");
        frappe.show_alert("保存成功,新建扫描表单")
    },

    batch_no(frm) {
        if (!frm.doc.raw_code) {
            frm.set_value("hand_in", true);
        }
    },

    scan_barcode(frm) {
        frm.set_value("hand_in", false);
        frm.trigger("parse_gangbang_code");
	},

    heat_no(frm, a) {
        let hn = frm.doc.heat_no;
    },

    // steel_piece(frm) {
    //   frm.set_value("remaining_piece", frm.doc.steel_piece);
    // },


    parse_gangbang_code(frm) {
        _clear_doc(frm);
        if (!frm.is_new()) {
            frappe.msgprint({
                title: __('Warning'),
                message: "请新建空白表单，然后扫码",
                indicator: 'red'
            });
            frm.doc.scan_barcode = ""
            frm.refresh();
            frm.focus_on_first_input();
            console.log("focus_on_first_input");
            return;
        }


        let qrcodeStr = frm.doc.scan_barcode    
        qrcodeStr = qrcodeStr.trim();
        qrcodeStr = qrcodeStr.replaceAll("<br />", " ");
        qrcodeStr = qrcodeStr.replaceAll("\n", " ");
        qrcodeStr = qrcodeStr.replaceAll("smq750_", "");  //去除PDA扫描枪前缀
        frm.doc.scan_barcode = ""
        frm.doc.raw_code = qrcodeStr;
    
        qrcodeStr = qrcodeStr.replaceAll("\"", "");
        qrcodeStr = qrcodeStr.replaceAll("\'", "");
        gangbang_info = GangbangParse.parse(qrcodeStr);
        // console.log(gangbang_info)
        if (!gangbang_info) {
            frm.doc.scan_barcode = "";
            frm.refresh_field("scan_barcode")
            frm.refresh_field("raw_code")
            // frappe.msgprint("二维码解析失败, qrcode:<br/>" + qrcodeStr);
            // frm.refresh();
            frappe.show_alert({
                message:"二维码解析失败<br/>" + qrcodeStr,
                indicator:'red'
            }, 5);
            frm.focus_on_first_input();
            frappe.utils.play_sound('error');
            setTimeout(() => {
                frm.doc.raw_code = "";
            }, 2000);
            return;
        }
    
        frm.doc.supplier = gangbang_info.company;
        frm.doc.product_company = gangbang_info.company;
        frm.doc.batch_no = gangbang_info.bundleNo;
        frm.doc.heat_no = gangbang_info.heatNo;
        frm.doc.steel_grade = gangbang_info.steelGrade.trim();
        frm.doc.diameter = parseInt(gangbang_info.diaSize) || undefined;
        frm.set_value("raw_name", frm.doc.steel_grade + (frm.doc.diameter ?  "-" + frm.doc.diameter : "") );
        frm.doc.length = parseInt(gangbang_info.length);
        frm.doc.weight = parseInt(gangbang_info.weight);
        // frm.doc.steel_piece = gangbang_info.bundleNum;
        frm.set_value("steel_piece", gangbang_info.bundleNum);
        frm.doc.batch_date = gangbang_info.productDate;
        frm.doc.for_date = frappe.datetime.now_date();
        frm.doc.bundle_total = 0;
        frm.doc.bundle_index = parseInt(gangbang_info.bundleIdx) || undefined;
        frm.doc.contract_no = gangbang_info.contractNo;
        frm.doc.standard = gangbang_info.standardNo;
        frm.doc.product_name = gangbang_info.productName;

    
        if (!(frm.doc.length > 0)) {
            frm.doc.length = undefined;
        }
        if (!(frm.doc.steel_piece > 0)) {
            frm.doc.steel_piece = undefined;
        }
        frm.refresh();

        frappe.show_alert({
            message:"扫码成功",
            indicator:'green'
        }, 5);

        frappe.db.exists("Steel Batch", frm.doc.batch_no).then(exists => {
            if (exists) {
                frappe.msgprint({
                    title: __('Warning'),
                    message: "批次号已经存入系统, 不能重复录入",
                    indicator: 'red'
                })
                // frm.trigger("clearForm");
                _clear_doc(frm);
                frm.refresh();
                frappe.utils.play_sound('error');
            } else {
                frappe.utils.play_sound('submit');
            }
        })
    }
    


});


function trans_area(doc) {
    console.log("trans_area arg1:", doc);
    let d = new frappe.ui.Dialog({
        title: '原钢转库',
        fields: [
            {
                "fieldname": "name",
                "label": "捆号",
                "fieldtype": "Data",
                "default": doc.name,
                "read_only": 1,
            },
            {
                "fieldname": "warehouse_area",
                "label": "转出库区",
                "fieldtype": "Link",
                "options": "Warehouse Area",
                "default": doc.warehouse_area,
                "read_only": 1,
            },
            {
                "fieldname": "warehouse_area",
                "label": "转入库区",
                "fieldtype": "Link",
                "options": "Warehouse Area",
                "reqd": 1
            }
        ],
        size: 'small',
        primary_action_label: '确定',
        primary_action(values) {
            d.hide();
            if (doc.warehouse_area === values.warehouse_area) {
                frappe.msgprint({ "title": "提示", message: "转入库区错误", "indicator": "red" });
            } else {
                frappe.show_progress('Loading..', 0, 100, '转库...');
                into_area(doc, values.warehouse_area);
            }
        }
    })
    d.show();
};

function into_area(doc, new_area) {
    frappe.db.set_value("Steel Batch", doc.name, "warehouse_area", new_area,
        (res) => {
            doc.warehouse_area = new_area;
            cur_frm.refresh_field("warehouse_area");
            console.log(cur_frm);
            frappe.show_progress('Loading..', 100, 100, '转库中...', true);
        }
    );

};

function _clear_doc(frm) {
    console.log("into clear doc");
    frm.doc.raw_code = "";
    frm.doc.supplier = "";
    frm.doc.product_company = "";
    frm.doc.batch_no = "";
    frm.doc.heat_no = "";
    frm.doc.steel_grade = "";
    frm.doc.diameter = "";
    frm.doc.raw_name = "";
    frm.doc.length = "";
    frm.doc.weight = "";
    frm.doc.steel_piece = "";
    frm.doc.for_date = "";
    frm.doc.bundle_total = "";
    frm.doc.bundle_index = "";
    frm.doc.contract_no = "";
    frm.doc.standard = "";
    // frm.refresh();
};
