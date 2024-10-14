// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt
frappe.require("/assets/bbl_app/js/product_code_parse.js", () => {
    console.log("product_code_parse.js is loaded");
});


frappe.ui.form.on("Product Package Info", {

    onload(frm) {
        if (!frm.doc.employee) {
            frm.set_value("employee", frappe.session.user_fullname);
        }
    },

	refresh(frm) {
        // 判断是否是新建
        if (frm.is_new() && !cur_dialog) {
            make_scan_package_dialog(frm);
        }
        // 如果文档状态不是已提交，不显示按钮
        if (frm.doc.docstatus == 0) {
            frm.add_custom_button("扫码打包", () => {
                make_scan_package_dialog(frm);
            });
            frm.change_custom_button_type("扫码打包", null, 'success');
        }
	},

    validate(frm) {
    },
    before_submit(frm) {
        product_items = frm.get_field("product_package_items").get_value()
        if (!product_items.length){
            frappe.validated = false;
            frappe.throw("打包产品列表不能为空！")
        }
    },
    on_submit(frm) {
    },

});


frappe.ui.form.on("Product Package Items", {
    product_package_items_remove(frm, cdt, cdn) {
        log("product_package_items_remove", frm, cdt, cdn)
        let items = frm.get_field("product_package_items").get_value()
        log("product_package_items_remove", frm.get_field("product_package_items").get_value())
        let cnt = items.length;
        log("cnt", cnt)
        frm.set_value("qty", cnt);
    },
    product_package_items(frm, cdt, cdn) {  // 没有这个函数，不会触发
        log("product_package_items");
    },
    product_package_items_add(frm, cdt, cdn) {  // 没有这个函数，不会触发
        log("product_package_items_add");
        frappe.show_alert("不能手动添加产品！");
        frm.doc.product_package_items.pop();
        frm.refresh_field("product_package_items");
    }
});

// todo : 优化, 存放到localStorage中，利用对框进行设值
const customer_package_num_limit = {
    "东风德纳": 15,
    // "陕汽汉德": 15,
    // "三一重工": 15,
    // "方盛": 15,
}

function make_scan_package_dialog(frm) {
    let dialog = new ScanPackageDialog({
        frm: frm,
        // primary_label: "完成",
    }, (data) => {
        log("scan package dialog callback", data);
    });
}


class ScanPackageDialog {
    
    constructor(opts, callback) {
        this.dialog = null;
        this.callback = callback;
        this.counter = 0;
        this.package_no = "";
        this.last_code = "";
        this.frm = opts.frm;
        this.customer_code_list = [];
        this.first_cp_item = null;
        this.init_dialog_info();
        this.get_customer_code_list();
        this.set_dialog_values();
        this.make();
    }

    init_dialog_info() {
        this.get_first_cp_item();

    }
    get_first_cp_item() {
        if ( this.frm.doc.product_package_items.length > 0) {
            let first_cp_doc_name = this.frm.doc.product_package_items[0].bbl_code;
            frappe.model.with_doc("Finished Product Manage", first_cp_doc_name).then((doc) => {
                // log("get first cp item", doc)
                this.first_cp_item = doc;
            });
        }
    }
    config_scan_code_input() {
        this.dialog.$wrapper.find(".link-btn").css("display", "inline");
        this.scan_code_fd = this.dialog.get_field("scan_code");
        this.blur_timer = setInterval(() => {
            if (document.activeElement != this.scan_code_fd.$input[0]) {
                this.scan_code_fd.set_focus();
            }
        }, 30000);
        this.hide_keyboard();
        this.config_screen_event();
    }
    hide_keyboard() {
        log("hide_keyboard");
        let scan_code_fd = this.dialog.get_field("scan_code");
        let input = scan_code_fd.$input[0];
        $(input).on("focus", () => {
            log("input focus")
            input.setAttribute("readonly", true);
            input.focus();
            setTimeout(() => {
                input.removeAttribute("readonly");
            }, 100);
        })

        window.sc = scan_code_fd;
        window.w = this.dialog.$wrapper;
    }
    config_screen_event() {
        // 监听屏幕事件
        this.dialog.$wrapper.on("keydown", () => {
            // log("screen keydown");
            if (document.activeElement != this.scan_code_fd.$input[0]) {
                this.scan_code_fd.set_focus();
            }
        })
    }
    set_dialog_values() {
        // 从frm中获取值
        this.counter = this.frm.doc.qty || 0;
        this.package_no = this.frm.doc.package_no || "";
    }
   
