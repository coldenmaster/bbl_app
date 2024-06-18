
frappe.provide("bbl");

bbl.BaseDialog = class BaseDialog {
    constructor(frm, item, callback) {
        // this.opts = opts;
        // this.dialog = null;
        this.frm = frm;
        this.item = item;
        this.callback = callback;

        this.make();
    }

    make() {
        let title = this.item?.title || __("BBL");
        let primary_label = __("Submit");
        let fields = [
            {
                fieldname: "bbl_number1",
                label: __("BBL"),
                fieldtype: "Data",
                reqd: 1,
            },
            {
                fieldtype: "Data",
                options: "Barcode",
                fieldname: "scan_serial_no2",
                label: __("Scan Serial No"),
                onchange: (v) => {
                    console.log("base onchange:", v, this);
                },
            },
        ];
        fields = [...fields, ...this.item?.fields]

        this.dialog = new frappe.ui.Dialog({
            title,
            fields,
            primary_action_label: primary_label,
            primary_action: (v) => {
                console.log("bbl dialog primary action")
                this.callback(v);
            },
			secondary_action_label: __("Edit Full Form"),
			secondary_action: () => this.edit_full_form(),
        })

        this.dialog.show()
        this.$scan_btn = this.dialog.$wrapper.find(".link-btn");
		this.$scan_btn.css("display", "inline");
    }


    edit_full_form() {
        console.log("edit full form")
    }



}


