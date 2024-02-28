// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Product Weight Record", {
	refresh(frm) {
        // setDesc(frm)
	},

    // 字段改变event
    semi_product_name(frm) {
        // setDesc(frm);
        frm.trigger("setDesc");
    },

    setDesc(frm) {
        semi_product_name = frm.doc.semi_product_name;
        if (!semi_product_name)
            return
        frappe.db.get_doc("Semi Product", semi_product_name)
            .then((doc) => {
                // console.log("promise doc:", doc);
                let mweight = doc.material_weight;
                let pweight = doc.forge_weight;
                let mratio = doc.material_ratio;
                let desc_name = "标准重量：";
                // console.log("mweight:", mweight, "pweight:", pweight);
                frm.set_df_property("material_ratio", "description", "标准倍尺：" + mratio);
                frm.set_df_property("material_weight", "description", desc_name + mweight);
                frm.set_df_property("product_weight", "description", desc_name + pweight);
                // 新增加的字段自动设值
                frm.set_value("raw_material_type", doc.raw_material_type);
                frm.set_value("diameter", doc.diameter);
            })
    }
});



