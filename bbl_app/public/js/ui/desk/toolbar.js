// log("加载 wt toolbar.js")

frappe.ui.toolbar.Toolbar = class Toolbar extends frappe.ui.toolbar.Toolbar {

    constructor() {
        // log("wt constructor");
        super();
        // this.setup_scanner();
    }

    
    setup_scanner() {
        // log("wt setup_scanner");
        let me = this;
        this.scanner = $("#scanner-btn");
        this.scanner.attr("title", __("Scan QR"));
        this.scanner.tooltip({ delay: { show: 600, hide: 100 }, trigger: "hover" });

        this.scanner.on("click", () => {
            console.log("scanner click")
            let msg_type = localStorage.getItem("barcode_msg_type") || "测试二维码";
            let d = new frappe.ui.Dialog({
                title: '上传二维码',
                fields: [
                    {
                        "fieldname": "scan_barcode",
                        "label": __("Scan QR"),
                        "fieldtype": "Small Text",
                        "options": "Barcode",
                        "mandatory": 1,
                    },
                    {
                        "fieldname": "message_type",
                        "label": __("Message Type"),
                        "fieldtype": "Data",
                        "default": msg_type,
                    },
                ],
                size: 'small',
                primary_action_label: '上传',
                primary_action(values) {
                    d.hide();
                    console.log("values", values);
                    localStorage.setItem("barcode_msg_type", values.message_type);
                    me.sendup_barcode(values);
                },

                secondary_action_label: __("Scan QR"),
                secondary_action(values) {
                    new frappe.ui.Scanner({
                        dialog: true, // open camera scanner in a dialog
                        multiple: false, // stop after scanning one value
                        on_scan(data) {
                            // console.log("set_secondary_action on_scan", values, data)
                            // 这儿直接上传
                            values = {
								"scan_barcode": data.decodedText,
								"message_type": "摄像头扫描"
                            };
                            me.sendup_barcode(values);
                        }
                    });
                }
            });
            d.show();
            d.$wrapper.find(".link-btn").css("display", "inline");
        })
    }

    sendup_barcode(values) {
        // console.log("wt sendup_barcode values", values)

        frappe.call({
            method: "bbl_app.bbl_app.doctype.temp_barcode.temp_barcode.sendup_barcode",
            args: values
        }).then(r => {
            console.log("sendup_barcode r", r)
            let rt = r.message;
            if (rt) {
                if ( typeof rt === "string" ) {
                    frappe.show_alert({ message: rt, indicator: "red" });
                } else {
                    frappe.show_alert({ message: "查询到数据：" + __(rt.doctype).bold(), indicator: "green" });
                    frappe.set_route("Form", rt.doctype, rt.name);
                }
                // frappe.set_route("Form", "Temp Barcode", r.message);
            } else if (r.exc){
                frappe.show_alert({ message: "后端处理，出现异常", indicator: "red" });
            } else {
                frappe.show_alert({ message: "不知道返回的啥", indicator: "red" });
            }
        })
    }

}