    disp_counter() {
        this.dialog.get_field("counter").set_value("产品计数：" + cstr(this.counter).bold() + " 根");
    }
    disp_package_no() {
        this.dialog.get_field("package_no").set_value("打包码：" + cstr(this.package_no).bold());
    }
    frm_add_product_item(fpm_doc) {
        if (this.code_type != "BBL*BM") {
            this.frm.add_child("product_package_items", {
                customer_barcode: fpm_doc.customer_barcode,
                bbl_code: fpm_doc.bbl_code,
                forge_batch_no: fpm_doc.forge_batch_no,
                semi_product_batch: fpm_doc.semi_product_batch,
            })
            this.frm.refresh_field("product_package_items");
        }
    }

    get_customer_code_list() {
        // 从frm中获取customer_barcode列表
        this.customer_code_list = [];
        this.frm.doc.product_package_items.forEach((item) => {
            this.customer_code_list.push(item.customer_barcode);
        })
    }

    show_alert(msg) {
        this.dialog.set_alert(msg, "success");
    }
    show_error(msg) {
        frappe.utils.play_sound("error");
        this.dialog.set_alert(msg, "danger");
    }
    recognize_code(code) {
        // 判断是厂家板簧码/bbl产品二维码/bbl包码, 错误的码不进行上传
        const upper_code = code.toUpperCase();

        // 二维码不能识别
        log("二维码"+ upper_code)
        if (!(new bbl.CpQrcode(code).isValid())) {
            this.show_error("二维码不能识别");
            return false;
        }

        if (!upper_code.startsWith("BBL")) {
            this.code_type = "CUSTOMER"
            if (this.first_cp_item) {
                let customer = this.first_cp_item.customer;
                let cnt_limit = customer_package_num_limit[customer];
                if (cnt_limit && this.counter == cnt_limit + 1) {
                    let msg = "客户<" + customer + ">的包装数已经超过：" + cnt_limit + "根";
                    frappe.show_alert({ title: "警告", message: msg, indicator: "red" });
                }
            }
        } else {
            // bbl产品二维码
            if (upper_code.startsWith("BBL*BM")) {
                this.code_type = "BBL*BM"
            } else {
                this.code_type = "BBL*ELSE"
            }
        }
        // 扫描了本厂条码，不允许则报警
        if (this.code_type == "BBL*ELSE" && !this.dialog.get_value("enable_bbl_code")) {
            this.last_code = "";
            this.show_error("不允许扫描本厂条码！");
            return false;
        }

        // 如果是bbl包码，则设置frm和dialog的package_no
        // 如果已经有package_no，则报警or忽略
        if (this.code_type == "BBL*BM") {
            if (this.package_no && this.package_no != code) {
                this.show_error("不允许扫描多个包码！");
                return false;
            }
            // 检查包码是否已经存在，
            this.package_no_exists(code, 
                () => {
                    // log("存在")
                    this.show_error("包码已经存在");
                }, 
                () => {
                    // log("不存在")
                    this.package_no = code;
                    this.disp_package_no();
                    this.frm.set_value("package_no", code);
                    frappe.utils.play_sound("alert");
                },
                () => {
                    // log("总是执行")
                })
        }
        return true;
    }

    package_no_exists(package_no, fn_exists, fn_not, fn_final) {
        // let package_no_fd = this.frm.get_field("package_no")
        frappe.db.get_value(
            this.frm.doctype,
            package_no,
            "name",
            (val) => {
                if (val && val.name) {
                    // package_no_fd.set_value("");
                    fn_exists();
                } else {
                    fn_not();
                }
                fn_final();
            },
            this.frm.doc.parenttype
        );
    }

