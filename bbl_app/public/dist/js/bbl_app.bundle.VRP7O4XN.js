(() => {
  // ../bbl_app/bbl_app/public/js/map_defaults.js
  var map_settings = frappe.provide("frappe.utils.map_defaults");
  map_settings.center = [32.10899, 112.729214];
  map_settings.zoom = 17;
  map_settings.tiles = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  map_settings.attribution = "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";

  // ../bbl_app/bbl_app/public/js/utils.js
  frappe.provide("bbl");
  bbl.utils = {
    test_str: "abc"
  };
  bbl.utils.t1 = "t12";
  console.log("utils.js loaded");

  // ../bbl_app/bbl_app/public/js/bbl_dialog.js
  frappe.provide("bbl");
  bbl.BaseDialog = class BaseDialog {
    constructor(frm, item, callback) {
      this.frm = frm;
      this.item = item;
      this.callback = callback;
      this.make();
    }
    make() {
      var _a, _b;
      let title = ((_a = this.item) == null ? void 0 : _a.title) || __("BBL");
      let primary_label = __("Submit");
      let fields = [
        {
          fieldname: "bbl_number1",
          label: __("BBL"),
          fieldtype: "Data",
          reqd: 1
        },
        {
          fieldtype: "Data",
          options: "Barcode",
          fieldname: "scan_serial_no2",
          label: __("Scan Serial No"),
          onchange: (v) => {
            console.log("base onchange:", v, this);
          }
        }
      ];
      fields = [...fields, ...(_b = this.item) == null ? void 0 : _b.fields];
      this.dialog = new frappe.ui.Dialog({
        title,
        fields,
        primary_action_label: primary_label,
        primary_action: (v) => {
          console.log("bbl dialog primary action");
          this.callback(v);
        },
        secondary_action_label: __("Edit Full Form"),
        secondary_action: () => this.edit_full_form()
      });
      this.dialog.show();
      this.$scan_btn = this.dialog.$wrapper.find(".link-btn");
      this.$scan_btn.css("display", "inline");
    }
    edit_full_form() {
      console.log("edit full form");
    }
  };
})();
//# sourceMappingURL=bbl_app.bundle.VRP7O4XN.js.map
