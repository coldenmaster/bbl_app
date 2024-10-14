// todo 这个好像没有用，使用了raw2bar_dialog2.js（直接在docktype js文件内）
// frappe.require("/assets/bbl_app/js/dialog/raw2bar_dialog.js", () => {
//     console.log("raw2bar_dialog.js 加载完成");
// });

frappe.provide("bbl");
console.log("读取2:raw2bar_dialog.js ");

bbl.Raw2BarDialog = class Raw2BarDialog extends frappe.ui.Dialog {
    constructor(opts, callback) {
        console.log("Raw2BarDialog opts:", opts);
        super();
        this.opts = opts;
        // this.dialog = null;
        // this.frm = frm;
        this.callback = callback;

        this.sb_items = opts.items;
        this.sb_item_0 = opts.items[0];
        this.calc_raw_cnt = this.sb_items.reduce((p, c) => p + c.remaining_piece, 0);
        this.calc_raw_wt = this.sb_items.reduce((p, c) => p + c.remaining_weight, 0);
        this.raw_length = this.sb_item_0.length;
        this.dia = this.sb_item_0.diameter;
        this.ratio = this.sb_item_0.material_ratio;
        this.semi_product = this.sb_item_0.semi_product;
        
        this.make2();
        console.log("this:", this);
    }

    make2() {
        let title = "原材料/生产投料";
        let primary_label = __("Submit");
        let fields = [
            {
                "fieldname": "d0",
                "label": "出库产品:&emsp;" + this.sb_item_0.name.bold(),
                "fieldtype": "Heading",
            },
            {
                "fieldname": "d1",
                "label": "出库数量:&emsp;" + String(this.sb_items.length).bold() + "捆",
                "fieldtype": "Heading",
            },
            {
                "fieldname": "d2",
                "label": "长度:&#x2003;&emsp;" + String(this.raw_length).bold() + " 毫米 x "  + String(this.calc_raw_cnt).bold() + "根",
                "fieldtype": "Heading",
            },
            {
                "fieldname": "d3",
                "label": "总重量:&emsp;&emsp;" + String(this.calc_raw_wt).bold() + " 千克",
                "fieldtype": "Heading",
            },
            // section break 1
            {
                "fieldname": "d4",
                "fieldtype": "Section Break",
            },
            {
                "fieldname": "raw_bar_name",
                "label": "下料名称",
                "fieldtype": "Link",
                "options": "Item",
                "reqd": 1,
                "description": "半成品:" + this.semi_product,
                // "default": target_bar + "_短棒料",
                "get_query": () => {
                    return {
                        "filters": {
                            "item_group": "短棒料",
                        }
                    }
                }
            },
            {
                "fieldname": "bar_radio",
                "label": "倍尺",
                "fieldtype": "Int",
                "reqd": 1,
                "description": "" + this.raw_length + "/" + this.ratio + "=" + cint(this.raw_length / this.ratio) + " x " + this.calc_raw_cnt,
                "default": this.ratio,
                onchange: (e) => {
                    console.log("e:", e);
                    this.ratio = e.target.value;
                    console.log("e this.ratio:", this.ratio, this.dialog);
                    let fd_1 = this.dialog.fields_dict["bar_radio"];
                    this.dialog.fields_dict["bar_radio"]["df"]["description"] = "3723231";
                    this.refresh();
                    // this.dialog.fields["bar_radio"]["description"] = "3721";
                    // fd_1.df._description = 'sb250';
                    // fd_1.set_prop("description", "" + this.raw_length + "/" + this.ratio + "=" + cint(this.raw_length / this.ratio) + " x " + this.calc_raw_cnt);

                    
                    // let piece_length = this.opts.piece_length;
                    // let piece = this.opts.piece;
                    // let bar_length = cint(piece_length / ratio);
                }
            },
            {
                "fieldname": "bar_piece",
                "label": "下料数量(根)",
                "fieldtype": "Int",
                "reqd": 1,
                "default": this.opts.bar_piece,
            },
            {
                "fieldname": "bar_weight",
                "label": "出库总重量",
                "fieldtype": "Int",
                "reqd": 1,
                "default": this.opts.weight,
            },
            {
                "fieldname": "scrap_length",
                "label": "料头长度mm",
                "fieldtype": "Int",
                "default": this.opts.raw_crap,
            },

            {
                "fieldname": "s3",
                "fieldtype": "Section Break",
                "label": "其它信息",
                "disabled": 1,
            },
            {
                "fieldname": "bar_weight",
                "label": "综合下料1",
                "fieldtype": "Int",
                "reqd": 1,
                "default": this.opts.weight,
            },
            {
                "fieldname": "scrap_length",
                "label": "综合下料2",
                "fieldtype": "Int",
                // "default": this.opts.weight,
            },
            // 如果是单捆，开启剩余长度，数量，公斤数输入
            // 如何打开综合下料功能
            // 记录剩余料头数量？
            // {
            //     fieldname: "bbl_number1",
            //     label: __("BBL"),
            //     fieldtype: "Data",
            //     reqd: 1,
            // },
            // {
            //     fieldtype: "Data",
            //     options: "Barcode",
            //     fieldname: "scan_serial_no2",
            //     label: __("Scan Serial No"),
            //     onchange: (v) => {
            //         console.log("base onchange:", v, this);
            //     },
            // },
        ];

        this.dialog = new frappe.ui.Dialog({
            title,
            fields,
            size: "small",
            primary_action_label: primary_label,
            primary_action: (v) => {
                console.log("bbl dialog primary action")
                this.callback(v);
            },
            secondary_action_label: __("Edit Full Form"),
            secondary_action: () => this.edit_full_form(),
        })

        this.dialog.show()

    }


    edit_full_form() {
        console.log("edit full form")
    }



}