    fetch_code_info(code) {
        frappe.call({
            method: "bbl_app.finished_product.doctype.product_package_info.product_package_info.fetch_code_info",
            args: {
                code: code,
                code_type: this.code_type,
                package_no: this.package_no,
                qty: this.frm.doc.qty,
                enable_bbl_code: this.dialog.get_value("enable_bbl_code"),
                employee: this.frm.doc.employee,
            },
            callback: (r) => {
                // log("服务器返回：", r);
                if (r.message) {
                    // this.dialog.set_value("product_spec", r.message.product_spec);
                    // todo 根据服务器返回信息，新建子表项
                    this.process_rt(code, r.message);
                } else if (r.exc) {
                    this.show_error(JSON.parse(r.exc));
                } else {
                    this.show_error("服务器返回不知道啥");
                }
            }
        });
    }
    process_rt(code, rt_obj) {
        // 更新 和 校验 frm 信息
        if (this.counter == 0) {
            this.rt_to_frm(rt_obj);
        } else {
            if (!this.validate_rt(rt_obj)) {
                return;
            }
        }
        // 新建产品项
        this.frm_add_product_item(rt_obj);
        this.get_customer_code_list();
        this.counter++;
        this.disp_counter();
        this.frm.set_value("qty", this.counter);
        this.dialog.set_alert(code, "success");
        frappe.utils.play_sound("submit");

    }
    validate_rt(rt_obj) {
        // log("into validate_rt")
        // todo 为保障产品同一性，需要校验哪些数据？（同包的产品，哪些字段必须相同？）
        if (this.customer_code_list.includes(rt_obj.customer_barcode)) {
            this.show_error("产品已经扫入列表");
            return false;
        }

        if (!this.first_cp_item) {
            this.show_error("未获取到第一根产品信息，请检查网络");
            return false;
        }

        if (!rt_obj.semi_product) {
            // todo 判断code的前n位，需相同
            const len = 10;
            const code_first_20 = rt_obj.customer_barcode.substring(0, len);
            const last_code_first_20 = this.first_cp_item.customer_barcode.substring(0, len);
            if (code_first_20 != last_code_first_20) {
                this.show_error("扫入产品的半成品名称 ".fontcolor("black") + "不同".fontcolor("red"));
                return false;
            }
        }
        // if (!rt_obj.semi_product || rt_obj.semi_product != this.first_cp_item.semi_product) // 带字段判空
        // log("this.first_cp_item", this.first_cp_item)
        // log("rt_obj", rt_obj)
        if (rt_obj.semi_product != this.first_cp_item.semi_product) {
            this.show_error("扫入产品的半成品名称 " + "不同".fontcolor("red"));
            return false;
        }
        if (rt_obj.customer != this.first_cp_item.customer) {
            this.show_error("扫入产品的客户名称 " + "不同".fontcolor("red"));
            return false;
        }
        return true;


        // todo 后端校验产品已经打包/准备提交时再进行校验
        
    }
    rt_to_frm(rt_obj) {
        // 第一根进行信息设置，后面的进行校验
        // log("into rt_to_frm")
        this.first_cp_item = rt_obj;
        this.frm.set_value("product_name", rt_obj.product_name);
        this.frm.set_value("semi_product", rt_obj.semi_product);
        this.frm.set_value("forge_batch_no", rt_obj.forge_batch_no);
        this.frm.set_value("customer", rt_obj.customer);
        // this.frm.refresh(); 不能刷新，利用了刷新开对话框
    }
    make() {
        this.fields = [
            {
                "fieldname": "scan_code",
                "label": "扫描输入区",
                "fieldtype": "Small Text",
                "options": "Barcode",
                // "reqd": 1,
                "max_height": "5rem",
                "input_css": {
                    "font-size": "1.2rem",
                    "background-color": "#ffffe0",
                    "color": "#00b89f",
                },
                onchange: (e) => {
                    let d = this.dialog;
                    let v = d.get_value("scan_code").trim() || "";
                    if (!v)
                        return;
                    d.set_value("scan_code", "");
                    this.dialog.clear_alert();
                    
                    if (v.length < 5) {
                        this.show_error("输入二维码少于5字符");
                        return;
                    }
                    if (v == this.last_code) {
                        this.show_error("重复扫描");
                        return;
                    }
                    this.last_code = v;
                    if (!this.recognize_code(v))
                        return;
                    if (this.code_type != "BBL*BM") {
                        this.dialog.set_alert("正在检查，请稍候...", "sb");
                        this.fetch_code_info(v); 
                    }
                },
            },

            {"fieldtype": "Section Break",},
            {
                "fieldname": "package_no",
                "fieldtype": "Heading",
                "label": "package_no",
            },
            {"fieldtype": "Section Break",},
            {"fieldtype": "Column Break",},

            {
                "fieldname": "counter",
                "fieldtype": "Heading",
                "label": "计数",
            },
            {"fieldtype": "Column Break",},
            // {"fieldtype": "Heading", "label": "&nbsp;"},
            {
                "fieldname": "enable_bbl_code",
                "label": "可扫本厂码",
                "fieldtype": "Check",

            },
                

        ];

        this.dialog = new frappe.ui.Dialog({
            title: "扫描产品二维码，进行打包",
            fields: this.fields,
            size: "small",
            // size: "large",
            static: 1, // 静态窗口
            primary_action_label: "结束扫描，关闭",
            // todo 只有关闭
            primary_action: (values) => {
                this.dialog.hide();
            },
        })
        const spm_name_default = this.spm_name || localStorage.getItem("fpmd_spm_name") || "";
        this.disp_counter();
        this.disp_package_no();
        // this.dialog.set_value("semi_product_manage", spm_name_default);
        // this.dialog.get_primary_btn().toggleClass("hidden")
        this.dialog.show();

        this.config_scan_code_input();
        // this.dialog.get_primary_btn().off("click").on("click", () => {
        //     frappe.show_alert("自动上传，不需要点击确认按钮");
        // });
        window.d = this.dialog;
        // window.df1 = d.get_field("scan_result")
        // window.df = this.scan_code_fd;
        // window.bt = dg.get_primary_btn()
    }
}